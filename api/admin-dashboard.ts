/**
 * File: /api/admin-dashboard.ts
 * Purpose: Secure, rate-limited telemetry API gateway that compiles relational aggregations,
 * web vitals scores, and smart heuristic recommendations.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchDashboardAggregation } from '../lib/db.js';
import { auditRateLimit } from '../lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Rate limit dashboard hits to maintain performance safety (e.g. max 15 requests per minute per IP)
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();

  try {
    const rateLimit = await auditRateLimit(rawIp, 'dashboard-fetch', 15, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Request rate exceeded. Please slow down.' });
    }

    const mode = req.query?.mode as string;
    const startDate = req.query?.startDate as string;
    const endDate = req.query?.endDate as string;
    const data = await fetchDashboardAggregation(mode, startDate, endDate);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error compiling telemetry aggregates:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
