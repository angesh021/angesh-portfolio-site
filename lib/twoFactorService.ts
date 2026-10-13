/**
 * File: /lib/twoFactorService.ts
 * Purpose: Passwordless Two-Factor Authentication (2FA) verification engine.
 * Strictly verifies identity against the Access Control List (admin_profiles).
 * Deduplicates email requests to prevent multiple emails with differing codes,
 * dispatches 6-digit OTP codes via Resend (with custom domain or testing domain fallback),
 * and issues passwordless session tokens upon valid verification.
 */

import crypto from 'crypto';
import { Resend } from 'resend';
import { getSupabaseAdmin } from './supabase.js';

interface TwoFactorEntry {
  code: string;
  codeHash: string;
  attemptsLeft: number;
  expiresAt: number;
  lastSentAt: number;
  resendCount: number;
}

// In-memory high-speed cache for active 2FA challenges
const twoFactorCache = new Map<string, TwoFactorEntry>();

// In-flight mutex promise map to prevent rapid double-invocations from sending 2 emails
const inFlightRequests = new Map<string, Promise<any>>();

const RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown
const MAX_RESENDS = 1; // Strict 1-time resend limit
const CODE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const OWNER_EMAIL = 'angesh021@gmail.com';

/**
 * Normalizes an email address for consistent lookup.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Computes a SHA-256 digest of the 6-digit code with salt.
 */
function hashTwoFactorCode(email: string, code: string): string {
  const salt = process.env.TWO_FACTOR_SALT || 'AEGIS_2FA_PEPPER_SALT_2026';
  return crypto.createHash('sha256').update(`${normalizeEmail(email)}_${code}_${salt}`).digest('hex');
}

/**
 * Verifies if an email is authorized in the Access Control List (admin_profiles)
 * and confirms that their access status is currently active and not expired.
 */
export async function checkAccessPermission(email: string): Promise<{
  allowed: boolean;
  error?: string;
  role?: string;
  profile?: any;
}> {
  const cleanEmail = normalizeEmail(email);
  const adminClient = getSupabaseAdmin();

  // 1. Look up profile in admin_profiles
  let { data: profile, error } = await adminClient
    .from('admin_profiles')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  // Auto-seed/ensure owner identity for angesh021@gmail.com
  if (!profile && cleanEmail === OWNER_EMAIL) {
    try {
      const { data: newOwner } = await adminClient
        .from('admin_profiles')
        .upsert({
          email: OWNER_EMAIL,
          role: 'owner',
          status: 'active',
          access_status: 'active'
        }, { onConflict: 'email' })
        .select('*')
        .maybeSingle();

      profile = newOwner || {
        id: 'owner-auto',
        email: OWNER_EMAIL,
        role: 'owner',
        status: 'active',
        access_status: 'active'
      };
    } catch (e) {
      profile = {
        id: 'owner-auto',
        email: OWNER_EMAIL,
        role: 'owner',
        status: 'active',
        access_status: 'active'
      };
    }
  }

  // Not in access list
  if (!profile) {
    return {
      allowed: false,
      error: 'Identity not found in Access Control List. Access is restricted to pre-authorized operators.'
    };
  }

  // Check if manually disabled
  if (profile.status === 'disabled' || profile.access_status === 'disabled') {
    return {
      allowed: false,
      error: 'Access denied: Your administrator access has been disabled by the system owner.'
    };
  }

  // Check temporal access duration (for non-owner operators)
  if (profile.role !== 'owner' && profile.access_expires_at) {
    const expiresAtTime = new Date(profile.access_expires_at).getTime();
    if (expiresAtTime <= Date.now()) {
      // Mark as expired in database if not already
      if (profile.access_status !== 'expired') {
        try {
          await adminClient
            .from('admin_profiles')
            .update({ access_status: 'expired' })
            .eq('id', profile.id);
        } catch {}
      }

      return {
        allowed: false,
        error: 'Access expired: Your temporary authorization window has expired. Please contact the owner for renewal.'
      };
    }
  }

  return {
    allowed: true,
    role: profile.role,
    profile
  };
}

/**
 * Builds the canonical, fully verified responsive HTML email template for 2FA verification.
 * Guarantees that both direct delivery and delegation delivery contain identical security
 * workflows, personalized greetings, refined borders, and the Angesh portfolio security footer title.
 */
