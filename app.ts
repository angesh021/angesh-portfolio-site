/**
 * File: app.ts
 * Purpose: Unified Express application for local server and Vercel serverless runtime.
 * Consolidates all API endpoints into a single handler to respect Vercel Hobby plan limits (max 12 functions).
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { Resend } from 'resend';
import { put, del } from '@vercel/blob';

import { SecurityService } from './lib/security/SecurityService.js';
import assistantRouter from './routes/assistantRouter.js';
import authRouter from './routes/authRouter.js';
import adminRouter from './routes/adminRouter.js';
import { 
  addMetric, 
  addError, 
  addContactEvent, 
  addSecurityEvent, 
  fetchDashboardAggregation, 
  addEngagementEvent, 
  getActiveSessionCount, 
  getCvMetadata, 
  saveCvMetadata, 
  deleteCvMetadata, 
  pingSupabaseDatabase 
} from './lib/db.js';
import { authenticateAdmin, requireRole, createAuditLog } from './lib/adminMiddleware.js';
import { getSupabaseAdmin } from './lib/supabase.js';
import { auditRateLimit } from './lib/redis.js';
import { sendTwoFactorCode, verifyTwoFactorCode } from './lib/twoFactorService.js';
import { CvMetadata } from './types.js';

const app = express();

// ========================================
// Middleware & Security Setup
// ========================================

// Enforces enterprise HTTP security profiles
app.use(SecurityService.HttpShieldMiddleware);

// CORS headers for API consumers and preflights
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// JSON body parsing with reasonable limit
app.use(express.json({ limit: '10mb' }));

// In-memory rate limiting map for contact email
const ipSubmissionCache = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 seconds cooldown between emails

// ========================================
// API Routes
// ========================================

/**
 * Endpoint: /api/health
 * Method: GET
 */
app.get(['/api/health', '/health'], async (req: Request, res: Response) => {
  try {
    const [activeUsers, dbHealth] = await Promise.all([
      getActiveSessionCount(5).catch(() => 1),
      pingSupabaseDatabase().catch((e) => ({
        connected: false,
        action: 'error' as const,
        latencyMs: 0,
        source: 'none' as const,
        latestActivity: undefined as string | undefined,
        message: e.message
      }))
    ]);

    res.status(200).json({ 
      status: "nominal",
      uptimeSeconds: process.uptime(),
      deployedAt: "2026-06-11T12:00:00-07:00",
      activeUsers,
      database: {
        provider: "supabase",
        status: dbHealth.connected ? "healthy" : "offline",
        keepaliveAction: dbHealth.action,
        latencyMs: dbHealth.latencyMs,
        source: dbHealth.source,
        latestActivity: dbHealth.latestActivity || null,
        message: dbHealth.message
      }
    });
  } catch (err: any) {
    res.status(200).json({ 
      status: "nominal",
      uptimeSeconds: process.uptime(),
      deployedAt: "2026-06-11T12:00:00-07:00",
      activeUsers: 1,
      error: err.message
    });
  }
});

/**
 * Endpoint: /api/download-resume and /api/resume/download
 * Method: GET
 */
app.get(['/api/download-resume', '/download-resume', '/api/resume/download', '/resume/download'], async (req: Request, res: Response) => {
  const { lang } = req.query;
  const isFr = lang === 'fr';
  const language = isFr ? 'fr' : 'en';

  const cvMeta = getCvMetadata(language);
  const url = cvMeta && cvMeta.blobUrl 
    ? cvMeta.blobUrl 
    : (isFr 
        ? 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_CV.pdf'
        : 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_Resume.pdf');
  
  const filename = isFr ? 'AngeshChanderdip_CV.pdf' : 'AngeshChanderdip_Resume.pdf';

  try {
    const fetchUrl = `${url}?cb=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch PDF from storage: ${response.statusText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (error: any) {
    console.error("Error downloading resume:", error);
    res.status(500).json({ error: "Failed to download resume" });
  }
});

/**
 * Endpoint: /api/cv/metadata and /api/cv-metadata
 * Method: GET
 */
app.get(['/api/cv/metadata', '/cv/metadata', '/api/cv-metadata', '/cv-metadata'], async (req: Request, res: Response) => {
  try {
    const en = getCvMetadata('en');
    const fr = getCvMetadata('fr');
    res.status(200).json({ en, fr });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to fetch CV metadata: ${error.message}` });
  }
});

/**
 * Endpoint: /api/admin/cv/upload
 * Method: POST
 */
