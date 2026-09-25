export type AdminRole = 'owner' | 'admin' | 'viewer';
export type AdminStatus = 'active' | 'invited' | 'disabled';
export type AccessStatus = 'active' | 'expired' | 'disabled' | 'invited';
export type AuditLogSeverity = 'info' | 'warning' | 'critical';

export interface AdminProfile {
  id: string;
  user_id: string | null;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  access_starts_at?: string | null;
  access_expires_at?: string | null;
  access_last_renewed_at?: string | null;
  access_renewed_by?: string | null;
  access_status?: AccessStatus;
}

export interface AdminAuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  severity: AuditLogSeverity;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  token_hash: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  access_duration_hours?: number | null;
  access_starts_at?: string | null;
  access_expires_at?: string | null;
}
