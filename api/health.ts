import { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveSessionCount, pingSupabaseDatabase } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce standard CORS headers for safety
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    return res.status(200).json({ 
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
    return res.status(200).json({ 
      status: "nominal",
      uptimeSeconds: process.uptime(),
      deployedAt: "2026-06-11T12:00:00-07:00",
      activeUsers: 1,
      error: err.message
    });
  }
}