app.post(['/api/admin/cv/upload', '/admin/cv/upload'], authenticateAdmin, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
  const userEmail = req.adminProfile?.email?.toLowerCase();
  const userRole = req.adminProfile?.role;
  if (userRole !== 'owner' || userEmail !== 'angesh021@gmail.com') {
    return res.status(403).json({ error: "Access Denied: Only the owner Angesh (angesh021@gmail.com) is authorized to manage CV files." });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Vercel Blob Storage token is not configured on the server." });
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed.'));
      }
      cb(null, true);
    }
  }).single('cvFile');

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { language } = req.body;
    if (!language || (language !== 'en' && language !== 'fr')) {
      return res.status(400).json({ error: "Missing or invalid language. Please choose English ('en') or French ('fr')." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No CV file was uploaded." });
    }

    const oldMeta = getCvMetadata(language as 'en' | 'fr');

    try {
      const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      const stablePath = language === 'en'
        ? 'Resume/AngeshChanderdip_CV_EN.pdf'
        : 'Resume/AngeshChanderdip_CV_FR.pdf';

      const blob = await put(stablePath, req.file.buffer, {
        access: 'public',
        token: token,
        contentType: 'application/pdf'
      });

      if (!blob || !blob.url) {
        throw new Error("Vercel Blob Storage upload did not return a valid URL.");
      }

      const newMeta: CvMetadata = {
        language: language as 'en' | 'fr',
        blobUrl: blob.url,
        pathname: blob.pathname,
        sha256,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString()
      };

      saveCvMetadata(newMeta);

      if (req.adminUser) {
        await createAuditLog({
          actor_user_id: req.adminUser.id,
          actor_email: req.adminUser.email,
          action: `CV_UPLOAD_${language.toUpperCase()}`,
          severity: 'info',
          metadata: {
            pathname: blob.pathname,
            sha256,
            fileSize: req.file.size
          }
        });
      }

      if (oldMeta && oldMeta.blobUrl && oldMeta.blobUrl !== blob.url) {
        try {
          await del(oldMeta.blobUrl, { token });
          console.log(`Successfully deleted stale CV file: ${oldMeta.blobUrl}`);
        } catch (delError: any) {
          console.error(`Failed to clean up stale CV file ${oldMeta.blobUrl}:`, delError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `CV for ${language === 'en' ? 'English' : 'French'} successfully uploaded!`,
        metadata: newMeta
      });
    } catch (uploadError: any) {
      console.error("CV Upload Failed:", uploadError);
      return res.status(500).json({ error: `Upload process failed: ${uploadError.message}` });
    }
  });
});

/**
 * Endpoint: /api/admin/cv/:language
 * Method: DELETE
 */
