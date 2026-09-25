/**
 * File: /components/dashboard/UserManagement.tsx
 * Purpose: Secure dashboard user access control module with time-limited capabilities and logs.
 * Enables Owners to invite, adjust roles, revoke, and renew access for team members.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, Mail, UserPlus, ShieldAlert, CheckCircle, 
  Trash2, Ban, Shield, Eye, RefreshCw, AlertCircle,
  Clock, Hourglass, Calendar, Trash, Lock, Unlock, History, Info,
  Copy, Check, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  invited_by: string | null;
  created_at: string;
  last_login_at: string | null;
  access_starts_at?: string | null;
  access_expires_at?: string | null;
  access_last_renewed_at?: string | null;
  access_renewed_by?: string | null;
  access_status?: 'active' | 'expired' | 'disabled' | 'invited';
}

export const UserManagement: React.FC = () => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'admin' | 'viewer'>('viewer');
  
  // Invitation Duration Options
  const [inviteDurationType, setInviteDurationType] = useState<'8h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [customInviteHours, setCustomInviteHours] = useState(24);
  const [customInviteUnit, setCustomInviteUnit] = useState<'hours' | 'days'>('hours');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Renewal Modal
  const [renewingProfile, setRenewingProfile] = useState<Profile | null>(null);
  const [renewDurationType, setRenewDurationType] = useState<'8h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [customRenewHours, setCustomRenewHours] = useState(24);
  const [customRenewUnit, setCustomRenewUnit] = useState<'hours' | 'days'>('hours');
  const [isRenewSubmitting, setIsRenewSubmitting] = useState(false);

  // Revoking Modal
  const [revokingProfile, setRevokingProfile] = useState<Profile | null>(null);
  const [isRevokingSubmitting, setIsRevokingSubmitting] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);
  const [isDeletingSubmitting, setIsDeletingSubmitting] = useState(false);



  // Audit Logs Filtered for accounts & logins
  const [accountAuditLogs, setAccountAuditLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditItemsPerPage, setAuditItemsPerPage] = useState(10);

  // Current time state to drive ticking timers
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 15000); // refresh every 15s to update remaining timers
    return () => clearInterval(timer);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUserProfile(data.profile);
      }
    } catch (e) {
      console.error("Me fetch error:", e);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfiles(data.users);
      } else {
        throw new Error(data.error || 'Failed to list administrators');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLogsLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const securityEvents = [
          'USER_INVITED',
          'INVITE_USER',
          'USER_ACCESS_RENEWED',
          'ACCESS_GRANTED',
          'ACCESS_REVOKED',
          'FAILED_LOGIN_TOKEN_INVALID',
          'FAILED_AUTHORIZATION_MISSING_PROFILE',
          'FAILED_AUTHORIZATION_PROFILE_INACTIVE',
          'FAILED_ACCESS_EXPIRED',
          'ROLE_CHANGE',
          'DISABLE_USER',
          'ENABLE_USER',
          'LOGOUT',
          'ME_PROFILE_RECONCILE'
        ];
        const filtered = data.logs.filter((log: any) => securityEvents.includes(log.action));
        setAccountAuditLogs(filtered);
      }
    } catch (e) {
      console.error("Logs fetch error:", e);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreatedInviteUrl(null);
    setCopiedInvite(false);

    // Compute final invite access duration in hours
    let finalHours = 24;
    if (inviteDurationType === '8h') finalHours = 8;
    else if (inviteDurationType === '24h') finalHours = 24;
    else if (inviteDurationType === '7d') finalHours = 168;
    else if (inviteDurationType === '30d') finalHours = 720;
    else {
      finalHours = customInviteUnit === 'hours' ? customInviteHours : customInviteHours * 24;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: emailInput.trim(), 
          role: roleInput,
          durationHours: finalHours
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Successfully pre-authorized ${emailInput} with ${finalHours} hours access.`);
        setCreatedInviteUrl(null);
        setEmailInput('');
        fetchUsers();
        fetchAuditLogs();
      } else {
        setCreatedInviteUrl(null);
        throw new Error(data.error || 'Failed pre-authorizing user');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: 'owner' | 'admin' | 'viewer') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch(`/api/admin/users/${profileId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Role successfully changed to ${newRole}`);
        fetchUsers();
        fetchAuditLogs();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Immediate Revoke access submit handler
  const handleRevokeConfirmSubmit = async () => {
    if (!revokingProfile) return;
    setIsRevokingSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch(`/api/admin/users/${revokingProfile.id}/revoke-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Revoked temporary access for ${revokingProfile.email}`);
        setRevokingProfile(null);
        fetchUsers();
        fetchAuditLogs();
      } else {
        throw new Error(data.error || 'Failed to revoke credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsRevokingSubmitting(false);
    }
  };

  const handleDeleteConfirmSubmit = async () => {
    if (!deletingProfile) return;
    setIsDeletingSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch(`/api/admin/users/${deletingProfile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `User ${deletingProfile.email} fully deleted`);
        setDeletingProfile(null);
        fetchUsers();
        fetchAuditLogs();
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsDeletingSubmitting(false);
    }
  };

  // Confirm Renew Access
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingProfile) return;
    setIsRenewSubmitting(true);

    let finalHours = 24;
    if (renewDurationType === '8h') finalHours = 8;
    else if (renewDurationType === '24h') finalHours = 24;
    else if (renewDurationType === '7d') finalHours = 168;
    else if (renewDurationType === '30d') finalHours = 720;
    else {
      finalHours = customRenewUnit === 'hours' ? customRenewHours : customRenewHours * 24;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated context');

      const res = await fetch(`/api/admin/users/${renewingProfile.id}/renew-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ durationHours: finalHours })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Access for ${renewingProfile.email} renewed successfully.`);
        setRenewingProfile(null);
        fetchUsers();
        fetchAuditLogs();
      } else {
        throw new Error(data.error || 'Failed renewing access');
      }
    } catch (err: any) {
      setErrorMsg(`Error renewing access: ${err.message}`);
    } finally {
      setIsRenewSubmitting(false);
    }
  };



  // Access status determination display
  const getAccessStatus = (profile: Profile) => {
    if (profile.status === 'disabled' || profile.access_status === 'disabled') {
      return { label: 'Disabled', style: 'bg-zinc-800 border-zinc-700 text-zinc-400' };
    }
    if (profile.status === 'invited' || profile.access_status === 'invited') {
      return { label: 'Pre-authorized', style: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' };
    }
    if (profile.role === 'owner') {
      return { label: 'Active', style: 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400' };
    }
    if (profile.access_expires_at) {
      const expiry = new Date(profile.access_expires_at).getTime();
      const diff = expiry - nowTick;
      if (diff <= 0) {
        return { label: 'Expired', style: 'bg-red-950/40 border-red-500/20 text-red-400' };
      }
      if (diff <= 2 * 60 * 60 * 1000) {
        // Less than 2 hours remaining
        return { label: 'Expiring Soon', style: 'bg-amber-950/40 border-amber-500/20 text-amber-400 animate-pulse' };
      }
    }
    return { label: 'Active', style: 'bg-emerald-950/40 border-emerald-500/20 text-[#26F0C4]' };
  };

  // Expiration countdown time string remaining
  const getTimeRemainingStr = (profile: Profile) => {
    if (profile.role === 'owner') {
      return { text: 'Unlimited', color: 'text-indigo-400' };
    }
    if (!profile.access_expires_at) {
      return { text: 'N/A', color: 'text-zinc-500' };
    }
    const expiry = new Date(profile.access_expires_at).getTime();
    const diff = expiry - nowTick;
    if (diff <= 0) {
      return { text: 'Expired', color: 'text-red-400 font-extrabold font-mono' };
    }

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const d = Math.floor(h / 24);

    if (d > 0) {
      const remHours = h % 24;
      return {
        text: `${d}d ${remHours}h remaining`,
        color: d <= 1 ? 'text-amber-400' : 'text-emerald-400'
      };
    }
    if (h > 0) {
      return { text: `${h}h ${m}m remaining`, color: 'text-amber-400' };
    }
    return { text: `${m}m remaining`, color: 'text-red-400 animate-pulse font-bold' };
  };

  // Access Renewal Preview Formula Logic
  const getRenewExpiresPreviewDate = (profile: Profile) => {
    let finalRenewHours = 24;
    if (renewDurationType === '8h') finalRenewHours = 8;
    else if (renewDurationType === '24h') finalRenewHours = 24;
    else if (renewDurationType === '7d') finalRenewHours = 168;
    else if (renewDurationType === '30d') finalRenewHours = 720;
    else {
      finalRenewHours = customRenewUnit === 'hours' ? customRenewHours : customRenewHours * 24;
    }

    const now = new Date();
    const currentExpires = profile.access_expires_at ? new Date(profile.access_expires_at) : null;
    let previewDate: Date;

    if (currentExpires && currentExpires.getTime() > now.getTime()) {
      previewDate = new Date(currentExpires.getTime() + finalRenewHours * 60 * 60 * 1000);
    } else {
      previewDate = new Date(now.getTime() + finalRenewHours * 60 * 60 * 1000);
    }
    return previewDate;
  };

  const isOwner = currentUserProfile?.role === 'owner';

  return (
    <div className="flex flex-col gap-6 text-left" id="user-management">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1F2225]/40 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#E5E7EB] flex items-center gap-2">
            <Users size={20} className="text-[#26F0C4]" />
            Identity, Access & Account Management
          </h2>
          <p className="text-xs text-[#8B929A] mt-1 font-sans">
            Provision roles, set access limits, extend durations, and audit complete security and authentication events.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchUsers(); fetchAuditLogs(); }}
            className="h-[38px] px-3.5 rounded-lg bg-[#141719] border border-[#1F2225] hover:border-[#8B929A]/50 text-xs text-[#E5E7EB] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Systems</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111315]/50 border border-[#1F2225] p-4 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B929A]">Total Personnel</span>
          <span className="text-xl font-bold font-mono text-[#E5E7EB] mt-1">{profiles.length}</span>
        </div>
        <div className="bg-[#111315]/50 border border-[#1F2225] p-4 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#26F0C4]">Active Temporary Sessions</span>
          <span className="text-xl font-bold font-mono text-[#26F0C4] mt-1">
            {profiles.filter(p => p.role !== 'owner' && p.access_expires_at && new Date(p.access_expires_at).getTime() > nowTick).length}
          </span>
        </div>
        <div className="bg-[#111315]/50 border border-[#1F2225] p-4 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">Expired Sessions</span>
          <span className="text-xl font-bold font-mono text-red-400 mt-1">
            {profiles.filter(p => p.role !== 'owner' && p.access_expires_at && new Date(p.access_expires_at).getTime() <= nowTick).length}
          </span>
        </div>
        <div className="bg-[#111315]/50 border border-[#1F2225] p-4 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B929A]">Secured Group Role</span>
          <span className="text-xs font-bold font-mono text-indigo-400 uppercase mt-2">
            🛡️ {currentUserProfile?.role || 'FETCHING'}
          </span>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <AnimatePresence mode="popLayout">
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-4"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-300">{errorMsg}</div>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-950/20 border border-[#26F0C4]/20 rounded-xl flex flex-col gap-3"
          >
            <div className="flex items-start gap-4">
              <CheckCircle size={16} className="text-[#26F0C4] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#26F0C4] leading-relaxed">{successMsg}</div>
            </div>
            
            {createdInviteUrl && (
              <div className="ml-8 mt-1 p-3 bg-black/40 border border-[#26F0C4]/10 rounded-lg flex flex-col gap-2">
                <span className="text-[10px] text-[#26F0C4]/70 font-mono uppercase tracking-wider">
                  Important: Resend might be restricted to verified domains. Share this link directly with the user:
                </span>
                <div className="flex items-center gap-2">
                  <input 
                    readOnly 
                    value={createdInviteUrl} 
                    className="flex-1 bg-transparent border-none outline-none text-xs text-[#E5E7EB] font-mono selection:bg-[#26F0C4]/30 truncate"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteUrl);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2000);
                    }}
                    className="p-1.5 hover:bg-[#26F0C4]/10 rounded-md transition-colors border border-[#26F0C4]/20 text-[#26F0C4]"
                    title="Copy invite URL to clipboard"
                  >
                    {copiedInvite ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ADD AUTHORIZED USER CARD */}
        <div className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 h-fit flex flex-col">
          <h3 className="text-sm font-bold text-[#E5E7EB] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
            <UserPlus size={16} className="text-[#26F0C4]" />
            Add Administrator
          </h3>
          
          {isOwner ? (
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-[#8B929A]">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 p-2.5 pl-9 rounded-xl text-xs font-mono text-[#E5E7EB] outline-none transition-colors"
                    required
                  />
                  <Mail size={14} className="absolute left-3 top-3.5 text-[#8B929A]" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-[#8B929A]">Administrative Role</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 p-2.5 rounded-xl text-xs font-mono text-[#E5E7EB] outline-none transition-colors cursor-pointer"
                >
                  <option value="admin">Admin (Edit Settings & Analytics)</option>
                  <option value="viewer">Viewer (Read-Only Logs/Telemetry)</option>
                </select>
              </div>

              {/* Access Duration Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-mono text-[#8B929A]">Access Expiry Duration</label>
                <select
                  value={inviteDurationType}
                  onChange={(e) => setInviteDurationType(e.target.value as any)}
                  className="w-full bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 p-2.5 rounded-xl text-xs font-mono text-[#E5E7EB] outline-none transition-colors cursor-pointer"
                >
                  <option value="8h">8 Hours</option>
                  <option value="24h">24 Hours (1 Day)</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">1 Month (30 Days)</option>
                  <option value="custom">Custom Limit...</option>
                </select>

                {inviteDurationType === 'custom' && (
                  <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-[#0A0C0E] rounded-xl border border-[#1F2225]">
                    <input
                      type="number"
                      min={1}
                      value={customInviteHours}
                      onChange={(e) => setCustomInviteHours(Math.max(1, parseInt(e.target.value, 10)))}
                      className="w-full bg-[#111315] border border-[#1F2225] p-2 rounded-lg text-xs font-mono text-[#E5E7EB]"
                    />
                    <select
                      value={customInviteUnit}
                      onChange={(e) => setCustomInviteUnit(e.target.value as any)}
                      className="w-full bg-[#111315] border border-[#1F2225] p-1.5 rounded-lg text-xs font-mono text-[#E5E7EB]"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#0A0C0E] border border-[#1F2225] rounded-xl text-[11px] text-[#8B929A] leading-relaxed flex items-start gap-2">
                <Info size={14} className="text-[#26F0C4] flex-shrink-0 mt-0.5" />
                <span>Pre-authorized users can log in via Google/GitHub OAuth using this registered email. Their access duration starts automatically from their first login.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !emailInput}
                className="mt-1 w-full h-[40px] rounded-xl bg-[#26F0C4] hover:bg-[#20caa4] text-[#0A0C0E] font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Key size={14} />
                    <span>Grant Access</span>
                  </>
                )}
              </button>


            </form>
          ) : (
            <div className="p-4 bg-[#0A0C0E] border border-[#1F2225] rounded-xl flex items-center gap-3 text-semibold text-xs text-[#8B929A]">
              <Ban size={15} className="text-[#8B929A]" />
              <span>Only Owners are authorized to dispatch pending user invitations.</span>
            </div>
          )}
        </div>

        {/* ACTIVE TEAM ROSTER TABLE CARD */}
        <div className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-bold text-[#E5E7EB] flex items-center gap-2 font-mono uppercase tracking-wider">
              <Shield size={16} className="text-[#26F0C4]" />
              Personnel Authorizations
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider uppercase">
              <div className="flex flex-col gap-1 items-center bg-[#0A0C0E] border border-[#1F2225] p-1.5 px-3 rounded-lg">
                <span className="text-[#8B929A] text-[9px]">Active</span>
                <span className="text-emerald-400 text-sm">{profiles.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex flex-col gap-1 items-center bg-[#0A0C0E] border border-[#1F2225] p-1.5 px-3 rounded-lg">
                <span className="text-[#8B929A] text-[9px]">Pre-Auth</span>
                <span className="text-indigo-400 text-sm">{profiles.filter(p => p.status === 'invited').length}</span>
              </div>
              <div className="flex flex-col gap-1 items-center bg-[#0A0C0E] border border-[#1F2225] p-1.5 px-3 rounded-lg">
                <span className="text-[#8B929A] text-[9px]">Disabled</span>
                <span className="text-red-400 text-sm">{profiles.filter(p => p.status === 'disabled').length}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1F2225] text-[#8B929A] font-mono text-[10px] uppercase tracking-wider pb-3.5">
                  <th className="pb-3 pl-2">User details</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">State check</th>
                  <th className="pb-3 text-center">Remaining time</th>
                  <th className="pb-3 text-center">Last Renewed</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2225]/40 text-xs font-mono">
                {profiles.map((profile) => {
                  const statusInfo = getAccessStatus(profile);
                  const countdown = getTimeRemainingStr(profile);
                  return (
                    <tr key={profile.id} className="hover:bg-[#1C2023]/20 transition-all">
                      <td className="py-4 pl-2 h-14 select-all">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#E5E7EB]">{profile.email}</span>
                          {profile.last_login_at ? (
                            <span className="text-[9px] text-[#8B929A] mt-0.5">Logged: {new Date(profile.last_login_at).toLocaleString()}</span>
                          ) : (
                            <span className="text-[9px] text-zinc-500 mt-0.5">Never logged in</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          {profile.role === 'owner' ? (
                            <span className="flex items-center gap-1 text-[9.5px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-extrabold select-none">
                              <Shield size={9} /> OWNER
                            </span>
                          ) : isOwner ? (
                            <select
                              value={profile.role}
                              onChange={(e) => handleRoleChange(profile.id, e.target.value as any)}
                              disabled={profile.status === 'invited'}
                              className="bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 text-[11px] p-1 rounded text-[#E5E7EB] outline-none cursor-pointer"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">{profile.role}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center font-sans font-semibold text-[10px] px-2 py-0.5 rounded border ${statusInfo.style}`}>
                          ● {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center select-none">
                          <span className={`text-[11px] font-bold ${countdown.color}`}>
                            {countdown.text}
                          </span>
                          {profile.access_expires_at && profile.role !== 'owner' && (
                            <span className="text-[9px] text-zinc-500 scale-95 mt-0.5">
                              {new Date(profile.access_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center">
                          {profile.access_last_renewed_at ? (
                            <>
                              <span className="text-[10px] text-zinc-300">
                                {new Date(profile.access_last_renewed_at).toLocaleDateString()}
                              </span>
                              <span className="text-[9px] text-zinc-500">
                                {new Date(profile.access_last_renewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-600 font-sans text-[11px]">No renewals</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        {profile.role !== 'owner' ? (
                          <div className="inline-flex gap-1.5">
                            {/* Renew Button */}
                            <button
                              onClick={() => {
                                setRenewingProfile(profile);
                              }}
                              disabled={!isOwner}
                              className="px-2.5 py-1 rounded bg-[#1C2023] border border-[#2B3035] hover:border-[#26F0C4]/40 hover:text-[#26F0C4] text-[#E5E7EB] text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:hover:border-[#2B3035] disabled:hover:text-zinc-400"
                              title="Renew Temporary Access Extenders"
                            >
                              <Clock size={11} />
                              <span>Renew</span>
                            </button>

                            {/* Revoke Button */}
                            <button
                              onClick={() => setRevokingProfile(profile)}
                              disabled={!isOwner || profile.status === 'disabled'}
                              className="px-2 py-1 rounded bg-amber-950/20 border border-amber-500/20 hover:bg-amber-950/40 hover:border-amber-500/40 text-amber-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30"
                              title="Revoke and expunge access Immediately"
                            >
                              <Ban size={11} />
                              <span>Revoke</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingProfile(profile)}
                              disabled={!isOwner}
                              className="px-2 py-1 rounded bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 hover:border-red-500/40 text-red-500 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30"
                              title="Completely delete user"
                            >
                              <Trash2 size={11} />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-indigo-400/50 italic mr-2 select-none">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8B929A]">
                      Acquiring security group authorizations list...
                    </td>
                  </tr>
                )}
                {!isLoading && profiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-[#8B929A]">
                      Zero administrator profiles recorded in active schemas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RENEW ACCESS DIALOG / MODAL (OWNER INTERACTIVE VIEW) */}
      <AnimatePresence>
        {renewingProfile && (
          <div className="fixed inset-0 bg-[#000]/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 w-full max-w-md shadow-2xl text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2225]">
                <h4 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock className="text-[#26F0C4]" size={16} />
                  Access Renewal Console
                </h4>
                <button 
                  onClick={() => setRenewingProfile(null)}
                  className="p-1 px-2.5 rounded-md hover:bg-[#1C2023] text-[#8B929A] hover:text-[#E2E8F0] text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 flex flex-col gap-4">
                <div className="text-xs text-zinc-300">
                  Select renewal duration extensions for <strong className="text-white select-all">{renewingProfile.email}</strong>.
                </div>

                <div className="bg-[#0A0C0E] p-3 rounded-lg border border-[#1F2225] text-[11px] text-[#8B929A] flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Target current status:</span>
                    <span className="text-white capitalize">{renewingProfile.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Expiration:</span>
                    <span className="text-white font-mono">
                      {renewingProfile.access_expires_at ? new Date(renewingProfile.access_expires_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Duration options select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-mono text-[#8B929A]">Renewal Duration Extension</label>
                  <select
                    value={renewDurationType}
                    onChange={(e) => setRenewDurationType(e.target.value as any)}
                    className="w-full bg-[#0A0C0E] border border-[#1F2225] p-2 rounded-xl text-xs font-mono text-[#E5E7EB] outline-none cursor-pointer"
                  >
                    <option value="8h">8 Hours</option>
                    <option value="24h">24 Hours (1 Day)</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">1 Month (30 Days)</option>
                    <option value="custom">Custom Extension...</option>
                  </select>

                  {renewDurationType === 'custom' && (
                    <div className="mt-2 grid grid-cols-2 gap-2 p-2 bg-[#0A0C0E] rounded-xl border border-[#1F2225]">
                      <input
                        type="number"
                        min={1}
                        value={customRenewHours}
                        onChange={(e) => setCustomRenewHours(Math.max(1, parseInt(e.target.value, 10)))}
                        className="w-full bg-[#111315] border border-[#1F2225] p-2 rounded-lg text-xs font-mono text-[#E5E7EB]"
                      />
                      <select
                        value={customRenewUnit}
                        onChange={(e) => setCustomRenewUnit(e.target.value as any)}
                        className="w-full bg-[#111315] border border-[#1F2225] p-1.5 rounded-lg text-xs font-mono text-[#E5E7EB]"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Dynamic Preview Formula */}
                <div className="bg-[#0F1C1C] p-3 rounded-lg border border-teal-900/30 text-[11.5px] leading-relaxed flex flex-col gap-1">
                  <span className="text-[#26F0C4] font-bold text-[10px] uppercase font-mono tracking-wider mb-1 flex items-center gap-1">
                    <Info size={11} /> PREVIEW EXTENSION OUTCOME
                  </span>
                  <div className="flex justify-between text-zinc-300">
                    <span>New Expiration Date:</span>
                    <span className="text-[#26F0C4] font-mono font-bold">
                      {getRenewExpiresPreviewDate(renewingProfile).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 italic leading-tight">
                    “Renewal is added to the current expiration date if access is still active.”
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1F2225]">
                <button
                  type="button"
                  onClick={() => setRenewingProfile(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenewSubmit}
                  disabled={isRenewSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#26F0C4] hover:bg-[#20caa4] text-[#0A0C0E] text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isRenewSubmitting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>Confirm Renewal</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVOKE ACCESS CONFIRMATION DIALOG / MODAL (OWNER INTERACTIVE VIEW) */}
      <AnimatePresence>
        {revokingProfile && (
          <div className="fixed inset-0 bg-[#000]/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111315] border border-red-500/10 rounded-2xl p-6 w-full max-w-md shadow-2xl text-left relative overflow-hidden"
            >
              {/* Top border highlight in red gradient */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

              <div className="flex items-center justify-between pb-3 border-b border-[#1F2225]">
                <h4 className="text-sm font-bold text-[#E5E7EB] uppercase tracking-wider font-mono flex items-center gap-2">
                  <ShieldAlert className="text-red-400 animate-pulse" size={16} />
                  Confirm Access Revocation
                </h4>
                <button 
                  onClick={() => setRevokingProfile(null)}
                  className="p-1 px-2.5 rounded-md hover:bg-[#1C2023] text-[#8B929A] hover:text-[#E2E8F0] text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 flex flex-col gap-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  You are about to immediately revoke all privileges and terminate current active sessions for <strong className="text-white select-all">{revokingProfile.email}</strong>.
                </p>

                <div className="bg-[#1a1012] border border-red-950/40 p-4 rounded-xl flex items-start gap-3">
                  <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-red-400">Security Warning</span>
                    <p className="text-[10.5px] leading-relaxed text-zinc-400">
                      This operator will be instantly logged out and locked out from the Aetherius OS core database. This action is logged permanently to the personnel audit trails.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1F2225]">
                <button
                  type="button"
                  onClick={() => setRevokingProfile(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeConfirmSubmit}
                  disabled={isRevokingSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isRevokingSubmitting ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <>
                      <Ban size={11} />
                      <span>Immediately Revoke</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {deletingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0C0E] border border-red-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl relative shadow-red-900/10"
            >
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-sm font-bold text-red-500 font-mono tracking-wider flex items-center gap-2">
                  <Trash2 size={16} />
                  DELETE PERSONNEL PROFILE
                </h2>
                <button 
                  onClick={() => setDeletingProfile(null)}
                  className="p-1 px-2.5 rounded-md hover:bg-[#1C2023] text-[#8B929A] hover:text-[#E2E8F0] text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 flex flex-col gap-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  You are about to <strong className="text-red-400">permanently delete</strong> the account and all associated privileges for <strong className="text-white select-all">{deletingProfile.email}</strong>.
                </p>

                <div className="bg-[#1a1012] border border-red-950/40 p-4 rounded-xl flex items-start gap-3">
                  <ShieldAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-red-400">Irreversible Action Warning</span>
                    <p className="text-[10.5px] leading-relaxed text-zinc-400">
                      This operator's login credentials and profile will be permanently removed from the system. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1F2225]">
                <button
                  type="button"
                  onClick={() => setDeletingProfile(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmSubmit}
                  disabled={isDeletingSubmitting}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isDeletingSubmitting ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={11} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOCKS, AUTHENTICATIONS & ACCOUNT CHANGE SECURITY AUDIT LOGS */}
      <div className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 shadow-xl w-full">
        <h3 className="text-sm font-bold text-[#E5E7EB] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
          <History size={16} className="text-[#26F0C4]" />
          Personnel Security & Account Audit Trails
        </h3>
        <p className="text-xs text-[#8B929A] -mt-2 mb-5">
          Real-time immutably written telemetry reports tracks login triggers, role alterations, access renewals, and temporal credentials expirations.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F2225] text-[#8B929A] text-[9.5px] uppercase tracking-wider pb-3">
                <th className="pb-3 pl-2">UTC Timestamp</th>
                <th className="pb-3">Trigger action</th>
                <th className="pb-3">Responsible operator</th>
                <th className="pb-3 text-center">Severity</th>
                <th className="pb-3 pr-2 text-right">Action parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2225]/30">
              {accountAuditLogs.slice((auditCurrentPage - 1) * auditItemsPerPage, auditCurrentPage * auditItemsPerPage).map((log) => {
                const isCritChange = log.severity === 'critical';
                const isWarnChange = log.severity === 'warning';
                return (
                  <tr key={log.id} className="hover:bg-[#1C2023]/20 transition-all h-12">
                    <td className="py-2 pl-2 text-zinc-400 text-[10.5px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                        log.action.includes('RENEW') || log.action.includes('GRANT')
                          ? 'text-teal-400 bg-teal-500/10'
                          : log.action.includes('FAIL') || log.action.includes('EXPIRE') || log.action.includes('REVOKE')
                          ? 'text-red-400 bg-red-400/10 animate-pulse'
                          : 'text-[#E5E7EB] bg-zinc-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-300">
                      {log.actor_email ? (
                        <span className="font-semibold">{log.actor_email}</span>
                      ) : (
                        <span className="text-zinc-500 italic">SYSTEM AUTOMATIC</span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase select-none ${
                        isCritChange 
                          ? 'text-red-400 border border-red-500/30' 
                          : isWarnChange 
                          ? 'text-amber-400 border border-amber-500/30' 
                          : 'text-zinc-500 border border-zinc-700/50'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-right text-zinc-400 text-[10px] max-w-[200px] truncate select-all" title={JSON.stringify(log.metadata)}>
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                );
              })}

              {isLogsLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-xs text-[#8B929A]">
                    Retrieving account security logs...
                  </td>
                </tr>
              )}
              {!isLogsLoading && accountAuditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-xs text-[#8B929A]">
                    No historical security activities mapped.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {accountAuditLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-[#0A0C0E]/50 rounded-xl border border-[#1F2225]/45">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <span className="text-[11px] text-[#8B929A] font-mono">Show:</span>
              <select 
                className="bg-[#141719] border border-[#2B3035] text-[#E5E7EB] text-xs font-mono rounded px-2 py-1 outline-none focus:border-[#26F0C4]/50 cursor-pointer"
                value={auditItemsPerPage}
                onChange={(e) => {
                  setAuditItemsPerPage(Number(e.target.value));
                  setAuditCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
              <span className="text-[11px] text-[#8B929A] font-mono">per page</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                disabled={auditCurrentPage === 1}
                onClick={() => setAuditCurrentPage(p => Math.max(1, p - 1))}
                className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-xs font-mono text-[#E5E7EB]">
                Page {auditCurrentPage} of {Math.ceil(accountAuditLogs.length / auditItemsPerPage) || 1}
              </span>
              <button 
                disabled={auditCurrentPage === (Math.ceil(accountAuditLogs.length / auditItemsPerPage) || 1)}
                onClick={() => setAuditCurrentPage(p => Math.min(Math.ceil(accountAuditLogs.length / auditItemsPerPage) || 1, p + 1))}
                className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
