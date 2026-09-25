import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCvMetadata } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const en = getCvMetadata('en');
    const fr = getCvMetadata('fr');
    return res.status(200).json({ en, fr });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to fetch CV metadata" });
  }
}
