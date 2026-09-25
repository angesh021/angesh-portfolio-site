import { VercelRequest, VercelResponse } from '@vercel/node';
import { getCvMetadata } from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lang } = req.query;
  const isFr = lang === 'fr';
  const language = isFr ? 'fr' : 'en';

  // Retrieve dynamically uploaded CV metadata from database or fall back to production storage
  const cvMeta = getCvMetadata(language);

  const url = cvMeta && cvMeta.blobUrl 
    ? cvMeta.blobUrl 
    : (isFr 
        ? 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_CV.pdf'
        : 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_Resume.pdf');
  
  const filename = isFr ? 'AngeshChanderdip_CV.pdf' : 'AngeshChanderdip_Resume.pdf';

  try {
    const fetchUrl = `${url}?cb=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch PDF from storage: ${response.statusText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (error: any) {
    console.error("Error downloading resume:", error);
    return res.status(500).json({ error: "Failed to download resume" });
  }
}
