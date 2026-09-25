/**
 * File: /api/engagement-event.ts
 * Purpose: Secure, validated Vercel endpoint to track visitor clicks, downloads, and social engagement actions.
 * Limits flood requests using anonymized Redis rate limit protection.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { addEngagementEvent } from '../lib/db.js';
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

  // Obtain safe anonymized IP for rate limiting audits
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();

  try {
    const rateLimit = await auditRateLimit(rawIp, 'engagement', 40, 60); // Max 40 interactions per minute per IP
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Excessive interaction activity blocked.' });
    }

    const { event_type, target_id } = req.body;

    // Strict sanitization and validation
    const cleanEventType = SecurityService.sanitizeInput(String(event_type || 'click').trim()).substring(0, 80);
    const cleanTargetId = SecurityService.sanitizeInput(String(target_id || 'general').trim()).substring(0, 200);

    await addEngagementEvent({
      event_type: cleanEventType,
      target_id: cleanTargetId
    });

    return res.status(200).json({ success: true, tracking: 'engagement_logged' });
  } catch (error: any) {
    console.error('Error handling engagement logs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
