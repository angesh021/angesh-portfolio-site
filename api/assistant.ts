import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import assistantRouter from '../routes/assistantRouter.js';

const app = express();
app.use(express.json());
app.use(assistantRouter);

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure CORS headers for Vercel Serverless environment
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return (app as any)(req, res);
}
