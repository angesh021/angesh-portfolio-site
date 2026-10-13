import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { put, del } from '@vercel/blob';
import { authenticateAdmin, requireRole, createAuditLog } from '../lib/adminMiddleware.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { fetchDashboardAggregation, getCvMetadata, saveCvMetadata, deleteCvMetadata } from '../lib/db.js';
import { SecurityService } from '../lib/security/SecurityService.js';
import { CvMetadata } from '../types.js';
import { resetTotpSecret, initiateInDashboardTotpReset } from '../lib/totpService.js';

const router = Router();

/**
 * Endpoint: /api/admin/me
 * Reconciles the authenticated admin profile
 */
router.get(['/me', '/api/admin/me'], authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const lastLogin = req.adminProfile!.last_login_at ? new Date(req.adminProfile!.last_login_at) : null;
    if (!lastLogin || (now.getTime() - lastLogin.getTime() > 5 * 60 * 1000)) {
      const adminClient = getSupabaseAdmin();
      await adminClient
        .from('admin_profiles')
        .update({ last_login_at: now.toISOString() })
        .eq('id', req.adminProfile!.id);
    }

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'ME_PROFILE_RECONCILE',
      severity: 'info',
      metadata: { path: req.path }
    });

    return res.status(200).json({
      success: true,
      user: req.adminUser,
      profile: req.adminProfile
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/dashboard
 * Aggregates dashboard analytics
 */
router.get(['/dashboard', '/api/admin/dashboard'], authenticateAdmin, requireRole(['owner', 'admin', 'viewer']), async (req: Request, res: Response) => {
  try {
    const mode = req.query.mode as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const data = await fetchDashboardAggregation(mode, startDate, endDate);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in admin dashboard aggregation API:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint: /api/admin/users
 * Lists administrator profiles
 */
router.get(['/users', '/api/admin/users'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const adminClient = getSupabaseAdmin();
    const { data: users, error } = await adminClient
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, users });
  } catch (err: any) {
    console.error('Users fetch error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/add
 * Authorizes a new administrator or viewer
 */
router.post(['/users/add', '/api/admin/users/add'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { email, role, durationHours } = req.body;
    if (!email || !role || durationHours === undefined) {
      return res.status(400).json({ success: false, error: 'Email, role, and access duration are required fields.' });
    }

    const hours = parseInt(durationHours, 10);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ success: false, error: 'Access duration is required and must be a valid positive number of hours.' });
    }

    if (!['admin', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role specified. Only admin and viewer roles can be authorized.' });
    }

    const cleanEmail = SecurityService.sanitizeInput(String(email).trim().toLowerCase());
    if (!SecurityService.validateEmailFormat(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email structure.' });
    }

    const adminClient = getSupabaseAdmin();

    const { data: existingProfile } = await adminClient
      .from('admin_profiles')
      .select('id, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return res.status(400).json({ success: false, error: `An administrator profile already exists for this email with status: ${existingProfile.status}` });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    const expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await adminClient.from('admin_invitations').insert({
      email: cleanEmail,
      role,
      token_hash,
      invited_by: req.adminProfile!.id,
      expires_at,
      access_duration_hours: hours,
      access_starts_at: null,
      access_expires_at: null
    });

    const { error: profileErr } = await adminClient.from('admin_profiles').insert({
      email: cleanEmail,
      role,
      status: 'invited',
      invited_by: req.adminProfile!.user_id,
      access_starts_at: null,
      access_expires_at: null,
      access_status: 'invited'
    });

    if (profileErr) throw new Error(profileErr.message);

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'USER_AUTHORIZED',
      target_email: cleanEmail,
      severity: 'info',
      metadata: { role, access_duration_hours: hours, authentication: 'oauth_only' }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully pre-authorized ${cleanEmail}. They can now login via OAuth or password.`
    });
  } catch (err: any) {
    console.error('Authorization API exception:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id/renew-access
 */
router.post(['/users/:id/renew-access', '/api/admin/users/:id/renew-access'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { durationHours } = req.body;

    if (durationHours === undefined) {
      return res.status(400).json({ success: false, error: 'Access renewal duration is required.' });
    }

    const hours = parseInt(durationHours, 10);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ success: false, error: 'Access renewal duration must be a valid positive number of hours.' });
    }

    const adminClient = getSupabaseAdmin();
    const { data: targetProfile, error: fetchErr } = await adminClient
      .from('admin_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return res.status(404).json({ success: false, error: 'Target administrator profile not found.' });
    }

    if (targetProfile.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Owners always remain active and do not expire.' });
    }

    const now = new Date();
    const currentExpires = targetProfile.access_expires_at ? new Date(targetProfile.access_expires_at) : null;
    let newExpires: Date;

    if (currentExpires && currentExpires.getTime() > now.getTime()) {
      newExpires = new Date(currentExpires.getTime() + hours * 60 * 60 * 1000);
    } else {
      newExpires = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    const previous_expires_at = targetProfile.access_expires_at;

    const { error: profileErr } = await adminClient
      .from('admin_profiles')
      .update({
        access_expires_at: newExpires.toISOString(),
        access_last_renewed_at: now.toISOString(),
        access_renewed_by: req.adminProfile!.user_id,
        access_status: 'active',
        status: 'active'
      })
      .eq('id', id);

    if (profileErr) throw profileErr;

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'USER_ACCESS_RENEWED',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'info',
      metadata: { previous_expires_at, duration_added_hours: hours, new_expires_at: newExpires.toISOString() }
    });

    return res.status(200).json({
      success: true,
      message: `Successfully renewed access of ${targetProfile.email}`,
      newExpires: newExpires.toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id/revoke-access
 */
router.post(['/users/:id/revoke-access', '/api/admin/users/:id/revoke-access'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminClient = getSupabaseAdmin();

    const { data: targetProfile, error: fetchErr } = await adminClient
      .from('admin_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return res.status(404).json({ success: false, error: 'Administrator profile not found.' });
    }

    if (targetProfile.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Access to Owner accounts cannot be revoked.' });
    }

    const { error: patchErr } = await adminClient
      .from('admin_profiles')
      .update({
        access_status: 'disabled',
        status: 'disabled',
        access_expires_at: new Date().toISOString()
      })
      .eq('id', id);

    if (patchErr) throw patchErr;

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'ACCESS_REVOKED',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'critical',
      metadata: { previous_status: targetProfile.status }
    });

    return res.status(200).json({ success: true, message: `Successfully revoked administrator access of ${targetProfile.email}.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id
 * DELETE removes a user
 */
router.delete(['/users/:id', '/api/admin/users/:id'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminClient = getSupabaseAdmin();

    const { data: targetProfile, error: fetchErr } = await adminClient
      .from('admin_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return res.status(404).json({ success: false, error: 'Administrator profile not found.' });
    }

    if (targetProfile.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Owner accounts cannot be deleted directly.' });
    }

    if (targetProfile.user_id) {
      await adminClient.auth.admin.deleteUser(targetProfile.user_id).catch(() => {});
    }

    await adminClient.from('admin_profiles').delete().eq('id', id);

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'USER_DELETED',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'critical',
      metadata: { profile_id: targetProfile.id }
    });

    return res.status(200).json({ success: true, message: `User ${targetProfile.email} fully deleted.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id/reset-2fa
 * Owner-only action to securely reset an operator's Authenticator device when their phone is lost.
 */
router.post(['/users/:id/reset-2fa', '/api/admin/users/:id/reset-2fa'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminClient = getSupabaseAdmin();
    const { data: targetProfile } = await adminClient.from('admin_profiles').select('*').eq('id', id).maybeSingle();
    if (!targetProfile) {
      return res.status(404).json({ success: false, error: 'Target profile not found' });
    }

    await resetTotpSecret(targetProfile.email);

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'USER_2FA_RESET_BY_OWNER',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'critical',
      metadata: { target_email: targetProfile.email }
    });

    return res.status(200).json({ 
      success: true, 
      message: `Successfully reset 2FA for ${targetProfile.email}. They will be prompted to re-verify via email and pair a new device on next login.` 
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/self-reset-totp
 * Allows any authenticated operator to rotate / re-pair their own Authenticator app securely from inside the dashboard.
 */
router.post(['/users/self-reset-totp', '/api/admin/users/self-reset-totp'], authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const email = req.adminProfile!.email;
    const result = await initiateInDashboardTotpReset(email);
    if (!result.success) {
      return res.status(400).json(result);
    }

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'USER_SELF_TOTP_ROTATION_INITIATED',
      severity: 'info',
      metadata: { email }
    });

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id/role
 */
router.patch(['/users/:id/role', '/api/admin/users/:id/role'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['owner', 'admin', 'viewer'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role parameter specified' });
    }

    const adminClient = getSupabaseAdmin();
    const { data: targetProfile } = await adminClient.from('admin_profiles').select('*').eq('id', id).maybeSingle();
    if (!targetProfile) {
      return res.status(404).json({ success: false, error: 'Target administrator profile not found' });
    }

    await adminClient.from('admin_profiles').update({ role }).eq('id', id);

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'ROLE_CHANGE',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'critical',
      metadata: { oldRole: targetProfile.role, newRole: role }
    });

    return res.status(200).json({ success: true, message: `Successfully modified ${targetProfile.email} role to ${role}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/users/:id/status
 */
router.patch(['/users/:id/status', '/api/admin/users/:id/status'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'disabled', 'invited'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value specified' });
    }

    const adminClient = getSupabaseAdmin();
    const { data: targetProfile } = await adminClient.from('admin_profiles').select('*').eq('id', id).maybeSingle();
    if (!targetProfile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }

    if (targetProfile.user_id === req.adminProfile!.user_id && status === 'disabled') {
      return res.status(400).json({ success: false, error: 'Operation blocked: You cannot disable your own profile.' });
    }

    await adminClient.from('admin_profiles').update({ status }).eq('id', id);

    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: status === 'disabled' ? 'DISABLE_USER' : 'ENABLE_USER',
      target_user_id: targetProfile.user_id,
      target_email: targetProfile.email,
      severity: 'critical',
      metadata: { state: status }
    });

    return res.status(200).json({ success: true, message: `Successfully updated status to '${status}'` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/audit-logs
 */
router.get(['/audit-logs', '/api/admin/audit-logs'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const adminClient = getSupabaseAdmin();
    const { data: logs, error } = await adminClient
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return res.status(200).json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/logout
 */
router.post(['/logout', '/api/admin/logout'], authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await createAuditLog({
      actor_user_id: req.adminProfile!.user_id,
      actor_email: req.adminProfile!.email,
      action: 'LOGOUT',
      severity: 'info',
      metadata: { timestamp: new Date().toISOString() }
    });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/database/info
 */
router.get(['/database/info', '/api/admin/database/info'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const adminClient = getSupabaseAdmin();
    const TELEMETRY_TABLES = [
      'metrics', 'errors', 'engagement_events', 'contact_events',
      'security_events', 'rate_limits', 'deployments', 'daily_summary',
      'weekly_summary', 'monthly_summary', 'admin_audit_logs'
    ];

    const counts: Record<string, number> = {};
    for (const table of TELEMETRY_TABLES) {
      const { count, error } = await adminClient.from(table).select('created_at', { count: 'exact', head: true });
      counts[table] = error ? 0 : (count || 0);
    }

    return res.status(200).json({
      success: true,
      counts,
      protectedTables: {
        admin_profiles: 'Protected (Identity)',
        admin_invitations: 'Protected (Identity)',
        admin_access_renewals: 'Protected (Identity)'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/database/clear
 */
router.post(['/database/clear', '/api/admin/database/clear'], authenticateAdmin, requireRole(['owner']), async (req: Request, res: Response) => {
  try {
    const { target, tableName, confirmationText } = req.body;
    if (!confirmationText || confirmationText.toUpperCase() !== 'CONFIRM') {
      return res.status(400).json({ success: false, error: "Strict verification failing. You must input the word 'CONFIRM' to clear tables." });
    }

    const adminClient = getSupabaseAdmin();
    const TELEMETRY_TABLES = [
      'metrics', 'errors', 'engagement_events', 'contact_events',
      'security_events', 'rate_limits', 'deployments', 'daily_summary',
      'weekly_summary', 'monthly_summary'
    ];

    if (target === 'table') {
      if (!tableName || !TELEMETRY_TABLES.includes(tableName)) {
        return res.status(403).json({ success: false, error: `Clearing '${tableName}' is not allowed.` });
      }
      await adminClient.from(tableName).delete().gte('created_at', '1970-01-01T00:00:00Z');
      return res.status(200).json({ success: true, message: `Successfully cleared table '${tableName}'.` });
    } else if (target === 'all') {
      for (const table of TELEMETRY_TABLES) {
        try {
          await adminClient.from(table).delete().gte('created_at', '1970-01-01T00:00:00Z');
        } catch {}
      }
      return res.status(200).json({ success: true, message: 'Successfully purged all telemetry tables.' });
    } else {
      return res.status(400).json({ success: false, error: "Invalid target mode specified. Choose 'table' or 'all'." });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: /api/admin/cv/upload
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
}).single('cvFile');

router.post(['/cv/upload', '/api/admin/cv/upload'], authenticateAdmin, requireRole(['owner', 'admin']), (req: Request, res: Response) => {
  const userEmail = req.adminProfile?.email?.toLowerCase();
  const userRole = req.adminProfile?.role;
  if (userRole !== 'owner' || userEmail !== 'angesh021@gmail.com') {
    return res.status(403).json({ error: 'Access Denied: Only the owner Angesh (angesh021@gmail.com) is authorized to manage CV files.' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Vercel Blob Storage token is not configured on the server.' });
  }

  upload(req, res, async (err: any) => {
    if (err) return res.status(400).json({ error: err.message });

    const { language } = req.body;
    if (!language || (language !== 'en' && language !== 'fr')) {
      return res.status(400).json({ error: "Missing or invalid language. Please choose English ('en') or French ('fr')." });
    }

    if (!req.file) return res.status(400).json({ error: 'No CV file was uploaded.' });

    const oldMeta = getCvMetadata(language as 'en' | 'fr');

    try {
      const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      const stablePath = language === 'en' ? 'Resume/AngeshChanderdip_CV_EN.pdf' : 'Resume/AngeshChanderdip_CV_FR.pdf';

      const blob = await put(stablePath, req.file.buffer, {
        access: 'public',
        token,
        contentType: 'application/pdf'
      });

      const newMeta: CvMetadata = {
        language: language as 'en' | 'fr',
        blobUrl: blob.url,
        pathname: blob.pathname,
        sha256,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString()
      };

      saveCvMetadata(newMeta);

      if (oldMeta?.blobUrl && oldMeta.blobUrl !== blob.url) {
        await del(oldMeta.blobUrl, { token }).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: `CV for ${language === 'en' ? 'English' : 'French'} successfully uploaded!`,
        metadata: newMeta
      });
    } catch (uploadError: any) {
      return res.status(500).json({ error: `Upload process failed: ${uploadError.message}` });
    }
  });
});

/**
 * Endpoint: /api/admin/cv/:language
 */
router.delete(['/cv/:language', '/api/admin/cv/:language'], authenticateAdmin, requireRole(['owner', 'admin']), async (req: Request, res: Response) => {
  const userEmail = req.adminProfile?.email?.toLowerCase();
  const userRole = req.adminProfile?.role;
  if (userRole !== 'owner' || userEmail !== 'angesh021@gmail.com') {
    return res.status(403).json({ error: 'Access Denied: Only the owner Angesh (angesh021@gmail.com) is authorized to manage CV files.' });
  }

  const { language } = req.params;
  if (language !== 'en' && language !== 'fr') {
    return res.status(400).json({ error: "Invalid language. Must be 'en' or 'fr'." });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Vercel Blob Storage token is not configured on the server.' });
  }

  const oldMeta = getCvMetadata(language as 'en' | 'fr');
  if (!oldMeta) {
    return res.status(404).json({ error: `No custom CV metadata found for language '${language}' to delete.` });
  }

  try {
    if (oldMeta.blobUrl) {
      await del(oldMeta.blobUrl, { token }).catch(() => {});
    }
    deleteCvMetadata(language as 'en' | 'fr');
    return res.status(200).json({ success: true, message: `CV for ${language === 'en' ? 'English' : 'French'} successfully deleted.` });
  } catch (error: any) {
    return res.status(500).json({ error: `CV deletion failed: ${error.message}` });
  }
});

export default router;
