/**
 * File: api/index.ts
 * Purpose: Single consolidated Vercel Serverless Function entry point.
 * All /api/* traffic is routed here via vercel.json rewrite rules.
 * This satisfies Vercel Hobby plan's strict limit of maximum 12 Serverless Functions.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}
