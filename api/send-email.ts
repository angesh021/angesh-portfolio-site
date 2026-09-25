import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { SecurityService } from '../lib/security/SecurityService.js';

// Simple container-level IP-based in-memory rate limiting map
const ipSubmissionCache = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 60000; // 60 seconds cooldown between emails

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

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

    const { name, email, subject, message } = req.body;

    // Log action safely
    const sanitizedLogData = SecurityService.maskSensitiveLogData({ name, email, subject, ip: clientIp });
    console.log("Vercel Serverless Function - Processing verified contact payload request:", sanitizedLogData);

    // 2. Strict Payload Validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Missing required contact inputs' });
    }

    // Assert parameter size caps to stop buffer-overflow attempts
    if (!SecurityService.validateLength(name, 200) || 
        !SecurityService.validateLength(email, 200) || 
        (subject && !SecurityService.validateLength(subject, 200)) || 
        !SecurityService.validateLength(message, 2000)) {
      return res.status(400).json({ success: false, error: 'Input size boundaries exceeded' });
    }

    // Basic email validation regex
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

    const resend = new Resend(apiKey);
    const data = await resend.emails.send({
      from: 'Angesh Portfolio <onboarding@resend.dev>',
      to: ['angesh021@gmail.com'], // Recipient email
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
            IP SOURCE SERVERLESS: ${clientIp}
          </div>
        </div>
      `,
    });

    if (data.error) {
      console.error('Resend transaction error:', data.error);
      return res.status(500).json({ success: false, error: data.error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Unexpected error during serverless email delivery:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
