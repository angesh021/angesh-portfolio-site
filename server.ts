/**
 * File: server.ts
 * Author: Angesh Chanderdip 
 * Purpose: Entrypoint file for Express dev and production servers with integrated Vite support.
 * Notes: Shares the unified Express app from ./app.ts with the serverless api/index.ts runtime.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { syncKnowledgeBaseFile } from "./lib/knowledgeBase.js";
import { purgeOldAnalytics } from "./lib/db.js";
import app from "./app.js";

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production with fine-grained HTTP caching headers
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        // Content-hashed bundles in dist/assets receive 1-year immutable caching
        if (filePath.includes(path.sep + 'assets' + path.sep) || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.endsWith('.html')) {
          // HTML files must never be cached so visitors immediately get new site deployments
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
          // General unhashed static assets (favicon, manifest, robots.txt, etc.)
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Sync knowledge base file from ground truth portfolio data
    syncKnowledgeBaseFile();

    // Auto-purge old records exactly on start and set daily routine
    purgeOldAnalytics().catch(e => console.error('Initial analytics purge failed:', e));
    setInterval(() => {
      purgeOldAnalytics().catch(e => console.error('Daily analytics purge failed:', e));
    }, 24 * 60 * 60 * 1000);
  });
}

startServer();
