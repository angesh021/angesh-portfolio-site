/**
 * File: /api/security-event.ts
 * Purpose: Secure ingestion pipeline for system defense alarms (brute-force, Turnstile or rate-limit triggers).
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { addSecurityEvent } from '../lib/db.js';
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
    // Limit flood: max 12 security alarm submissions per minute per IP
    const rateLimit = await auditRateLimit(rawIp, 'security-event', 12, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Security emission throttled.' });
    }

    const { event_type, message, severity } = req.body;

    const safe_type = SecurityService.sanitizeInput(String(event_type || 'unauthorized_access').trim()).substring(0, 100);
    const safe_message = SecurityService.sanitizeInput(String(message || 'Access blocked').trim()).substring(0, 1000);
    
    let safeSeverity: 'warn' | 'critical' = 'warn';
    if (severity === 'critical') {
      safeSeverity = 'critical';
    }

    await addSecurityEvent({
      event_type: safe_type,
      message: safe_message,
      severity: safeSeverity
    });

    return res.status(200).json({ success: true, tracking: 'alarm_recorded' });
  } catch (error: any) {
    console.error('Error logging security block telemetry:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
