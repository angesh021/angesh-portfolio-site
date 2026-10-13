/**
 * File: /lib/totpService.ts
 * Purpose: Enterprise RFC 6238 Time-based One-Time Password (TOTP) Authenticator Engine.
 * Supports Google Authenticator, Microsoft Authenticator, 1Password, Apple Passwords, Authy, and Bitwarden.
 * Fully backed by the persistent MFA Vault (auth.users app_metadata + encrypted local vault).
 * Strictly enforces that already-enrolled identities CANNOT re-provision, reset, or create new keys from the public login screen.
 */

import crypto from 'crypto';
import QRCode from 'qrcode';
import { getSupabaseAdmin } from './supabase.js';
import { checkAccessPermission, sendTwoFactorCode, verifyEmailOtpOnly } from './twoFactorService.js';
import { 
  isUserMfaEnrolled, 
  getMfaRecord, 
  saveMfaRecord, 
  revokeMfaRecord, 
  consumeRecoveryCode,
  hashRecoveryCode 
} from './mfaVault.js';

// Base32 RFC 4648 dictionary
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a Base32 string (RFC 4648).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string to a Buffer (RFC 4648).
 */
export function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${clean[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure 20-byte Base32 secret.
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Generates 8 single-use emergency recovery codes (e.g., "7A4B-9E2D").
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${p1}-${p2}`);
  }
  return codes;
}

/**
 * Generates the expected 6-digit TOTP code for a secret at a specific counter step.
 */
export function generateTotpCode(secretBase32: string, counter: number): string {
  const secretBuffer = base32Decode(secretBase32);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const token = (codeInt % 1000000).toString().padStart(6, '0');
  return token;
}

/**
 * Validates a user-supplied 6-digit code against a Base32 secret.
 * Allows +/- 1 window (30 seconds drift tolerance).
 */
export function verifyTotpToken(secretBase32: string, token: string, window = 1): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const expected = generateTotpCode(secretBase32, counter);

    if (crypto.timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(expected, 'utf-8'))) {
      return true;
    }
  }

  return false;
}

// In-memory cache for pending first-time TOTP setups (before first verification)
interface PendingSetup {
  secret: string;
  expiresAt: number;
  recoveryCodeHashes: string[];
  plainRecoveryCodes: string[];
}
const pendingSetups = new Map<string, PendingSetup>();

// Rate limiter / Lockout tracker for TOTP attempts (5 attempts per 5 minutes)
interface AttemptRecord {
  attemptsLeft: number;
  lockedUntil: number;
}
const attemptTracker = new Map<string, AttemptRecord>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Initiates TOTP Authentication flow.
 * - If operator ALREADY has MFA enrolled -> strictly enforces 6-digit TOTP challenge. No email codes, no QR codes.
 * - If operator does NOT have MFA enrolled -> dispatches an email OTP first to verify identity before initial provisioning.
 */
export async function initiateTotpAuth(email: string, isResend: boolean = false): Promise<{
  success: boolean;
  requiresEmailVerification: boolean;
  isSetup: boolean;
  mfaEnrolled: boolean;
  message?: string;
  error?: string;
  cooldownSeconds?: number;
  resendCount?: number;
  maxResendsReached?: boolean;
}> {
  const cleanEmail = normalizeEmail(email);

  // 1. Verify that email is authorized in Access Control List (admin_profiles)
  const access = await checkAccessPermission(cleanEmail);
  if (!access.allowed) {
    return {
      success: false,
      requiresEmailVerification: false,
      isSetup: false,
      mfaEnrolled: false,
      error: access.error || 'Identity not authorized in Access Control List.'
    };
  }

  // 2. Authoritative check: Is MFA already enrolled for this user?
  const hasMfa = await isUserMfaEnrolled(cleanEmail);

  if (hasMfa) {
    // HARD ENFORCEMENT: Already enrolled. Never allow re-setup from login page.
    return {
      success: true,
      requiresEmailVerification: false,
      isSetup: false,
      mfaEnrolled: true,
      message: 'Enter the 6-digit verification code from your paired Authenticator App.'
    };
  }

  // 3. First time provisioning: Dispatch random 6-digit verification code to that operator's email
  const emailDispatch = await sendTwoFactorCode(cleanEmail, isResend);
  if (!emailDispatch.success) {
    return {
      success: false,
      requiresEmailVerification: true,
      isSetup: true,
      mfaEnrolled: false,
      error: emailDispatch.error || 'Failed to dispatch email verification code for initial Authenticator setup.',
      cooldownSeconds: emailDispatch.cooldownSeconds,
      maxResendsReached: emailDispatch.maxResendsReached
    };
  }

  return {
    success: true,
    requiresEmailVerification: true,
    isSetup: true,
    mfaEnrolled: false,
    message: emailDispatch.message || `A 6-digit security code was sent to ${cleanEmail} to authorize initial Authenticator App pairing.`,
    cooldownSeconds: emailDispatch.cooldownSeconds,
    resendCount: emailDispatch.resendCount,
    maxResendsReached: emailDispatch.maxResendsReached
  };
}

/**
 * Verifies email OTP and, upon success, generates the TOTP secret, QR code, AND 8 emergency recovery keys.
 * CRITICAL ENFORCEMENT: If the identity is already enrolled in MFA, this endpoint REJECTS the request immediately!
 */
export async function verifyEmailForTotpSetup(
  email: string,
  emailCode: string
): Promise<{
  success: boolean;
  qrCode?: string;
  secret?: string;
  manualKey?: string;
  recoveryCodes?: string[];
  message?: string;
  error?: string;
}> {
  const cleanEmail = normalizeEmail(email);

  // 1. HARD BLOCK: Prevent re-setup if MFA is already active!
  const hasMfa = await isUserMfaEnrolled(cleanEmail);
  if (hasMfa) {
    return {
      success: false,
      error: 'MFA is already active and enforced for this account. Generating a new key or re-pairing is prohibited from the public portal. Please use your existing Authenticator app or contact the Owner.'
    };
  }

  // 2. Verify email OTP
  const verification = verifyEmailOtpOnly(cleanEmail, emailCode);
  if (!verification.success) {
    return {
      success: false,
      error: verification.error || 'Invalid email verification code.'
    };
  }

  // 3. Clear any stale pending setups
  pendingSetups.delete(cleanEmail);

  // 4. Generate new TOTP secret & QR code
  const secret = generateTotpSecret();
  const plainRecoveryCodes = generateRecoveryCodes(8);
  const recoveryCodeHashes = plainRecoveryCodes.map(hashRecoveryCode);
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes setup window

  pendingSetups.set(cleanEmail, {
    secret,
    expiresAt,
    recoveryCodeHashes,
    plainRecoveryCodes
  });

  const issuer = 'Aegis Security';
  const label = `${issuer}:${cleanEmail}`;
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=6&period=30`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (qrErr: any) {
    console.error('QR Code generation failed:', qrErr);
  }

  return {
    success: true,
    qrCode: qrCodeDataUrl,
    secret,
    manualKey: secret,
    recoveryCodes: plainRecoveryCodes,
    message: 'Email confirmed. Scan this QR code with your Authenticator App and store your emergency recovery keys.'
  };
}

/**
 * Validates a 6-digit TOTP code and completes authentication.
 * Automatically confirms setup and permanently locks the key in the MFA Vault.
 */
export async function verifyTotpAuth(
  email: string,
  code: string
): Promise<{
  success: boolean;
  token_hash?: string;
  user?: any;
  error?: string;
}> {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'Please enter the complete 6-digit code from your Authenticator App.'
    };
  }

  // 1. Rate-limiting check
  const now = Date.now();
  let attempt = attemptTracker.get(cleanEmail);
  if (!attempt) {
    attempt = { attemptsLeft: 5, lockedUntil: 0 };
    attemptTracker.set(cleanEmail, attempt);
  }

  if (attempt.lockedUntil > now) {
    const remainingSecs = Math.ceil((attempt.lockedUntil - now) / 1000);
    return {
      success: false,
      error: `Too many failed attempts. Console locked. Try again in ${remainingSecs}s.`
    };
  }

  // 2. Identify active secret (existing enrolled key vs pending setup)
  let activeSecret: string | null = null;
  let isCompletingSetup = false;
  let pendingRecoveryHashes: string[] = [];

  const existingRecord = await getMfaRecord(cleanEmail);
  if (existingRecord) {
    activeSecret = existingRecord.secret;
  } else {
    const pending = pendingSetups.get(cleanEmail);
    if (pending && pending.expiresAt > now) {
      activeSecret = pending.secret;
      pendingRecoveryHashes = pending.recoveryCodeHashes;
      isCompletingSetup = true;
    }
  }

  if (!activeSecret) {
    return {
      success: false,
      error: 'No active authentication session. Please enter your email to restart.'
    };
  }

  // 3. Verify TOTP token with +/- 1 window (drift protection)
  const isValid = verifyTotpToken(activeSecret, cleanCode, 1);

  if (!isValid) {
    attempt.attemptsLeft -= 1;
    if (attempt.attemptsLeft <= 0) {
      attempt.lockedUntil = now + 5 * 60 * 1000; // 5 minute lockout
      attempt.attemptsLeft = 5;
      return {
        success: false,
        error: 'Too many incorrect attempts. Authentication locked for 5 minutes.'
      };
    }
    return {
      success: false,
      error: `Invalid code. ${attempt.attemptsLeft} attempt${attempt.attemptsLeft === 1 ? '' : 's'} remaining.`
    };
  }

  // 4. Token valid: Reset attempt tracker
  attemptTracker.delete(cleanEmail);

  // If completing initial setup, permanently persist the secret & recovery keys in MFA Vault!
  if (isCompletingSetup) {
    await saveMfaRecord(cleanEmail, activeSecret, pendingRecoveryHashes);
    pendingSetups.delete(cleanEmail);
  }

  // 5. Generate secure Passwordless Session Token with Supabase Admin
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

  // 6. Update user metadata and record immutable audit trail
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

      await adminClient.from('admin_profiles').update(updates).eq('id', profile.id);

      // Audit Log
      try {
        await adminClient.from('admin_audit_logs').insert({
          actor_user_id: profile.user_id || linkData.user?.id || null,
          actor_email: cleanEmail,
          action: isCompletingSetup ? 'LOGIN_TOTP_SETUP_SUCCESS' : 'LOGIN_TOTP_SUCCESS',
          severity: 'info',
          metadata: {
            auth_type: 'authenticator_app_totp',
            timestamp: new Date().toISOString()
          }
        });
      } catch {}
    }
  } catch (profileErr) {
    console.warn('Profile sync warning during TOTP login:', profileErr);
  }

  return {
    success: true,
    token_hash: linkData.properties.hashed_token,
    user: linkData.user
  };
}

