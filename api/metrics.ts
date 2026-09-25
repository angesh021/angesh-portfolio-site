/**
 * File: /api/metrics.ts
 * Purpose: Secure and sanitizing ingestion pipeline for Web Vitals & page visits.
 * Employs privacy-safe hashed rate limiting.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { addMetric } from '../lib/db.js';
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
    // Prevent client flood: max 30 metric packets per minute per IP
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

    // Validate and sanitize parameters with SecurityService
    const clean_page_path = SecurityService.sanitizeInput(String(page_path || '/#hero').trim()).substring(0, 200);
    const clean_device_type = SecurityService.sanitizeInput(String(device_type || 'desktop').trim()).substring(0, 50);
    const clean_browser_family = SecurityService.sanitizeInput(String(browser_family || 'Browser').trim()).substring(0, 100);
    const clean_referrer_domain = SecurityService.sanitizeInput(String(referrer_domain || 'direct').trim()).substring(0, 200);
    // Unique session ID can be passed, or fall back to an anonymous hash computed safely
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
}
