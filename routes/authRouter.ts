import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { checkAccessPermission, sendTwoFactorCode, verifyTwoFactorCode } from '../lib/twoFactorService.js';
import { 
  initiateTotpAuth, 
  verifyTotpAuth, 
  verifyEmailForTotpSetup,
  verifyRecoveryCode
} from '../lib/totpService.js';

const router = Router();

/**
 * Endpoint: /api/auth/initiate-totp
 * Checks ACL and starts Authenticator flow:
 * - If user is already paired: returns { requiresEmailVerification: false, isSetup: false }
 * - If user needs setup: sends random code to operator's email and returns { requiresEmailVerification: true, isSetup: true }
 */
router.post(['/initiate-totp', '/api/auth/initiate-totp'], async (req: Request, res: Response) => {
  try {
    const { email, isResend } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    const result = await initiateTotpAuth(email, Boolean(isResend));
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in initiate-totp endpoint:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error starting Authenticator setup' });
  }
});

/**
 * Endpoint: /api/auth/verify-email-for-totp
 * Verifies the 6-digit email OTP and upon success returns the fresh TOTP QR code, manual key, AND emergency recovery codes.
 */
router.post(['/verify-email-for-totp', '/api/auth/verify-email-for-totp'], async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit email verification code required' });
    }

    const result = await verifyEmailForTotpSetup(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in verify-email-for-totp endpoint:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error verifying email code' });
  }
});

/**
 * Endpoint: /api/auth/verify-totp
 * Validates a 6-digit TOTP code from Google Authenticator, Microsoft Authenticator, 1Password, etc.
 */
router.post(['/verify-totp', '/api/auth/verify-totp'], async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit authenticator code are required' });
    }

    const result = await verifyTotpAuth(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in verify-totp endpoint:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error verifying Authenticator code' });
  }
});

/**
 * Endpoint: /api/auth/verify-recovery-code
 * Validates a single-use Emergency Backup Recovery Code for locked-out operators who lost their phone.
 */
router.post(['/verify-recovery-code', '/api/auth/verify-recovery-code'], async (req: Request, res: Response) => {
  try {
    const { email, recoveryCode } = req.body;
    if (!email || !recoveryCode) {
      return res.status(400).json({ success: false, error: 'Email and emergency recovery code are required' });
    }

    const result = await verifyRecoveryCode(email, recoveryCode);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Error in verify-recovery-code endpoint:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error verifying recovery code' });
  }
});

/**
 * Endpoint: /api/auth/check-email
 * Checks if an email is present and authorized in the admin_profiles access list
 */
router.post(['/check-email', '/api/auth/check-email'], async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const access = await checkAccessPermission(cleanEmail);

    if (!access.allowed) {
      return res.status(403).json({
        inAccessList: false,
        error: access.error || 'Identity not found in Access Control List.'
      });
    }

    return res.status(200).json({
      inAccessList: true,
      role: access.role
    });
  } catch (e: any) {
    console.error('Error in check-email:', e);
    return res.status(500).json({ error: e.message || 'Internal server error checking email' });
  }
});

export default router;