/**
 * Validates a single-use Emergency Recovery Code and logs in.
 * Consumes the recovery code immediately upon successful match.
 */
export async function verifyRecoveryCode(
  email: string,
  rawCode: string
): Promise<{
  success: boolean;
  token_hash?: string;
  user?: any;
  remainingCodesCount?: number;
  error?: string;
}> {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (rawCode || '').trim();

  if (!cleanCode) {
    return { success: false, error: 'Please enter your emergency recovery code.' };
  }

  const access = await checkAccessPermission(cleanEmail);
  if (!access.allowed) {
    return { success: false, error: 'Identity not authorized in Access Control List.' };
  }

  const consumeRes = await consumeRecoveryCode(cleanEmail, cleanCode);
  if (!consumeRes.success) {
    return {
      success: false,
      error: consumeRes.error || 'Invalid recovery code. Please check your backup keys or contact the Owner.'
    };
  }

  // Generate Passwordless Session Token
  const adminClient = getSupabaseAdmin();
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: cleanEmail
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    return { success: false, error: 'Failed to establish security session via recovery code.' };
  }

  // Record critical audit log
  try {
    await adminClient.from('admin_audit_logs').insert({
      actor_email: cleanEmail,
      action: 'LOGIN_RECOVERY_CODE_USED',
      severity: 'warning',
      metadata: {
        remaining_recovery_codes: consumeRes.remainingCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch {}

  return {
    success: true,
    token_hash: linkData.properties.hashed_token,
    user: linkData.user,
    remainingCodesCount: consumeRes.remainingCount
  };
}

/**
 * Resets the TOTP authenticator device for an operator.
 * Can ONLY be invoked by the Owner in User Management.
 */
export async function resetTotpSecret(email: string): Promise<boolean> {
  const cleanEmail = normalizeEmail(email);
  pendingSetups.delete(cleanEmail);
  attemptTracker.delete(cleanEmail);

  return await revokeMfaRecord(cleanEmail);
}

/**
 * Generates fresh pairing data for an authenticated operator inside the dashboard.
 */
export async function initiateInDashboardTotpReset(email: string): Promise<{
  success: boolean;
  qrCode?: string;
  secret?: string;
  manualKey?: string;
  recoveryCodes?: string[];
  error?: string;
}> {
  const cleanEmail = normalizeEmail(email);

  const secret = generateTotpSecret();
  const plainRecoveryCodes = generateRecoveryCodes(8);
  const recoveryCodeHashes = plainRecoveryCodes.map(hashRecoveryCode);
  const expiresAt = Date.now() + 15 * 60 * 1000;

  pendingSetups.set(cleanEmail, {
    secret,
    expiresAt,
    recoveryCodeHashes,
    plainRecoveryCodes
  });

  const issuer = 'Aegis Security';
  const label = `${issuer}:${cleanEmail}`;
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=SHA1&digits=6&period=30`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (qrErr: any) {
    console.error('QR Code generation failed:', qrErr);
  }

  return {
    success: true,
    qrCode: qrCodeDataUrl,
    secret,
    manualKey: secret,
    recoveryCodes: plainRecoveryCodes
  };
}
