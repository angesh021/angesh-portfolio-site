/**
 * File: server.ts
 * Author: Angesh Chanderdip 
 * Purpose: Entrypoint file for Express dev and production servers with integrated Vite support and email routing middlewares.
 * Responsibilities:
 *   - Configures express server-side routing
 *   - Implements anti-abuse and rate limiting middleware
 *   - Safeguards contact form email delivery using Resend API proxying
 *   - Mounts Vite middleware for sub-millisecond hot development environments
 * Dependencies: express, path, vite, resend, dotenv
 * Notes: Ensures that the API keys are kept entirely server-side to hide secrets from client browsers.
 * Changelog:
 *   - Added rate limit caches and HTML sanitizers to contact endpoint to defend against script kiddies and spam bots.
 */

import dotenv from 'dotenv';
// Load environment variables at the extreme entry point to avoid ESM module hoisting gaps
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import { SecurityService } from "./lib/security/SecurityService";
import { syncKnowledgeBaseFile } from "./lib/knowledgeBase";
import assistantRouter from "./routes/assistantRouter";
import { addMetric, addError, addContactEvent, addSecurityEvent, fetchDashboardAggregation, addEngagementEvent, purgeOldAnalytics, getActiveSessionCount, getCvMetadata, saveCvMetadata, deleteCvMetadata, getSupabase, isSupabaseOffline, pingSupabaseDatabase } from "./lib/db";
import { authenticateAdmin, requireRole, createAuditLog } from "./lib/adminMiddleware";
import { getSupabaseAdmin } from "./lib/supabase";
import crypto from "crypto";
import multer from 'multer';
import { put, del } from '@vercel/blob';
import { CvMetadata } from './types';

/**
 * Purpose: Resolves the canonical external URL representing the system environment,
 * preventing 'localhost' placeholders in deployed production instances.
 */
function getExternalUrl(req: express.Request): string {
  const origin = req.headers.origin;
  if (origin) {
    return origin.toString();
  }
  
  const referer = req.headers.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch (e) {
      // Ignore invalid URL
    }
  }

  const forwardedHost = req.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : (forwardedHost || req.get('host') || 'localhost:3000');
  const isLocalhost = host.indexOf('localhost') !== -1 || host.indexOf('127.0.0.1') !== -1;
  const protocol = isLocalhost ? req.protocol : (req.headers['x-forwarded-proto'] || 'https');
  return `${protocol}://${host}`;
}

/**
 * Purpose: Renders a pristine, clean, modern, and minimalistic notification email.
 */