app.delete(['/api/admin/cv/:language', '/admin/cv/:language'], authenticateAdmin, requireRole(['owner', 'admin']), async (req: Request, res: Response) => {
  const userEmail = req.adminProfile?.email?.toLowerCase();
  const userRole = req.adminProfile?.role;
  if (userRole !== 'owner' || userEmail !== 'angesh021@gmail.com') {
    return res.status(403).json({ error: "Access Denied: Only the owner Angesh (angesh021@gmail.com) is authorized to manage CV files." });
  }

  const { language } = req.params;
  if (language !== 'en' && language !== 'fr') {
    return res.status(400).json({ error: "Invalid language. Must be 'en' or 'fr'." });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Vercel Blob Storage token is not configured on the server." });
  }

  const oldMeta = getCvMetadata(language as 'en' | 'fr');
  if (!oldMeta) {
    return res.status(404).json({ error: `No custom CV metadata found for language '${language}' to delete.` });
  }

  try {
    if (oldMeta.blobUrl) {
      await del(oldMeta.blobUrl, { token });
    }

    deleteCvMetadata(language as 'en' | 'fr');

    const { getSupabase } = await import("./lib/db.js");
    const client = getSupabase();
    if (client) {
      await client.from('cv_metadata').delete().eq('language', language);
    }

    if (req.adminUser) {
      await createAuditLog({
        actor_user_id: req.adminUser.id,
        actor_email: req.adminUser.email,
        action: `CV_DELETE_${language.toUpperCase()}`,
        severity: 'warning',
        metadata: {
          pathname: oldMeta.pathname
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `CV for ${language === 'en' ? 'English' : 'French'} successfully deleted.`
    });
  } catch (error: any) {
    console.error("CV deletion failed:", error);
    return res.status(500).json({ error: `CV deletion failed: ${error.message}` });
  }
});

/**
 * Endpoint: /api/auth/check-email
 * Method: POST
 */
app.post(['/api/auth/check-email', '/auth/check-email'], async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    const adminClient = getSupabaseAdmin();
    const { data } = await adminClient.from('admin_profiles').select('id, user_id').eq('email', email.toLowerCase()).maybeSingle();
    
    let userExistsAuth = false;
    const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers();
    if (!usersErr && usersData.users) {
      const foundUser = (usersData.users as any[]).find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (foundUser) {
        userExistsAuth = true;
        if (!foundUser.email_confirmed_at && data) {
          await adminClient.auth.admin.updateUserById(foundUser.id, { email_confirm: true });
        }
      }
    }
    
    const isFirstTime = !userExistsAuth && !(data && data.user_id);
    
    res.status(200).json({ 
      isFirstTime, 
      exists: !!data || userExistsAuth,
      inAccessList: !!data
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Endpoint: /api/auth/setup-password
 * Method: POST
 */
app.post(['/api/auth/setup-password', '/auth/setup-password'], async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const adminClient = getSupabaseAdmin();
    const { data: profile } = await adminClient.from('admin_profiles').select('id, user_id').eq('email', email.toLowerCase()).maybeSingle();
    
    if (!profile) {
      return res.status(403).json({ error: 'Identity not found in Access Control List.' });
    }

    let userExistsAuth = false;
    const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers();
    if (!usersErr && usersData.users) {
      userExistsAuth = (usersData.users as any[]).some(u => u.email?.toLowerCase() === email.toLowerCase());
    }
    
    if (userExistsAuth || profile.user_id) {
      return res.status(400).json({ error: 'User already exists. Please login instead.' });
    }

    const { error: createErr } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (createErr) throw createErr;
    
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Endpoint: /api/auth/send-2fa
 * Method: POST
 */
app.post(['/api/auth/send-2fa', '/auth/send-2fa'], async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const result = await sendTwoFactorCode(email);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in send-2fa handler:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error sending 2FA' });
  }
});

/**
 * Endpoint: /api/auth/verify-2fa
 * Method: POST
 */
app.post(['/api/auth/verify-2fa', '/auth/verify-2fa'], async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit code are required' });
    }

    const result = await verifyTwoFactorCode(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in verify-2fa handler:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error verifying 2FA' });
  }
});

/**
 * Endpoint: /api/send-email
 * Method: POST
 */
app.post(['/api/send-email', '/send-email'], async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
       return res.status(500).json({ success: false, error: 'RESEND_API_KEY environment variable is missing' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const currentTimestamp = Date.now();
    
    if (ipSubmissionCache.has(clientIp)) {
      const lastSubmitted = ipSubmissionCache.get(clientIp)!;
      if (currentTimestamp - lastSubmitted < RATE_LIMIT_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (currentTimestamp - lastSubmitted)) / 1000);
        return res.status(429).json({ 
          success: false, 
          error: `Rate limit active. Please wait ${remainingSeconds} seconds before sending another message.` 
        });
      }
    }

    const resend = new Resend(apiKey);
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Angesh Portfolio Security <verification@angesh.jo3.org>';
    const { name, email, subject, message, company } = req.body;

    const sanitizedLogData = SecurityService.maskSensitiveLogData({ name, email, subject, ip: clientIp });
    console.log("Processing verified contact payload request:", sanitizedLogData);

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Missing required contact inputs' });
    }

    if (!SecurityService.validateLength(name, 200) || 
        !SecurityService.validateLength(email, 200) || 
        (company && !SecurityService.validateLength(company, 200)) ||
        (subject && !SecurityService.validateLength(subject, 200)) || 
        !SecurityService.validateLength(message, 2000)) {
        return res.status(400).json({ success: false, error: 'Input size boundaries exceeded' });
    }

    if (!SecurityService.validateEmailFormat(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address syntax' });
    }

    const sanitizedName = SecurityService.sanitizeInput(name.trim());
    const sanitizedEmail = SecurityService.sanitizeInput(email.trim());
    const sanitizedSubject = SecurityService.sanitizeInput((subject || 'New Contact Request').trim());
    const sanitizedCompany = company && company !== 'Not provided' ? SecurityService.sanitizeInput(String(company).trim()) : '';
    const sanitizedMessage = SecurityService.sanitizeInput(message.trim(), { allowBreaks: true });
    const plainTextMessage = sanitizedMessage.replace(/<br\s*\/?>/gi, '\n');

    ipSubmissionCache.set(clientIp, currentTimestamp);

    const submissionDate = new Date().toUTCString();

    const data = await resend.emails.send({
      from: resendFromEmail,
      to: ['angesh021@gmail.com'],
      replyTo: sanitizedEmail,
      subject: `[Portfolio Inquiry] ${sanitizedSubject} · ${sanitizedName}`,
      text: `NEW PORTFOLIO MESSAGE\n================================\n\nFrom: ${sanitizedName}\nEmail: ${sanitizedEmail}\n${sanitizedCompany ? `Company: ${sanitizedCompany}\n` : ''}Subject: ${sanitizedSubject}\nDate: ${submissionDate}\nSource IP: ${clientIp}\n\n--- MESSAGE ---\n${plainTextMessage}\n\n----------------\nReply directly to this email or send a response to: ${sanitizedEmail}\nDelivered via Angesh Chanderdip Portfolio Security Relay`,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Entity-Ref-ID': `contact-${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`
      },
      html: `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Inquiry · Angesh Chanderdip</title>
          <style type="text/css">
            body { margin: 0 !important; padding: 0 !important; background-color: #0b0f17 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; color: #ffffff !important; }
            .email-container { max-width: 580px !important; width: 100% !important; margin: 0 auto !important; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f17; width: 100%; padding: 36px 12px;">
            <tr>
              <td align="center">
                <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; text-align: left;">
                  <tr>
                    <td align="left" style="padding-bottom: 22px;">
                      <div style="display: inline-block; background-color: #1e293b; border: 1px solid #334155; border-radius: 9999px; padding: 6px 16px; margin-bottom: 14px;">
                        <span style="font-size: 12px; font-weight: 800; color: #38bdf8; letter-spacing: 0.06em; text-transform: uppercase;">
                          🛡️ Angesh Chanderdip · Portfolio Contact
                        </span>
                      </div>
                      <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff !important;">
                        New Message Received
                      </h1>
                      <p style="margin: 0; font-size: 14.5px; color: #cbd5e1 !important; line-height: 1.5;">
                        A new inquiry was submitted on your website by <strong style="color: #ffffff !important;">${sanitizedName}</strong>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 20px;">
                      <div style="background-color: #161f30; border: 1px solid #283750; border-radius: 16px; padding: 22px 24px;">
                        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: #94a3b8; text-transform: uppercase; margin-bottom: 14px; border-bottom: 1px solid #23334d; padding-bottom: 8px;">
                          Sender Information
                        </div>
                        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 6px 0; width: 110px; font-size: 13px; font-weight: 700; color: #94a3b8;">From:</td>
                            <td style="padding: 6px 0; font-size: 16px; font-weight: 700; color: #ffffff;">${sanitizedName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; width: 110px; font-size: 13px; font-weight: 700; color: #94a3b8;">Email:</td>
                            <td style="padding: 6px 0;"><a href="mailto:${sanitizedEmail}" style="font-size: 15px; font-weight: 700; color: #38bdf8; text-decoration: underline;">${sanitizedEmail}</a></td>
                          </tr>
                          ${sanitizedCompany ? `
                          <tr>
                            <td style="padding: 6px 0; width: 110px; font-size: 13px; font-weight: 700; color: #94a3b8;">Company:</td>
                            <td style="padding: 6px 0; font-size: 15px; font-weight: 600; color: #f1f5f9;">${sanitizedCompany}</td>
                          </tr>` : ''}
                          <tr>
                            <td style="padding: 6px 0; width: 110px; font-size: 13px; font-weight: 700; color: #94a3b8;">Subject:</td>
                            <td style="padding: 6px 0; font-size: 15.5px; font-weight: 700; color: #ffffff;">${sanitizedSubject}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 24px;">
                      <div style="background-color: #0d1424; border: 1px solid #283750; border-left: 5px solid #38bdf8; border-radius: 14px; padding: 22px 24px;">
                        <div style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.1em; color: #38bdf8; text-transform: uppercase; margin-bottom: 12px;">
                          Message Content
                        </div>
                        <div style="font-size: 16px; line-height: 1.7; color: #ffffff !important; white-space: pre-wrap; word-break: break-word;">
${sanitizedMessage}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="padding-bottom: 28px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="mailto:${sanitizedEmail}?subject=Re:%20${encodeURIComponent(sanitizedSubject)}" style="display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; border-radius: 10px; padding: 14px 34px; font-weight: 700; font-size: 15px;">
                              Reply to ${sanitizedName} →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="left">
                      <div style="background-color: #0b101b; border: 1px solid #1c263c; border-radius: 12px; padding: 18px 20px;">
                        <div style="font-size: 12px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px;">
                          Angesh Chanderdip · Defense & Cybersecurity Systems Engineering
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; line-height: 1.5; font-family: monospace;">
                          Relay: Aegis Secure Transmission · Delivered to angesh021@gmail.com<br>
                          Received: ${submissionDate} · Source IP: ${clientIp}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (data.error) {
       console.error('Error sending email:', data.error);
       return res.status(500).json({ success: false, error: data.error.message });
    }

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Unexpected error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/sys/trace
 * Method: POST
 */
app.post(['/api/sys/trace', '/sys/trace'], async (req: Request, res: Response) => {
  try {
    const { page, referrer } = req.body;
    
    const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientIp = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw.split(',')[0];
    
    const salt = process.env.SECRET_SALT || 'sre-privacy-salt-2026';
    const ipHash = crypto.createHash('sha256').update(clientIp + salt).digest('hex');

    const userAgent = req.headers['user-agent'] || '';
    let browser_family = 'Other';
    if (userAgent.includes('Firefox')) browser_family = 'Firefox';
    else if (userAgent.includes('Edg')) browser_family = 'Edge';
    else if (userAgent.includes('Chrome') || userAgent.includes('CriOS')) browser_family = 'Chrome';
    else if (userAgent.includes('Safari')) browser_family = 'Safari';

    let device_type = 'Desktop';
    if (userAgent.match(/Mobi|Android|iPhone/i)) device_type = 'Mobile';
    else if (userAgent.match(/Tablet|iPad/i)) device_type = 'Tablet';

    let referrer_domain = 'direct';
    try {
      if (referrer) {
        const url = new URL(referrer);
        referrer_domain = url.hostname.replace(/^www\./, '');
      }
    } catch {}

    const clean_page_path = SecurityService.sanitizeInput(String(page || '/#hero').trim()).substring(0, 200);

    const headerCountry = req.headers['x-vercel-ip-country'] || req.headers['x-appengine-country'] || req.headers['cf-ipcountry'] || req.headers['cloudfront-viewer-country'] || req.headers['x-cloud-region'];
    let clean_country = SecurityService.sanitizeInput(String(headerCountry || '').trim()).substring(0, 100);
    let clean_city = SecurityService.sanitizeInput(String(req.headers['x-vercel-ip-city'] || '').trim()).substring(0, 100);

    if (!clean_country) {
      try {
        if (clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('172.') || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
          clean_country = 'Canada';
          clean_city = 'Montreal';
        } else {
          const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.country_name) {
              clean_country = geoData.country_name;
              clean_city = geoData.city || 'Unknown';
            }
          }
        }
      } catch (e) {
        clean_country = 'Unknown';
      }
    }

    await addMetric({
      page_path: clean_page_path,
      load_time_ms: 0,
      lcp_ms: null,
      cls: null,
      inp_ms: null,
      device_type,
      browser_family,
      referrer_domain,
      session_id: ipHash,
      country: clean_country || 'Unknown',
      city: clean_city || 'Local'
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in analytics API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/metrics
 * Method: POST
 */
app.post(['/api/metrics', '/metrics'], async (req: Request, res: Response) => {
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();

  try {
    const rateLimit = await auditRateLimit(rawIp, 'metrics', 30, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Excessive telemetry logging attempts blocked.' });
    }

    const { 
      page_path, 
      load_time_ms, 
      ttfb_ms, 
      fcp_ms, 
      lcp_ms, 
      cls, 
      inp_ms, 
      device_type, 
      browser_family, 
      referrer_domain,
      session_id,
      is_returning,
      entry_page,
      exit_page
    } = req.body;

    const clean_page_path = SecurityService.sanitizeInput(String(page_path || '/#hero').trim()).substring(0, 200);
    const clean_device_type = SecurityService.sanitizeInput(String(device_type || 'desktop').trim()).substring(0, 50);
    const clean_browser_family = SecurityService.sanitizeInput(String(browser_family || 'Browser').trim()).substring(0, 100);
    const clean_referrer_domain = SecurityService.sanitizeInput(String(referrer_domain || 'direct').trim()).substring(0, 200);
    const clean_session_id = SecurityService.sanitizeInput(String(session_id || 'S-UNKNOWN').trim()).substring(0, 64);

    const timeLoad = Math.max(0, parseInt(load_time_ms) || 0);
    const timeTTFB = ttfb_ms !== undefined ? Math.max(0, parseInt(ttfb_ms) || 0) : undefined;
    const timeFCP = fcp_ms !== undefined ? Math.max(0, parseInt(fcp_ms) || 0) : undefined;
    const timeLCP = lcp_ms !== undefined && lcp_ms !== null ? Math.max(0, parseInt(lcp_ms) || 0) : null;
    const valCLS = cls !== undefined && cls !== null ? Math.max(0, parseFloat(cls) || 0) : null;
    const timeINP = inp_ms !== undefined && inp_ms !== null ? Math.max(0, parseInt(inp_ms) || 0) : null;

    await addMetric({
      page_path: clean_page_path,
      load_time_ms: timeLoad,
      ttfb_ms: timeTTFB,
      fcp_ms: timeFCP,
      lcp_ms: timeLCP,
      cls: valCLS,
      inp_ms: timeINP,
      device_type: clean_device_type,
      browser_family: clean_browser_family,
      referrer_domain: clean_referrer_domain,
      session_id: clean_session_id,
      is_returning: Boolean(is_returning),
      entry_page: entry_page ? SecurityService.sanitizeInput(String(entry_page).trim()).substring(0, 200) : null,
      exit_page: exit_page ? SecurityService.sanitizeInput(String(exit_page).trim()).substring(0, 200) : null
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error handling metrics telemetry:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/errors
 * Method: POST
 */
app.post(['/api/errors', '/errors'], async (req: Request, res: Response) => {
  try {
    const { type, message, url, session_id } = req.body;
    const safeType = type === 'failed_asset' ? 'failed_asset' : 'js_error';
    const safeMessage = SecurityService.sanitizeInput(String(message || 'Unknown javascript execution error').trim()).substring(0, 1000);
    const safeUrl = SecurityService.sanitizeInput(String(url || 'unknown source').trim()).substring(0, 500);
    const safe_session = session_id ? SecurityService.sanitizeInput(String(session_id).trim()).substring(0, 100) : undefined;

    await addError({
      error_type: safeType,
      message: safeMessage,
      url: safeUrl,
      severity: 'warn',
      session_id: safe_session
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in errors API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/contact-event
 * Method: POST
 */
app.post(['/api/contact-event', '/contact-event'], async (req: Request, res: Response) => {
  try {
    const { success, turnstile_result, session_id } = req.body;
    const bSuccess = Boolean(success);
    const clean_turnstile = SecurityService.sanitizeInput(String(turnstile_result || 'none').trim()).substring(0, 100);
    const safe_session = session_id ? SecurityService.sanitizeInput(String(session_id).trim()).substring(0, 100) : undefined;

    await addContactEvent({
      success: bSuccess,
      turnstile_result: clean_turnstile,
      session_id: safe_session
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in contact event API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/security-event
 * Method: POST
 */
app.post(['/api/security-event', '/security-event'], async (req: Request, res: Response) => {
  try {
    const { event_type, message, session_id } = req.body;
    const safe_type = SecurityService.sanitizeInput(String(event_type || 'unauthorized_access').trim()).substring(0, 100);
    const safe_message = SecurityService.sanitizeInput(String(message || 'Access blocked by standard security policies').trim()).substring(0, 1000);
    const safe_session = session_id ? SecurityService.sanitizeInput(String(session_id).trim()).substring(0, 100) : undefined;

    await addSecurityEvent({
      event_type: safe_type,
      message: safe_message,
      session_id: safe_session
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in security event API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/engagement-event
 * Method: POST
 */
app.post(['/api/engagement-event', '/engagement-event'], async (req: Request, res: Response) => {
  try {
    const { event_type, target_id, session_id } = req.body;
    if (!event_type) return res.status(400).json({ success: false, error: 'Missing event_type' });
    const safe_session = session_id ? SecurityService.sanitizeInput(String(session_id).trim()).substring(0, 100) : undefined;

    await addEngagementEvent({
      event_type: String(event_type),
      target_id: target_id ? String(target_id) : 'general',
      session_id: safe_session
    });
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in engagement event API:', error);
    res.status(500).json({ success: false, error: 'Failed to record event' });
  }
});

// ========================================
// Mount Feature Routers
// ========================================

// Mount assistant, auth, and admin routers
app.use(assistantRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/portfolio-assistant', assistantRouter);

app.use(authRouter);
app.use('/api/auth', authRouter);

app.use(adminRouter);
app.use('/api/admin', adminRouter);

export default app;
export { app };
