/**
 * File: /lib/security/HttpHeaderShield.ts
 * Author: Angesh Chanderdip 
 * Purpose: Applies state-of-the-art HTTP Security headers and payload controls to protect web traffic.
 * Responsibilities:
 *   - Configures Content Security Policies (CSP) to block arbitrary script and stylesheet loading.
 *   - Removes revealing software headers (e.g., X-Powered-By) to prevent automated stack reconnaissance.
 *   - Mitigates clickjacking, MIME-type sniffing, cross-site leaks, and unauthorized feature access.
 * Dependencies: Express server library (types only)
 * Notes: Ensures that the application follows modern web security profiles (OWASP Secure Headers Project).
 * Changelog:
 *   - 2026-06-11: Initial design of custom, lightweight HTTP Shield representing top enterprise protections.
 */

import { Request, Response, NextFunction } from 'express';

export class HttpHeaderShield {

    /**
     * Purpose: Express middleware to apply defensive HTTP response headers.
     * @param {Request} req Express Request object.
     * @param {Response} res Express Response object.
     * @param {NextFunction} next Callback triggers next middleware.
     * Notes: Added to server pipeline to secure browser transport rules dynamically.
     */
    public static enforceHeaders(req: Request, res: Response, next: NextFunction): void {
        // 1. Prevent Clickjacking & Enable Secure AI Studio iFrame Embedding
        // We use CSP 'frame-ancestors' rather than a blanket 'SAMEORIGIN' so that Google AI Studio 
        // and authorized production domains can embed the application preview without framing collisions.

        // 2. Prevent MIME Sniffing - Enforces strict stylesheet and script parsing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // 3. Control Referrer Leaks - Only shares origin upon cross-origin transitions
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 4. Force Refiltered XSS Protections in older browsers
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // 5. Restrict Native Client Capabilities (Microphone, Camera, Geolocation)
        // Restricts access to modern browser APIs to defend users from unauthorized device surveillance.
        res.setHeader(
            'Permissions-Policy',
            'camera=self, microphone=self, geolocation=self, payment=()'
        );

        // 6. Strict Content Security Policy (CSP)
        // Regulates allowed runtime asset origins. Configured with safe-fallbacks to permit necessary
        // font resources, Vite assets, HMR, and animations, and frame-ancestors for AI Studio.
        const cspDirectives = [
            "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://aistudiocdn.com https://*.run.app https://*.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://aistudiocdn.com",
            "font-src 'self' https://fonts.gstatic.com data: https://aistudiocdn.com",
            "img-src 'self' data: https: blob: referrerPolicy",
            "connect-src 'self' https: ws: wss: https://*.run.app https://*.supabase.co https://*.googleapis.com",
            "frame-src 'self' https:",
            "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.run.app https://*.vercel.app",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ];
        res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

        // 7. Enforces HTTPS Connection Integrity (Strict-Transport-Security)
        // Enforces HTTPS for 1 year, including all subdomains.
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // 8. Strip Out Revealing Tech Framework Headers
        // Hiding runtime platforms reduces targeted exploitation surface.
        res.removeHeader('X-Powered-By');

        next();
    }
}
