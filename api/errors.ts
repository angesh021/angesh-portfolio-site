/**
 * File: /api/errors.ts
 * Purpose: Secure ingestion pipeline for JS/React and Asset loading errors with group/severity parameters.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { addError } from '../lib/db.js';
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
    // Limit flood: max 15 error traces per minute per IP
    const rateLimit = await auditRateLimit(rawIp, 'errors', 15, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Error log throttling active.' });
    }

    const { type, message, url, severity } = req.body;

    // Strict validation and mapping
    let errorType: 'js_error' | 'react_error' | 'failed_asset' | 'promise_rejection' | 'api_failure' = 'js_error';
    if (['js_error', 'react_error', 'failed_asset', 'promise_rejection', 'api_failure'].includes(type)) {
      errorType = type;
    }

    const safeMessage = SecurityService.sanitizeInput(String(message || 'Unknown execution trace').trim()).substring(0, 1000);
    const safeUrl = SecurityService.sanitizeInput(String(url || 'unknown source').trim()).substring(0, 500);
    
    let safeSeverity: 'info' | 'warn' | 'critical' = 'critical';
    if (['info', 'warn', 'critical'].includes(severity)) {
      safeSeverity = severity;
    }

    await addError({
      error_type: errorType,
      message: safeMessage,
      url: safeUrl,
      severity: safeSeverity
    });

    return res.status(200).json({ success: true, tracking: 'trace_recorded' });
  } catch (error: any) {
    console.error('Error logging client runtime trace:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
