/**
 * File: /api/contact-event.ts
 * Purpose: Secure ingestion pipeline to capture contact conversions, completions, and spam/verification details.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { addContactEvent } from '../lib/db.js';
import { SecurityService } from '../lib/security/SecurityService.js';
import { auditRateLimit } from '../lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();

  try {
    // Limit flood: max 10 contact actions per minute per IP
    const rateLimit = await auditRateLimit(rawIp, 'contact-event', 10, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Excessive contact activities blocked.' });
    }

    const { success, failure_reason, turnstile_result, completed, abandoned } = req.body;

    const bSuccess = Boolean(success);
    const cleanTurnstile = SecurityService.sanitizeInput(String(turnstile_result || 'none').trim()).substring(0, 100);
    
    // Optional details
    const cleanReason = failure_reason ? SecurityService.sanitizeInput(String(failure_reason).trim()).substring(0, 80) : undefined;
    const bCompleted = completed !== undefined ? Boolean(completed) : true;
    const bAbandoned = abandoned !== undefined ? Boolean(abandoned) : false;

    await addContactEvent({
      success: bSuccess,
      failure_reason: cleanReason,
      turnstile_result: cleanTurnstile,
      completed: bCompleted,
      abandoned: bAbandoned
    });

    return res.status(200).json({ success: true, tracking: 'conversion_logged' });
  } catch (error: any) {
    console.error('Error logging contact conversion metrics:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