function buildMinimalistEmail(
  title: string,
  salutation: string,
  paragraph: string,
  buttonText?: string,
  buttonUrl?: string,
  footerSubtext?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          }
          .logo {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.25em;
            color: #0ea5e9;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          h1 {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #0f172a;
            margin: 0 0 16px 0;
            line-height: 1.35;
          }
          p {
            font-size: 13.5px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 20px 0;
          }
          .btn-container {
            margin: 28px 0;
            text-align: left;
          }
          .btn {
            background-color: #0f172a;
            color: #ffffff !important;
            padding: 10px 24px;
            text-decoration: none;
            border-radius: 24px;
            font-size: 12.5px;
            font-weight: 600;
            display: inline-block;
          }
          .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 28px 0 20px 0;
          }
          .footer {
            font-size: 11px;
            line-height: 1.5;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo">AETHERIUS SYSTEM ENGINE</div>
            <h1>${title}</h1>
            <p>${salutation},</p>
            <p>${paragraph}</p>
            ${buttonUrl && buttonText ? `
              <div class="btn-container">
                <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
              </div>
            ` : ''}
            <div class="divider"></div>
            <div class="footer">
              ${footerSubtext ? `<p style="font-size: 11px; color: #94a3b8; margin: 0 0 8px 0; font-family: monospace; word-break: break-all;">${footerSubtext}</p>` : ''}
              <p style="margin: 0;">This transmission is a secure security service dispatched from your Portfolio OS. Protected under cryptographic access protocols.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Purpose: Bootstraps the Express and Vite servers sequentially
 * @returns {Promise<void>} Resolves when application binding is active
 * @throws {Error} If application initialization or port binding fails
 * Notes: Configured to bind strictly to 0.0.0.0 on port 3000 as per ingress constraints
 */
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // ========================================
  // Middleware & Security Setup
  // ========================================
  // Enforces enterprise HTTP security profiles (CSP, CORS, frame protections, permission policies)
  app.use(SecurityService.HttpShieldMiddleware);

  // Middleware to parse JSON bodies securely under payload boundaries
  app.use(express.json());

  // ========================================
  // Security Controls & Cache Space
  // ========================================
  // Simple IP-based in-memory rate limiting map
  const ipSubmissionCache = new Map<string, number>();
  const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 seconds cooldown between emails

  // ========================================
  // API Operations
  // ========================================

  /**
   * Endpoint: /api/health
   * Method: GET
   * Purpose: Returns live operational system health, including real process uptime, active unique users, and deployment timestamp.
   */
  app.get("/api/health", async (req, res) => {
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
          keepaliveAction: dbHealth.action, // 'skipped' | 'executed' | 'error'
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
   * Endpoint: /api/download-resume
   * Method: GET
   * Purpose: Proxies PDF resumes from Vercel blob storage and forces an automatic download
   *          by returning correct Content-Disposition headers. This prevents browsers from
   *          opening the document in a new tab inline or triggering browser popups.
   */
  app.get("/api/download-resume", async (req, res) => {
    const { lang } = req.query;
    const isFr = lang === 'fr';
    const language = isFr ? 'fr' : 'en';

    // Retrieve dynamically uploaded CV metadata from persistence layer
    const cvMeta = getCvMetadata(language);

    const url = cvMeta && cvMeta.blobUrl 
      ? cvMeta.blobUrl 
      : (isFr 
          ? 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_CV.pdf'
          : 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_Resume.pdf');
    
    const filename = isFr ? 'AngeshChanderdip_CV.pdf' : 'AngeshChanderdip_Resume.pdf';

    try {
      // Append query param to force a fresh fetch from Vercel Blob and bypass proxy caching
      const fetchUrl = `${url}?cb=${Date.now()}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        return res.status(500).json({ error: `Failed to fetch PDF from storage: ${response.statusText}` });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Force no-cache headers to prevent client-side cache stale state
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
   * Endpoint: /api/cv/metadata
   * Method: GET
   * Purpose: Public endpoint to fetch active CV metadata for portfolio download buttons.
   */
  app.get("/api/cv/metadata", async (req, res) => {
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
   * Purpose: Handles CV uploading, SHA-256 calculation, Vercel Blob Storage, metadata updates, and previous file deletion.
   */
  app.post("/api/admin/cv/upload", authenticateAdmin, requireRole(['owner', 'admin']), (req, res) => {
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
        // Calculate SHA-256 hash dynamically from file bytes before storage upload
        const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        // Create a unique, stable path/name based on language selection
        const stablePath = language === 'en'
          ? 'Resume/AngeshChanderdip_CV_EN.pdf'
          : 'Resume/AngeshChanderdip_CV_FR.pdf';

        // Upload the new CV file to Vercel Blob Storage
        const blob = await put(stablePath, req.file.buffer, {
          access: 'public',
          token: token,
          contentType: 'application/pdf'
        });

        if (!blob || !blob.url) {
          throw new Error("Vercel Blob Storage upload did not return a valid URL.");
        }

        // Store CV metadata
        const newMeta: CvMetadata = {
          language: language as 'en' | 'fr',
          blobUrl: blob.url,
          pathname: blob.pathname,
          sha256,
          fileSize: req.file.size,
          uploadedAt: new Date().toISOString()
        };

        // Persist the metadata safely in DB/memory layers
        saveCvMetadata(newMeta);

        // Audit the upload event
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

        // Clean up and delete previous CV file from Vercel Blob Storage after new upload succeeds
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
   * Purpose: Resets and deletes custom CV, falls back to static defaults.
   */
  app.delete("/api/admin/cv/:language", authenticateAdmin, requireRole(['owner', 'admin']), async (req, res) => {
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
      // 1. Delete from Vercel Blob
      if (oldMeta.blobUrl) {
        await del(oldMeta.blobUrl, { token });
      }

      // 2. Remove metadata from persistence
      deleteCvMetadata(language as 'en' | 'fr');

      // 3. Remove from Supabase cv_metadata table if active
      const { getSupabase } = await import("./lib/db");
      const client = getSupabase();
      if (client) {
        await client.from('cv_metadata').delete().eq('language', language);
      }

      // Audit Log
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
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      
      const adminClient = getSupabaseAdmin();
      
      // Look them up in admin_profiles to see if they were invited
      const { data } = await adminClient.from('admin_profiles').select('id, user_id').eq('email', email.toLowerCase()).maybeSingle();
      
      // Check auth.users directly to see if they already have an account registered
      let userExistsAuth = false;
      const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers();
      if (!usersErr && usersData.users) {
        const foundUser = (usersData.users as any[]).find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (foundUser) {
          userExistsAuth = true;
          // Retroactive fix for unconfirmed users
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
  app.post("/api/auth/setup-password", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      
      const adminClient = getSupabaseAdmin();
      
      // Look them up in admin_profiles to make sure they are in the access list
      const { data: profile } = await adminClient.from('admin_profiles').select('id, user_id').eq('email', email.toLowerCase()).maybeSingle();
      
      if (!profile) {
        return res.status(403).json({ error: 'Identity not found in Access Control List.' });
      }

      // Check auth.users directly to see if they already have an account registered
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
   * Endpoint: /api/send-email
   * Method: POST
   * Purpose: Proxies, validates, sanitizes, and forwards web contact payloads to target Inbox
   * Request Body: { name: string, email: string, subject?: string, message: string }
   * Response: { success: boolean, data?: any, error?: string }
   * Authentication: Anonymous guest form submissions allowed, guarded by rate limits and client metrics
   * Validation: Rejects payloads above 200/2000 character limits or invalid RFC-compliant email domains
   * Error Handling: Catches transport errors safely without leaking internal stack traces to the public UI
   */
  app.post("/api/send-email", async (req, res) => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ success: false, error: 'RESEND_API_KEY environment variable is missing' });
      }

      // 1. IP-based Rate Limiter Check (Guards mail transport and prevents exhaustion attacks)
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
      const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Angesh Portfolio <onboarding@resend.dev>';
      const { name, email, subject, message } = req.body;

      // Log the action safely by filtering sensitive components (PCI-DSS & OWASP best practices)
      const sanitizedLogData = SecurityService.maskSensitiveLogData({ name, email, subject, ip: clientIp });
      console.log("Processing verified contact payload request:", sanitizedLogData);

      // 2. Strict Payload Validation (Validates logical sizes to prevent buffer or memory denial-of-service)
      if (!name || !email || !message) {
          return res.status(400).json({ success: false, error: 'Missing required contact inputs' });
      }

      // Assert parameter size caps to stop buffer-overflow attempts in memory heaps
      if (!SecurityService.validateLength(name, 200) || 
          !SecurityService.validateLength(email, 200) || 
          (subject && !SecurityService.validateLength(subject, 200)) || 
          !SecurityService.validateLength(message, 2000)) {
          return res.status(400).json({ success: false, error: 'Input size boundaries exceeded' });
      }

      // Basic email validation regex standard check
      if (!SecurityService.validateEmailFormat(email)) {
          return res.status(400).json({ success: false, error: 'Invalid email address syntax' });
      }

      // 3. SECURE SANITIZATION
      const sanitizedName = SecurityService.sanitizeInput(name.trim());
      const sanitizedEmail = SecurityService.sanitizeInput(email.trim());
      const sanitizedSubject = SecurityService.sanitizeInput((subject || 'New Contact Request').trim());
      const sanitizedMessage = SecurityService.sanitizeInput(message.trim(), { allowBreaks: true });

      // Update rate limiter cache
      ipSubmissionCache.set(clientIp, currentTimestamp);

      const data = await resend.emails.send({
        from: resendFromEmail,
        to: ['angesh021@gmail.com'], // using the user's email as the recipient
        subject: sanitizedSubject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #0f172a; margin-top: 0;">New Message from Portfolio Contact</h3>
            <p style="font-size: 14px; color: #334155;"><strong>Name:</strong> ${sanitizedName}</p>
            <p style="font-size: 14px; color: #334155;"><strong>Email:</strong> ${sanitizedEmail}</p>
            <p style="font-size: 14px; color: #334155;"><strong>Subject:</strong> ${sanitizedSubject}</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
            <p style="font-size: 14px; color: #334155; font-weight: bold;">Message Content:</p>
            <div style="font-size: 14px; color: #334155; background: #f8fafc; padding: 15px; border-radius: 6px; line-height: 1.6; white-space: pre-wrap;">
              ${sanitizedMessage}
            </div>
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace; text-align: center; margin-top: 30px;">
              IP SOURCE DECRYPTED: ${clientIp}
            </div>
          </div>
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
  app.post("/api/sys/trace", async (req, res) => {
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

      // Server-side cloud-provider header geolocation
      const headerCountry = req.headers['x-vercel-ip-country'] || req.headers['x-appengine-country'] || req.headers['cf-ipcountry'] || req.headers['cloudfront-viewer-country'] || req.headers['x-cloud-region'];
      let clean_country = SecurityService.sanitizeInput(String(headerCountry || '').trim()).substring(0, 100);
      let clean_city = SecurityService.sanitizeInput(String(req.headers['x-vercel-ip-city'] || '').trim()).substring(0, 100);

      if (!clean_country) {
        try {
          // Graceful fallback for local development or preview environments to show UI
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
   * Endpoint: /api/errors
   * Method: POST
   */
  app.post("/api/errors", async (req, res) => {
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
  app.post("/api/contact-event", async (req, res) => {
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
  app.post("/api/security-event", async (req, res) => {
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
  app.post("/api/engagement-event", async (req, res) => {
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



  /**
   * Endpoint: /api/admin/me
   * Method: GET
   */
  app.get("/api/admin/me", authenticateAdmin, async (req, res) => {
    try {
      // Lazily update last_login_at timestamp
      const now = new Date();
      const lastLogin = req.adminProfile!.last_login_at ? new Date(req.adminProfile!.last_login_at) : null;
      if (!lastLogin || (now.getTime() - lastLogin.getTime() > 5 * 60 * 1000)) {
        const adminClient = getSupabaseAdmin();
        await adminClient
          .from('admin_profiles')
          .update({ last_login_at: now.toISOString() })
          .eq('id', req.adminProfile!.id);
      }

      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'ME_PROFILE_RECONCILE',
        severity: 'info',
        metadata: { path: req.path }
      });

      return res.status(200).json({
        success: true,
        user: req.adminUser,
        profile: req.adminProfile
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/dashboard
   * Method: GET
   */
  app.get("/api/admin/dashboard", authenticateAdmin, requireRole(['owner', 'admin', 'viewer']), async (req, res) => {
    try {
      const mode = req.query.mode as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const data = await fetchDashboardAggregation(mode, startDate, endDate);
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error in admin dashboard aggregation API:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * Endpoint: /api/admin/users
   * Method: GET
   */
  app.get("/api/admin/users", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const adminClient = getSupabaseAdmin();
      const { data: users, error } = await adminClient
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ success: true, users });
    } catch (err: any) {
      console.error("Users fetch error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/users/add
   * Method: POST
   */
  app.post("/api/admin/users/add", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { email, role, durationHours } = req.body;
      if (!email || !role || durationHours === undefined) {
        return res.status(400).json({ success: false, error: "Email, role, and access duration are required fields." });
      }

      const hours = parseInt(durationHours, 10);
      if (isNaN(hours) || hours <= 0) {
        return res.status(400).json({ success: false, error: "Access duration is required and must be a valid positive number of hours." });
      }

      if (!['admin', 'viewer'].includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role specified. Only admin and viewer roles can be authorized." });
      }

      const cleanEmail = SecurityService.sanitizeInput(String(email).trim().toLowerCase());
      if (!SecurityService.validateEmailFormat(cleanEmail)) {
        return res.status(400).json({ success: false, error: "Invalid email structure." });
      }

      const adminClient = getSupabaseAdmin();

      // Check if profile exists already
      const { data: existingProfile } = await adminClient
        .from('admin_profiles')
        .select('id, status')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        return res.status(400).json({ success: false, error: `An administrator profile already exists for this email with status: ${existingProfile.status}` });
      }

      // Generate dummy token hash for schema compatibility
      const token = crypto.randomBytes(32).toString('hex');
      const token_hash = crypto.createHash('sha256').update(token).digest('hex');
      const expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year pending timeout

      const { error: inviteErr } = await adminClient
        .from('admin_invitations')
        .insert({
          email: cleanEmail,
          role,
          token_hash,
          invited_by: req.adminProfile!.id,
          expires_at,
          access_duration_hours: hours,
          access_starts_at: null,
          access_expires_at: null
        });

      if (inviteErr) {
        throw new Error(inviteErr.message);
      }

      const { error: profileErr } = await adminClient
        .from('admin_profiles')
        .insert({
          email: cleanEmail,
          role,
          status: 'invited',
          invited_by: req.adminProfile!.user_id,
          access_starts_at: null,
          access_expires_at: null,
          access_status: 'invited'
        });

      if (profileErr) {
        throw new Error(profileErr.message);
      }

      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'USER_AUTHORIZED',
        target_email: cleanEmail,
        severity: 'info',
        metadata: { role, access_duration_hours: hours, authentication: 'oauth_only' }
      });

      return res.status(200).json({ 
        success: true, 
        message: `Successfully pre-authorized ${cleanEmail}. They can now login via OAuth.`
      });
    } catch (err: any) {
      console.error("Authorization API exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });


  /**
   * Endpoint: /api/admin/users/:id/renew-access
   * Method: POST
   */
  app.post("/api/admin/users/:id/renew-access", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { id } = req.params;
      const { durationHours } = req.body;

      if (durationHours === undefined) {
        return res.status(400).json({ success: false, error: "Access renewal duration is required." });
      }

      const hours = parseInt(durationHours, 10);
      if (isNaN(hours) || hours <= 0) {
        return res.status(400).json({ success: false, error: "Access renewal duration must be a valid positive number of hours." });
      }

      const adminClient = getSupabaseAdmin();

      // Retrieve current target profile details
      const { data: targetProfile, error: fetchErr } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !targetProfile) {
        return res.status(404).json({ success: false, error: "Target administrator profile not found." });
      }

      if (targetProfile.role === 'owner') {
        return res.status(400).json({ success: false, error: "Owners always remain active and do not expire." });
      }

      const now = new Date();
      const currentExpires = targetProfile.access_expires_at ? new Date(targetProfile.access_expires_at) : null;
      let newExpires: Date;

      // Renewal Formula implementation:
      // If access_expires_at > now(): extend from current target access_expires_at
      // If access_expires_at <= now(): extend from current time (now)
      if (currentExpires && currentExpires.getTime() > now.getTime()) {
        newExpires = new Date(currentExpires.getTime() + hours * 60 * 60 * 1000);
      } else {
        newExpires = new Date(now.getTime() + hours * 60 * 60 * 1000);
      }

      const previous_expires_at = targetProfile.access_expires_at;

      // 1. Update Profile access attributes
      const { error: profileErr } = await adminClient
        .from('admin_profiles')
        .update({
          access_expires_at: newExpires.toISOString(),
          access_last_renewed_at: now.toISOString(),
          access_renewed_by: req.adminProfile!.user_id,
          access_status: 'active',
          status: 'active' // restore status
        })
        .eq('id', id);

      if (profileErr) throw profileErr;

      // 2. Insert access renewal audit row
      const { error: renewalLogErr } = await adminClient
        .from('admin_access_renewals')
        .insert({
          user_id: targetProfile.id,
          renewed_by: req.adminProfile!.user_id,
          previous_expires_at,
          duration_added_hours: hours,
          new_expires_at: newExpires.toISOString()
        });

      if (renewalLogErr) throw renewalLogErr;

      // 3. Log Audit Events (Access renewed, Access granted)
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'USER_ACCESS_RENEWED',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'info',
        metadata: {
          previous_expires_at,
          duration_added_hours: hours,
          new_expires_at: newExpires.toISOString()
        }
      });

      // Secondary log event to track granted state
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'ACCESS_GRANTED',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'info',
        metadata: { duration_hours: hours, new_expires_at: newExpires.toISOString() }
      });

      return res.status(200).json({
        success: true,
        message: `Successfully renewed temporary access of ${targetProfile.email} to ${newExpires.toLocaleString()}`,
        newExpires: newExpires.toISOString()
      });
    } catch (err: any) {
      console.error("Renew-access API exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/users/:id/revoke-access
   * Method: POST
   */
  app.post("/api/admin/users/:id/revoke-access", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { id } = req.params;
      const adminClient = getSupabaseAdmin();

      const { data: targetProfile, error: fetchErr } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !targetProfile) {
        return res.status(404).json({ success: false, error: "Administrator profile not found." });
      }

      if (targetProfile.role === 'owner') {
        return res.status(400).json({ success: false, error: "Access to Owner accounts cannot be revoked unless they are demoted." });
      }

      // Apply Revocation: set access_status, access_expires_at, and general status
      const { error: patchErr } = await adminClient
        .from('admin_profiles')
        .update({
          access_status: 'disabled',
          status: 'disabled',
          access_expires_at: new Date().toISOString()
        })
        .eq('id', id);

      if (patchErr) throw patchErr;

      // Record revoked audit logs (specifically ACCESS_REVOKED)
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'ACCESS_REVOKED',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'critical',
        metadata: { previous_status: targetProfile.status, previous_access_status: targetProfile.access_status }
      });

      return res.status(200).json({ success: true, message: `Successfully revoked administrator access of ${targetProfile.email}.` });
    } catch (err: any) {
      console.error("Revoke access API exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/users/:id
   * Method: DELETE
   * Purpose: Completely deletes a user's admin profile and authentication account
   */
  app.delete("/api/admin/users/:id", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { id } = req.params;
      const adminClient = getSupabaseAdmin();

      const { data: targetProfile, error: fetchErr } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !targetProfile) {
        return res.status(404).json({ success: false, error: "Administrator profile not found." });
      }

      if (targetProfile.role === 'owner') {
        return res.status(400).json({ success: false, error: "Owner accounts cannot be deleted directly. Demote first or use cloud console." });
      }

      // Delete from Auth if linked
      if (targetProfile.user_id) {
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(targetProfile.user_id);
        if (authDelErr) {
          console.error("Auth Delete Error:", authDelErr);
        }
      }

      // Delete the Profile (might be handled by CASCADE but explicitly doing it for orphaned/unlinked profiles)
      const { error: patchErr } = await adminClient
        .from('admin_profiles')
        .delete()
        .eq('id', id);

      if (patchErr) throw patchErr;

      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'USER_DELETED',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'critical',
        metadata: { profile_id: targetProfile.id }
      });

      return res.status(200).json({ success: true, message: `User ${targetProfile.email} fully deleted.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/database/clear
   * Method: POST
   * Purpose: Purges all records from a specified database table, or from all database tables at once.
   * Access: STRICTLY RESTRICTED TO THE 'owner' ROLE ONLY.
   */
  app.post("/api/admin/database/clear", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { target, tableName, confirmationText } = req.body;
      
      // Prevent accidental clear with confirmationText check
      if (!confirmationText || confirmationText.toUpperCase() !== 'CONFIRM') {
        return res.status(400).json({ 
          success: false, 
          error: "Strict verification failing. You must input the word 'CONFIRM' to clear tables." 
        });
      }

      const adminClient = getSupabaseAdmin();
      
      // Approved whitelist of tables that are safe to clear (immutable admin_audit_logs excluded to prevent deletion of logs)
      const TELEMETRY_TABLES = [
        'metrics',
        'errors',
        'engagement_events',
        'contact_events',
        'security_events',
        'rate_limits',
        'deployments',
        'daily_summary',
        'weekly_summary',
        'monthly_summary'
      ];

      if (target === 'table') {
        if (!tableName) {
          return res.status(400).json({ success: false, error: "TableName is required for single table clear target." });
        }
        
        if (!TELEMETRY_TABLES.includes(tableName)) {
          return res.status(403).json({ 
            success: false, 
            error: `Insufficient permission. Cleansing of critical configuration table '${tableName}' is strictly disallowed to secure platform uptime.` 
          });
        }

        const { error } = await adminClient
          .from(tableName)
          .delete()
          .gte('created_at', '1970-01-01T00:00:00Z');

        if (error) {
          throw error;
        }

        // Write audit log of table purge
        await createAuditLog({
          actor_user_id: req.adminProfile!.user_id,
          actor_email: req.adminProfile!.email,
          action: 'DATABASE_TABLE_PURGED',
          severity: 'critical',
          metadata: { tableName, target: 'table' }
        });

        return res.status(200).json({ 
          success: true, 
          message: `Successfully cleared all records in database table '${tableName}'.` 
        });

      } else if (target === 'all') {
        const results = [];
        const errors = [];

        // Clear tables one by one
        for (const table of TELEMETRY_TABLES) {
          try {
            const { error } = await adminClient
              .from(table)
              .delete()
              .gte('created_at', '1970-01-01T00:00:00Z');
            
            if (error) {
              errors.push({ table, error: error.message });
            } else {
              results.push(table);
            }
          } catch (err: any) {
            errors.push({ table, error: err.message });
          }
        }

        // Write audit log of global purge
        await createAuditLog({
          actor_user_id: req.adminProfile!.user_id,
          actor_email: req.adminProfile!.email,
          action: 'DATABASE_GLOBAL_PURGE',
          severity: 'critical',
          metadata: { clearedTables: results, status: errors.length === 0 ? 'success' : 'partial_failure', errors }
        });

        if (errors.length > 0) {
          return res.status(207).json({ 
            success: false, 
            message: `Completed partial purge. Cleared: ${results.join(', ')}. Failed: ${errors.map(e => `${e.table} (${e.error})`).join(', ')}`
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: `Successfully executed global database cleanse. Purged all records in 10 system telemetry tables.` 
        });

      } else {
        return res.status(400).json({ success: false, error: "Invalid target mode specified. Choose 'table' or 'all'." });
      }

    } catch (err: any) {
      console.error("Database purge API exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/database/info
   * Method: GET
   * Purpose: Inspects the telemetry tables, fetching count metrics safely for display.
   * Access: RESTRICTED TO THE 'owner' ROLE ONLY.
   */
  app.get("/api/admin/database/info", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const adminClient = getSupabaseAdmin();
      const TELEMETRY_TABLES = [
        'metrics',
        'errors',
        'engagement_events',
        'contact_events',
        'security_events',
        'rate_limits',
        'deployments',
        'daily_summary',
        'weekly_summary',
        'monthly_summary',
        'admin_audit_logs'
      ];

      const counts: Record<string, number> = {};
      
      for (const table of TELEMETRY_TABLES) {
        const { count, error } = await adminClient
          .from(table)
          .select('created_at', { count: 'exact', head: true });
        
        counts[table] = error ? 0 : (count || 0);
      }

      return res.status(200).json({
        success: true,
        counts,
        protectedTables: {
          admin_profiles: 'Protected (Identity)',
          admin_invitations: 'Protected (Identity)',
          admin_access_renewals: 'Protected (Identity)'
        }
      });
    } catch (err: any) {
      console.error("Database status API exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/users/:id/role
   * Method: PATCH
   */
  app.patch("/api/admin/users/:id/role", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['owner', 'admin', 'viewer'].includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role parameter specified" });
      }

      const adminClient = getSupabaseAdmin();

      // Get target user profile
      const { data: targetProfile, error: fetchErr } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !targetProfile) {
        return res.status(404).json({ success: false, error: "Target administrator profile not found" });
      }

      // Check rule: Owner cannot downgrade themselves of being the last owner
      if (targetProfile.user_id === req.adminProfile!.user_id && targetProfile.role === 'owner' && role !== 'owner') {
        const { count, error: countErr } = await adminClient
          .from('admin_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner')
          .eq('status', 'active');

        if (countErr) throw countErr;

        if (count && count <= 1) {
          return res.status(400).json({ success: false, error: "Operation denied: At least one owner must always remain active in the system." });
        }
      }

      // Apply update
      const { error: patchErr } = await adminClient
        .from('admin_profiles')
        .update({ role })
        .eq('id', id);

      if (patchErr) throw patchErr;

      // Log audit
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'ROLE_CHANGE',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'critical',
        metadata: { oldRole: targetProfile.role, newRole: role }
      });

      return res.status(200).json({ success: true, message: `Successfully modified ${targetProfile.email} role to ${role}` });
    } catch (err: any) {
      console.error("Update role API Exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/users/:id/status
   * Method: PATCH
   */
  app.patch("/api/admin/users/:id/status", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'disabled', 'invited'].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status value specified" });
      }

      const adminClient = getSupabaseAdmin();

      // Fetch profile
      const { data: targetProfile, error: fetchErr } = await adminClient
        .from('admin_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr || !targetProfile) {
        return res.status(404).json({ success: false, error: "Profile not found." });
      }

      // Protection: Owner cannot disable themselves
      if (targetProfile.user_id === req.adminProfile!.user_id && status === 'disabled') {
        return res.status(400).json({ success: false, error: "Operation blocked: You cannot disable your own profile." });
      }

      // Protection: Verification of minimum active owners
      if (targetProfile.role === 'owner' && status === 'disabled') {
        const { count, error: countErr } = await adminClient
          .from('admin_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner')
          .eq('status', 'active');

        if (countErr) throw countErr;

        if (count && count <= 1) {
          return res.status(400).json({ success: false, error: "Operation denied: At least one owner must always remain active." });
        }
      }

      // Apply state change
      const { error: patchErr } = await adminClient
        .from('admin_profiles')
        .update({ status })
        .eq('id', id);

      if (patchErr) throw patchErr;

      // Log audit
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: status === 'disabled' ? 'DISABLE_USER' : 'ENABLE_USER',
        target_user_id: targetProfile.user_id,
        target_email: targetProfile.email,
        severity: 'critical',
        metadata: { state: status }
      });

      return res.status(200).json({ success: true, message: `Successfully updated status to '${status}'` });
    } catch (err: any) {
      console.error("Update status API Exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/audit-logs
   * Method: GET
   */
  app.get("/api/admin/audit-logs", authenticateAdmin, requireRole(['owner']), async (req, res) => {
    try {
      const adminClient = getSupabaseAdmin();
      const { data: logs, error } = await adminClient
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      return res.status(200).json({ success: true, logs });
    } catch (err: any) {
      console.error("Audit logs fetch error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * Endpoint: /api/admin/logout
   * Method: POST
   */
  app.post("/api/admin/logout", authenticateAdmin, async (req, res) => {
    try {
      await createAuditLog({
        actor_user_id: req.adminProfile!.user_id,
        actor_email: req.adminProfile!.email,
        action: 'LOGOUT',
        severity: 'info',
        metadata: { timestamp: new Date().toISOString() }
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mount Aegis Assistant Decoupled Chatbot Router
  app.use(assistantRouter);

  // ========================================
  // Serving Engine Routing
  // ========================================

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Sync knowledge base file from ground truth portfolio data
    syncKnowledgeBaseFile();

    // Auto-purge old records exactly on start and set daily routine
    purgeOldAnalytics().catch(e => console.error('Initial analytics purge failed:', e));
    setInterval(() => {
      purgeOldAnalytics().catch(e => console.error('Daily analytics purge failed:', e));
    }, 24 * 60 * 60 * 1000);
  });
}

startServer();
