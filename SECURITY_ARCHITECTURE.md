# Codebase Security Architecture & Regulatory Compliance

This document describes the design patterns, modular folders, and multi-layered cybersecurity measures integrated. The codebase implements the **Security-as-a-Service Facade Pattern** centered inside the `/lib/security/` folder directory to decouple, consolidate, and maintain security layers cleanly across both Client (React) and Server (Express) environments.

---

## 1. Unified Security Service Registry

All core interfaces, API endpoints, and user interfaces request security clearances strictly through the centralized `SecurityService` orchestrator:

```
                  ┌──────────────────────────────┐
                  │      Client & Server         │
                  │   Consumers (Form/API)       │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    SecurityService Facade    │
                  │ (Single Point of Registry)   │
                  └──────┬────┬───────┬────┬─────┘
                         │    │       │    │
      ┌──────────────────┘    │       │    └──────────────────┐
      ▼                       ▼       ▼                       ▼
┌──────────────┐        ┌───────────┐ ┌───────────┐     ┌──────────────┐
│XssSanitizer  │        │RateLimiter│ │PayloadVal │     │LogObfuscator │
│ (XSS Escapes)│        │ (Timing)  │ │ (Capping) │     │(Telemetry)   │
└──────────────┘        └─────┬─────┘ └───────────┘     └──────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌──────────────────┐                    ┌──────────────────┐
│BruteForceDefender│                    │  SessionShield   │
│ (Login Cooldown) │                    │ (Cryp Timeouts)  │
└──────────────────┘                    └──────────────────┘
```

---

## 2. Directory Structure & Defense-in-Depth Modules

Every safety policy resides inside a highly modular, single-responsibility file inside `/lib/security/`:

### A. HTTP Headers & Traffic Control (`/lib/security/HttpHeaderShield.ts`)
*   **Purpose:** Protects user sessions from client-side dynamic attacks.
*   **Express Middleware Integration:** Embedded globally in `server.ts` to enforce the following response structures on all web assets and API channels:
    *   `Content-Security-Policy (CSP)`: Disallows unauthorized third-party scripts, base URIs, or form targets, mitigating arbitrary code injection.
    *   `X-Frame-Options: SAMEORIGIN`: Disallows clickjacking and framing by external origins.
    *   `X-Content-Type-Options: nosniff`: Prevents browsers from loading documents with missing MIME types, blocking drive-by malware.
    *   `Strict-Transport-Security (HSTS)`: Locks dynamic client-server exchanges to standard HTTPS security ports for 1 year.
    *   `Permissions-Policy`: Hard-blocks browser access to auxiliary hardware peripherals (e.g. camera, microphone, geolocation) to secure device privacy.
    *   `X-XSS-Protection`: Triggers native blocking filters inside legacy client browsers.
    *   *Platform obfuscation*: Removes the `X-Powered-By` header to hide software stacks from bots.

### B. Brute-Force & Account Defender (`/lib/security/BruteForceDefender.ts`)
*   **Purpose:** Protects credentials entryways and mitigates automated credential-guessing.
*   **Key Controls:**
    *   *Access Auditing Check*: Prior to starting any credentials checks, inspects login patterns.
    *   *Exponential Penalty Cooling*: Scales delay thresholds sequentially based on error metrics (Attempts count multiplied by penalty duration), rendering brute-force speeds practically infinite.
    *   *Temporary Account Suspension*: Locks accounts temporarily for 5 minutes when failure count limits are exceeded.

### C. Signed Administrative Session Shield (`/lib/security/SessionShield.ts`)
*   **Purpose:** Protects administrative state channels and handles interactive inactivity expirations.
*   **Key Controls:**
    *   *Session Signature / Checksum Verification*: Generates dynamic high-entropy tokens and binds them with linear FNV-1a hashing algorithms linked to an internal system salt. Manual adjustments of session storage keys will flag as tampered and trigger immediate session termination.
    *   *Idle Window Termination*: Automatically terminates the session if no activity occurs within a 15-minute window.
    *   *Absolute Lease Expirations*: Imposes a maximum 30-minute lock on tokens, mandating re-authentication.
    *   *Frictionless Persistence*: Automatically restores valid active sessions on page reload so administrators do not lose work.

### D. Server-Side Logging Obfuscator (`/lib/security/LogObfuscator.ts`)
*   **Purpose:** Ensures enterprise compliance (e.g., GDPR, PCI-DSS, SOC2) by keeping personal identifiers or API keys clean within server stdout logs.
*   **Key Controls:**
    *   *Recursive Traversal*: Dives into complex nested dictionaries to spot target security strings (`apiKey`, `password`, `token`, `email`, `message`).
    *   *Partial Masking*: Scrubs secret parameters down to safe visual tokens (e.g. `pa***rd`) to assist server diagnostics while hiding explicit keys.

### E. Static Schema Verification (`/lib/security/PayloadValidator.ts`)
*   **Purpose:** Governs mathematical data size limits and protects heap resources.
*   **Key Controls:**
    *   *Buffer Guards*: Rejects fields exceeding maximum limits (e.g., messages over 2000 chars), preventing memory overflow Denial of Service (DoS) attacks.
    *   *Catastrophic Backtracking Prevention*: Applies regex filters to incoming emails safely, protecting server processors from CPU exhausting loops.
    *   *Honeypot Decoy Trapping*: Monitors invisible field structures designed to trap blind scraper scripts.

### F. XSS Escaping Engine (`/lib/security/XssSanitizer.ts`)
*   **Purpose:** Encodes vulnerable input symbols (`&`, `<`, `>`, `"`, `'`) directly into safe, displays-ready HTML character references to keep cross-site script triggers neutral.

---

## 3. End-to-End Operational Lifecycle

When client browsers handle sensitive form interactions, the protection layers execute in harmony:

1.  **Client-Side Initialization**: Ststically preserves mounting timestamps. Decoy honeypots (`website` and `address`) are loaded as invisible components. A dynamic sliding verifier CAPTCHA is displayed, requiring manual finger tracking to unlock form actions.
2.  **Client-Side Submission Auditing**: Prior to sending requests, `SecurityService` inspects honeypots, counts form loading duration to block super-fast bots, and checks local cooldown rates.
3.  **Server Transport Protection**: When routes process, `HttpHeaderShield` injects headers to prevent cross-origin scripting or framing.
4.  **Security Sanitization & Diagnostics**: Express API routes validate character thresholds and execute sanitizers. The request data is parsed by `LogObfuscator` before being written out to server log monitors.