function renderVerificationEmailHtml(params: {
  code: string;
  cleanEmail: string;
  operatorGreeting: string;
  operatorRole: string;
  isDelegation?: boolean;
}): string {
  const { code, cleanEmail, operatorGreeting, operatorRole, isDelegation } = params;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <title>Verification Code · Angesh Portfolio Security</title>
      <style>
        :root {
          color-scheme: dark;
          supported-color-schemes: dark;
        }
        body, table, td, p, a, span {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .code-text {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .heading-bright {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        .text-muted {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }
        .text-dim {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
        }
        .brand-gold {
          color: #c5a880 !important;
          -webkit-text-fill-color: #c5a880 !important;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100% !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          .code-display {
            font-size: 32px !important;
            letter-spacing: 8px !important;
            padding: 16px 18px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0b0f17; width: 100%; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" style="max-width: 540px; width: 100%; text-align: left;">
              
              <!-- Top Left Header: Logo & Title "Angesh portfolio security" -->
              <tr>
                <td align="left" style="padding-bottom: 22px; border-bottom: 1px solid #1c263c;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 12px; line-height: 0;">
                        <!-- Dual Ribbon Monogram (Architectural Brand Icon) -->
                        <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                          <path d="M 30,70 C 30,40 42,24 50,24 C 58,24 70,40 70,70" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M 80,28 C 62,28 40,36 40,50 C 40,64 62,72 80,72" stroke="#C5A880" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
                          <circle cx="30" cy="70" r="7.5" fill="#FFFFFF" />
                          <circle cx="70" cy="70" r="7.5" fill="#FFFFFF" />
                          <circle cx="80" cy="28" r="7.5" fill="#C5A880" />
                          <circle cx="80" cy="72" r="7.5" fill="#C5A880" />
                        </svg>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; letter-spacing: -0.015em; line-height: 1.2;">
                          Angesh portfolio security
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${isDelegation ? `
              <!-- Operator Access Request Banner -->
              <tr>
                <td align="left" style="padding-top: 18px;">
                  <div style="background-color: #121a2c; border: 1px solid #233350; border-left: 3px solid #38bdf8; border-radius: 8px; padding: 10px 14px;">
                    <span style="font-size: 12px; color: #94a3b8;">
                      <strong style="color: #ffffff;">Operator Access Request:</strong> Forwarded for operator <span style="font-family: 'SF Mono', Consolas, monospace; color: #38bdf8;">${cleanEmail}</span> due to test domain routing.
                    </span>
                  </div>
                </td>
              </tr>
              ` : ''}

              <!-- Main Heading: Email Verification Code -->
              <tr>
                <td align="left" style="padding-top: 26px; padding-bottom: 8px;">
                  <h1 class="heading-bright" style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; line-height: 1.25;">
                    Email verification code
                  </h1>
                </td>
              </tr>

              <!-- Addressed to the requested operator (Personalized Greeting) -->
              <tr>
                <td align="left" style="padding-bottom: 22px;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; line-height: 1.5;">
                    ${operatorGreeting}
                  </p>
                  <p class="text-muted" style="margin: 0; font-size: 14px; color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; line-height: 1.6;">
                    You have requested an email verification code to authenticate your administrative session for <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 600;">Angesh portfolio security</span>. Please enter this single-use code below to complete your sign-in:
                  </p>
                </td>
              </tr>

              <!-- Hero Security Feature Card: Coordinated High-Contrast Vault with Refined Border -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="background-color: #121826 !important; border: 1px solid #23304a !important; border-radius: 20px; padding: 28px 24px; text-align: center; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);">
                    
                    <!-- Top Tagline in Champagne Gold / Slate -->
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', Consolas, monospace; font-size: 11px; letter-spacing: 0.14em; color: #c5a880 !important; -webkit-text-fill-color: #c5a880 !important; text-transform: uppercase; font-weight: 700; margin-bottom: 16px;">
                      Email Verification Code
                    </div>

                    <!-- Recessed High-Contrast Code Vault (Maximum Readability) -->
                    <div class="code-display" style="background-color: #080b12 !important; border: 1.5px solid #2c3852 !important; border-radius: 14px; padding: 18px 28px; margin: 0 auto 16px auto; display: inline-block; box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.6);">
                      <span class="code-text" style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-shadow: 0 0 12px rgba(255, 255, 255, 0.25);">
                        ${code}
                      </span>
                    </div>

                    <!-- Expiration Pill -->
                    <div style="margin-bottom: 16px;">
                      <span style="display: inline-block; background-color: #1a2234 !important; color: #cbd5e1 !important; -webkit-text-fill-color: #cbd5e1 !important; border: 1px solid #293752 !important; border-radius: 9999px; padding: 6px 16px; font-size: 11.5px; font-weight: 600;">
                        ⏱️ Expires in 10 minutes · Single-use code
                      </span>
                    </div>

                    <!-- Recipient Verification Tag for Requested Operator -->
                    <div style="border-top: 1px solid #1c263c; padding-top: 14px; margin-top: 6px; text-align: left;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-size: 12px; color: #64748b !important; -webkit-text-fill-color: #64748b !important; padding: 3px 0;">Requested Operator:</td>
                          <td align="right" style="font-family: 'SF Mono', Consolas, monospace; font-size: 12px; font-weight: 600; color: #f1f5f9 !important; -webkit-text-fill-color: #f1f5f9 !important; padding: 3px 0;">${cleanEmail}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 12px; color: #64748b !important; -webkit-text-fill-color: #64748b !important; padding: 3px 0;">Assigned Role:</td>
                          <td align="right" style="font-size: 12px; font-weight: 600; color: #c5a880 !important; -webkit-text-fill-color: #c5a880 !important; padding: 3px 0;">${operatorRole}</td>
                        </tr>
                      </table>
                    </div>

                  </div>
                </td>
              </tr>

              <!-- Instructions & Security Advisory Box -->
              <tr>
                <td align="left" style="padding-bottom: 22px;">
                  <div style="background-color: #0e1420 !important; border: 1px solid #1e283c !important; border-left: 3px solid #c5a880 !important; border-radius: 12px; padding: 14px 18px;">
                    <p style="margin: 0 0 6px 0; font-size: 12.5px; font-weight: 700; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">
                      Security Advisory
                    </p>
                    <p class="text-muted" style="margin: 0; font-size: 12px; color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; line-height: 1.55;">
                      Enter this email verification code into your browser to complete authentication. Never share this verification code with anyone. If you did not request this email verification code, no further action is required; the code will automatically expire in 10 minutes.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Did you request this verification code (Refined Border Workflow Card) -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="background-color: #101626 !important; border: 1px solid #23304a !important; border-radius: 18px; padding: 22px 24px; text-align: center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                    <p class="heading-bright" style="margin: 0 0 14px 0; font-size: 14px; font-weight: 700; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; letter-spacing: -0.01em;">
                      Did you request this verification code?
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 6px;">
                          <!-- Confirmed Legitimate Request Button -->
                          <a href="https://angesh.dev/admin" target="_blank" style="display: inline-block; background-color: #064e3b !important; color: #6ee7b7 !important; -webkit-text-fill-color: #6ee7b7 !important; border: 1.5px solid #059669 !important; border-radius: 9999px; padding: 9px 24px; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                            ✓ Yes, by me
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <!-- Suspicious / Unauthorized Warning Button -->
                          <a href="https://angesh.dev/admin" target="_blank" style="display: inline-block; background-color: #450a0a !important; color: #fca5a5 !important; -webkit-text-fill-color: #fca5a5 !important; border: 1.5px solid #dc2626 !important; border-radius: 9999px; padding: 9px 24px; font-size: 12.5px; font-weight: 700; text-decoration: none;">
                            ⚠️ No, suspicious
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Better Email Footer with Refined Border and Title "Angesh portfolio security" -->
              <tr>
                <td align="left">
                  <div style="background-color: #101626 !important; border: 1px solid #23304a !important; border-radius: 20px; padding: 24px 26px; text-align: left; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);">
                    
                    <!-- Title in Footer: Angesh portfolio security -->
                    <div style="margin-bottom: 12px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle; padding-right: 8px; line-height: 0;">
                            <span style="color: #c5a880 !important; -webkit-text-fill-color: #c5a880 !important; font-size: 12px;">●</span>
                          </td>
                          <td style="vertical-align: middle;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14.5px; font-weight: 700; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; letter-spacing: -0.01em;">
                              Angesh portfolio security
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Security Audit Statement -->
                    <p style="margin: 0 0 14px 0; font-size: 12.5px; color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important; line-height: 1.65;">
                      This is an automated cryptographic verification email dispatched by Aegis Security Gateway. If you did not initiate this request, someone may be probing access. All authentication requests are permanently recorded in the immutable audit log.
                    </p>

                    <!-- Refined Separator Divider -->
                    <div style="border-top: 1px solid #1c263c; margin-bottom: 14px;"></div>

                    <!-- Monospace Metadata Ledger Row -->
                    <p style="margin: 0 0 10px 0; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 11px; color: #cbd5e1 !important; -webkit-text-fill-color: #cbd5e1 !important; line-height: 1.6;">
                      <span style="color: #64748b !important; -webkit-text-fill-color: #64748b !important;">Role:</span> <strong style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${operatorRole}</strong> <span style="color: #475569 !important;">·</span> <span style="color: #64748b !important; -webkit-text-fill-color: #64748b !important;">Operator:</span> <a href="mailto:${cleanEmail}" style="color: #38bdf8 !important; -webkit-text-fill-color: #38bdf8 !important; text-decoration: underline; font-weight: 600;">${cleanEmail}</a> <span style="color: #475569 !important;">·</span> <span style="color: #64748b !important; -webkit-text-fill-color: #64748b !important;">Issued:</span> <span style="color: #94a3b8 !important; -webkit-text-fill-color: #94a3b8 !important;">${new Date().toUTCString()}</span>
                    </p>

                    <!-- Copyright Line -->
                    <p style="margin: 0; font-size: 11.5px; color: #64748b !important; -webkit-text-fill-color: #64748b !important;">
                      Angesh Chanderdip © 2026. All rights reserved.
                    </p>

                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generates and dispatches a 6-digit 2FA code to an authorized operator email.
 * Guarantees that only ONE active code is sent per cooldown window.
 */
export async function sendTwoFactorCode(email: string, isResend: boolean = false): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  cooldownSeconds?: number;
  devCode?: string;
  forwardedToOwner?: boolean;
  resendCount?: number;
  maxResendsReached?: boolean;
}> {
  const cleanEmail = normalizeEmail(email);

  // If a send request is already currently in-flight for this email, reuse it to prevent duplicate emails
  if (inFlightRequests.has(cleanEmail)) {
    return inFlightRequests.get(cleanEmail);
  }

  const executionPromise = (async () => {
    // 1. Verify Access Control List
    const access = await checkAccessPermission(cleanEmail);
    if (!access.allowed) {
      return {
        success: false,
        error: access.error || 'Identity not authorized in Access Control List.'
      };
    }

    const now = Date.now();
    const existing = twoFactorCache.get(cleanEmail);

    // If this is a RESEND request, enforce 60s cooldown and max 1 resend limit:
    if (isResend) {
      if (!existing) {
        return {
          success: false,
          error: 'No active verification session found. Please enter your email again.'
        };
      }

      if ((existing.resendCount || 0) >= MAX_RESENDS) {
        return {
          success: false,
          error: 'Resend limit reached. You can only resend the verification code 1 time.',
          maxResendsReached: true,
          resendCount: existing.resendCount
        };
      }

      if (now - existing.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000) {
        const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000);
        return {
          success: false,
          error: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before resending.`,
          cooldownSeconds: remaining
        };
      }
    } else {
      // Initial send: if a code was already sent recently (within 60s cooldown window)
      if (existing && (now - existing.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000)) {
        const remaining = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000);
        return {
          success: true,
          message: `A verification code was already dispatched. Please check your inbox and spam folder, or wait ${remaining}s to resend.`,
          cooldownSeconds: remaining,
          resendCount: existing.resendCount || 0,
          maxResendsReached: (existing.resendCount || 0) >= MAX_RESENDS
        };
      }
    }

    // 3. Generate a single cryptographically secure 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashTwoFactorCode(cleanEmail, code);
    const newResendCount = isResend ? ((existing?.resendCount || 0) + 1) : 0;

    twoFactorCache.set(cleanEmail, {
      code,
      codeHash,
      attemptsLeft: MAX_ATTEMPTS,
      expiresAt: now + CODE_EXPIRATION_MS,
      lastSentAt: now,
      resendCount: newResendCount
    });

    console.log(`\n=============================================================`);
    console.log(`🔐 [SECURITY GATEWAY DISPATCH]`);
    console.log(`Operator: ${cleanEmail} (Role: ${access.role || 'Operator'})`);
    console.log(`6-Digit Verification Code: ${code}`);
    console.log(`Action: ${isResend ? 'RESEND #1 (Final Resend)' : 'INITIAL DISPATCH'}`);
    console.log(`Deliver to: ${cleanEmail}`);
    console.log(`=============================================================\n`);

    // 4. Dispatch Email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Angesh Portfolio Security <verification@angesh.jo3.org>';
    let deliveryNote = isResend 
      ? `A fresh verification code was sent to ${cleanEmail}. (Resend limit reached: 1/1 used)`
      : `An email verification code was sent to ${cleanEmail}.`;
    let forwardedToOwner = false;

    // Personalize operator greeting and role
    const isOwner = cleanEmail === OWNER_EMAIL;
    let operatorGreeting = 'Hello Operator,';
    if (isOwner) {
      operatorGreeting = 'Hello Angesh,';
    } else if (access.profile?.full_name || access.profile?.display_name) {
      const name = access.profile.full_name || access.profile.display_name;
      operatorGreeting = `Hello Operator ${name},`;
    } else if (cleanEmail.includes('@')) {
      const prefix = cleanEmail.split('@')[0];
      const formatted = prefix
        .replace(/[._\-+]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      if (formatted.toLowerCase().includes('operator')) {
        operatorGreeting = `Hello ${formatted},`;
      } else {
        operatorGreeting = `Hello Operator ${formatted},`;
      }
    }
    const operatorRole = (access.role || 'Operator').toUpperCase();

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const htmlTemplate = renderVerificationEmailHtml({
        code,
        cleanEmail,
        operatorGreeting,
        operatorRole,
        isDelegation: false
      });

      const textFallback = `Angesh Portfolio Security\n\nYour 6-digit email verification code is: ${code}\n\nThis single-use code expires in 10 minutes.\nEnter it on the verification screen to authorize device pairing.\n\nIf you did not request this code, no action is required.\n\nAngesh Chanderdip Portfolio Security © 2026`;

      try {
        // High-deliverability dispatch with clean subject line, RFC auto-submitted headers, text fallback, and reply-to
        const sendResult = await resend.emails.send({
          from: fromAddress,
          to: [cleanEmail],
          replyTo: 'angesh021@gmail.com',
          subject: `${code} is your Angesh Portfolio verification code`,
          text: textFallback,
          html: htmlTemplate,
          headers: {
            'Auto-Submitted': 'auto-generated',
            'X-Entity-Ref-ID': `2fa-${Date.now()}`
          }
        });

        if (sendResult.error) {
          console.warn('[2FA Resend Direct Send Warning]', sendResult.error.message);

          // If Resend in testing mode restricts delivery exclusively to the owner's email
          if (
            cleanEmail !== OWNER_EMAIL &&
            (sendResult.error.message?.includes('testing email') || sendResult.error.statusCode === 403)
          ) {
            forwardedToOwner = true;
            console.log(`[2FA Resend] Forwarding code for ${cleanEmail} to owner ${OWNER_EMAIL} due to testing domain policy`);

            const delegationHtml = renderVerificationEmailHtml({
              code,
              cleanEmail,
              operatorGreeting,
              operatorRole,
              isDelegation: true
            });

            await resend.emails.send({
              from: fromAddress,
              to: [OWNER_EMAIL],
              replyTo: 'angesh021@gmail.com',
              subject: `Angesh Portfolio: Verification code (${cleanEmail}): ${code}`,
              text: textFallback,
              html: delegationHtml
            }).catch(e => console.error('[Owner Forward Error]', e));

            deliveryNote = `An email verification code was dispatched. (Delivered to owner via Resend testing domain policy).`;
          }
        }
      } catch (sendEx: any) {
        console.error('[2FA Delivery Exception]', sendEx.message);
      }
    }

    return {
      success: true,
      message: deliveryNote,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      resendCount: newResendCount,
      maxResendsReached: newResendCount >= MAX_RESENDS,
      forwardedToOwner
    };
  })();

  inFlightRequests.set(cleanEmail, executionPromise);

  try {
    const result = await executionPromise;
    return result;
  } finally {
    // Release in-flight mutex lock once complete
    inFlightRequests.delete(cleanEmail);
  }
}

/**
 * Validates the email OTP without generating a Supabase session (used as an identity gate for TOTP setup/reset).
 */
export function verifyEmailOtpOnly(email: string, code: string): { success: boolean; error?: string } {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: 'Please enter the complete 6-digit email verification code.' };
  }

  const entry = twoFactorCache.get(cleanEmail);
  if (!entry) {
    return {
      success: false,
      error: 'No active email verification challenge found for this address. Please request a new code.'
    };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    twoFactorCache.delete(cleanEmail);
    return {
      success: false,
      error: 'Email verification code has expired. Please request a new code.'
    };
  }

  if (entry.attemptsLeft <= 0) {
    twoFactorCache.delete(cleanEmail);
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  const providedHash = hashTwoFactorCode(cleanEmail, cleanCode);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(providedHash, 'utf-8'),
    Buffer.from(entry.codeHash, 'utf-8')
  );

  if (!isMatch) {
    entry.attemptsLeft -= 1;
    if (entry.attemptsLeft <= 0) {
      twoFactorCache.delete(cleanEmail);
      return {
        success: false,
        error: 'Too many incorrect attempts. Code invalidated. Please request a new code.'
      };
    }
    return {
      success: false,
      error: `Invalid email verification code. ${entry.attemptsLeft} attempt${entry.attemptsLeft === 1 ? '' : 's'} remaining.`
    };
  }

  // Code verified! Invalidate immediately to prevent reuse
  twoFactorCache.delete(cleanEmail);
  return { success: true };
}

/**
 * Verifies a 6-digit 2FA code.
 * Upon successful verification, generates a passwordless session token (magic link token)
 * so the frontend can immediately establish a valid Supabase authenticated session.
 */
export async function verifyTwoFactorCode(email: string, code: string): Promise<{
  success: boolean;
  error?: string;
  token_hash?: string;
  user?: any;
}> {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit verification code.' };
  }

  const entry = twoFactorCache.get(cleanEmail);

  if (!entry) {
    return {
      success: false,
      error: 'No active 2FA challenge found for this email. Please request a new code.'
    };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    twoFactorCache.delete(cleanEmail);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  if (entry.attemptsLeft <= 0) {
    twoFactorCache.delete(cleanEmail);
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.'
    };
  }

  const providedHash = hashTwoFactorCode(cleanEmail, cleanCode);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(providedHash, 'utf-8'),
    Buffer.from(entry.codeHash, 'utf-8')
  );

  if (!isMatch) {
    entry.attemptsLeft -= 1;
    if (entry.attemptsLeft <= 0) {
      twoFactorCache.delete(cleanEmail);
      return {
        success: false,
        error: 'Too many incorrect attempts. Challenge invalidated. Please request a new code.'
      };
    }
    return {
      success: false,
      error: `Invalid verification code. ${entry.attemptsLeft} attempt${entry.attemptsLeft === 1 ? '' : 's'} remaining.`
    };
  }

  // 1. One-time code successfully verified! Invalidate immediately to prevent replay
  twoFactorCache.delete(cleanEmail);

  // 2. Generate Passwordless Session Token from Supabase Admin
  const adminClient = getSupabaseAdmin();
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error('Failed to generate passwordless session token:', linkErr);
    return {
      success: false,
      error: 'Failed to establish security session. Please retry.'
    };
  }

  // 3. Update admin_profiles metadata & audit trail
  try {
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('id, user_id, status, access_status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profile) {
      const updates: any = {
        last_login_at: new Date().toISOString()
      };

      if (profile.status === 'invited') {
        updates.status = 'active';
        updates.access_status = 'active';
        updates.access_starts_at = new Date().toISOString();
      }

      if (!profile.user_id && linkData.user?.id) {
        updates.user_id = linkData.user.id;
      }

      await adminClient
        .from('admin_profiles')
        .update(updates)
        .eq('id', profile.id);

      // Audit log entry
      try {
        await adminClient
          .from('admin_audit_logs')
          .insert({
            actor_user_id: profile.user_id || linkData.user?.id || null,
            actor_email: cleanEmail,
            action: 'LOGIN_2FA_PASSWORDLESS_SUCCESS',
            severity: 'info',
            metadata: { auth_type: '2fa_passwordless', timestamp: new Date().toISOString() }
          });
      } catch {}
    }
  } catch (profileErr) {
    console.warn('Profile sync warning during passwordless login:', profileErr);
  }

  return {
    success: true,
    token_hash: linkData.properties.hashed_token,
    user: linkData.user
  };
}
