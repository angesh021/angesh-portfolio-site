/**
 * File: /lib/adminMiddleware.ts
 * Purpose: Authentication & role-check middleware with Upstash rate limiting and audit logging.
 * Protects server-side /api/admin/* endpoints from unauthorized requests.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase, getSupabaseAdmin } from './supabase.js';
import { AdminProfile } from './adminTypes.js';
import { auditRateLimit } from './redis.js';

// Extend Express Request type definition for security injection
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        email: string;
      };
      adminProfile?: AdminProfile;
    }
  }
}

/**
 * Centrally managed secure audit logger. Writes directly to the `admin_audit_logs` table
 * using the server's administrator profile bypass capability.
 */
export async function createAuditLog({
  actor_user_id,
  actor_email,
  action,
  target_user_id = null,
  target_email = null,
  severity,
  metadata = {}
}: {
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_user_id?: string | null;
  target_email?: string | null;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}) {
  const adminClient = getSupabaseAdmin();
  try {
    const { error } = await adminClient
      .from('admin_audit_logs')
      .insert({
        actor_user_id,
        actor_email,
        action,
        target_user_id,
        target_email,
        severity,
        metadata
      });
    if (error) {
      console.error('[AUDIT LOG ERROR] Supabase insert failed:', error.message);
    }
  } catch (err: any) {
    console.error('[AUDIT LOG ERROR] Unexpected exception:', err.message);
  }
}

/**
 * Authentication Middleware: Validates authorization Bearer jwt tokens against Supabase.
 * Binds active profile attributes directly to req.adminProfile upon success.
 */
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Upstash Rate Limit Guard (Checks admin auth attempts against spam bursts)
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const rateLimit = await auditRateLimit(clientIp, 'admin_auth_api', 100, 60); // 100 queries per minute limit
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Too many authentication attempts. Please standby.' });
    }

    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Access token missing' });
    }

    // 2. Validate token with Supabase Client
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      await createAuditLog({
        actor_user_id: null,
        actor_email: null,
        action: 'FAILED_LOGIN_TOKEN_INVALID',
        severity: 'warning',
        metadata: { ip: clientIp, error_msg: authErr?.message || 'User not found' }
      });
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid credentials or session expired' });
    }

    req.adminUser = {
      id: user.id,
      email: user.email || ''
    };

    // 3. Reconcile user_id with admin_profiles table to fetch roles and statuses
    const adminClient = getSupabaseAdmin();
    let { data: profile, error: dbErr } = await adminClient
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile && user.email) {
      // First-time OAuth login connection using email
      const { data: emailProfile } = await adminClient
        .from('admin_profiles')
        .select('*')
        .filter('email', 'eq', user.email.toLowerCase())
        .is('user_id', null)
        .maybeSingle();

      if (emailProfile) {
        // Find matching invitation to get their predetermined validity period
        const { data: invitation } = await adminClient
          .from('admin_invitations')
          .select('access_duration_hours')
          .eq('email', user.email.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const durationHours = invitation?.access_duration_hours || 24; // Default to 24h if missing
        
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        const { data: updatedProfile, error: updateErr } = await adminClient
          .from('admin_profiles')
          .update({ 
            user_id: user.id,
            status: 'active',
            access_status: 'active',
            access_starts_at: now.toISOString(),
            access_expires_at: emailProfile.role === 'owner' ? null : expiresAt.toISOString()
          })
          .eq('id', emailProfile.id)
          .select()
          .single();

        if (!updateErr && updatedProfile) {
          profile = updatedProfile;

          await createAuditLog({
            actor_user_id: user.id,
            actor_email: user.email,
            action: 'USER_FIRST_LOGIN_LINKED',
            severity: 'info',
            metadata: { profile_id: profile.id, provider: user.app_metadata?.provider, access_duration_hours: durationHours }
          });
        }
      }
    }

    if (!profile) {
      // Log failed authorization attempt (e.g. user exists in Auth but has no profile row) -> Wait, we auto-provision instead
      if (user.email) {
        const { data: newProfile, error: insertErr } = await adminClient
          .from('admin_profiles')
          .insert({
            email: user.email.toLowerCase(),
            user_id: user.id,
            role: 'viewer', // default low-privilege role
            status: 'active',
            access_status: 'active',
            access_starts_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (newProfile) {
          profile = newProfile;
          await createAuditLog({
            actor_user_id: user.id,
            actor_email: user.email,
            action: 'USER_FIRST_LOGIN_AUTO_PROVISIONED',
            severity: 'info',
            metadata: { profile_id: profile.id, provider: user.app_metadata?.provider }
          });
        }
      }
      
      if (!profile) {
        await createAuditLog({
          actor_user_id: user.id,
          actor_email: user.email || null,
          action: 'FAILED_AUTHORIZATION_MISSING_PROFILE',
          severity: 'critical',
          metadata: { path: req.path, error: dbErr?.message || 'Profile record absent or unauthorized' }
        });
        return res.status(403).json({ success: false, error: 'Forbidden: No valid administrator profile found.' });
      }
    }

    // Ensure status is active
    if (profile.status !== 'active') {
      await createAuditLog({
        actor_user_id: user.id,
        actor_email: user.email || null,
        action: 'FAILED_AUTHORIZATION_PROFILE_INACTIVE',
        severity: 'critical',
        metadata: { path: req.path, status: profile.status }
      });
      return res.status(403).json({ success: false, error: `Forbidden: Administrator profile is '${profile.status}'` });
    }

    // 4. Temporally-Bound Access Expiration Enforcement
    if (profile.role !== 'owner' && profile.access_expires_at) {
      const expirationTime = new Date(profile.access_expires_at).getTime();
      if (expirationTime <= Date.now()) {
        // Mark access_status as 'expired' in database if it hasn't been marked yet
        if (profile.access_status !== 'expired') {
          await adminClient
            .from('admin_profiles')
            .update({ access_status: 'expired' })
            .eq('id', profile.id);
        }

        await createAuditLog({
          actor_user_id: user.id,
          actor_email: user.email || null,
          action: 'FAILED_ACCESS_EXPIRED',
          severity: 'warning',
          metadata: { path: req.path, access_expires_at: profile.access_expires_at }
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden: Your access duration has expired. Please request the Owner for access renewal.'
        });
      }
    }

    req.adminProfile = profile as AdminProfile;
    next();
  } catch (err: any) {
    console.error('[AUTH MIDDLEWARE EXCEPTION] Fatal crash:', err.message);
    return res.status(500).json({ success: false, error: 'Internal system fault verifying identity.' });
  }
}

/**
 * Authorization Middleware: Asserts that the authenticated profile has one of the allowed roles.
 */
export function requireRole(allowedRoles: ('owner' | 'admin' | 'viewer')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminProfile) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Account context uninitialized' });
    }

    if (!allowedRoles.includes(req.adminProfile.role)) {
      // Record failed authorization directly in persistent log
      createAuditLog({
        actor_user_id: req.adminProfile.user_id,
        actor_email: req.adminProfile.email,
        action: 'FAILED_AUTHORIZATION_ROLE_RESTRICTED',
        severity: 'warning',
        metadata: { path: req.path, userRole: req.adminProfile.role, requiredRoles: allowedRoles }
      });
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient security clearances to access resource.' });
    }

    next();
  };
}
