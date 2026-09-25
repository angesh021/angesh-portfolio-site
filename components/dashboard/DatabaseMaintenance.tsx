/**
 * File: /components/dashboard/DatabaseMaintenance.tsx
 * Purpose: Secure dashboard system administration database cleansing panel.
 * Designed specifically for SRE Owners to safely truncate active telemetry, log tables, and ROLLUP rollup summaries.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Database, Trash2, RefreshCw, AlertCircle, CheckCircle, 
  ShieldAlert, Shield, Lock, FileText, Activity, Zap, Info, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TableMeta {
  tableName: string;
  count: number;
  description: string;
  type: 'telemetry' | 'rollup' | 'admin' | 'protected';
  severity: 'low' | 'medium' | 'high';
  isProtected?: boolean;
}

export const DatabaseMaintenance: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deletion Modal / Action States
  const [activeTarget, setActiveTarget] = useState<'table' | 'all' | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Whitelisted database metadata descriptions
  const TABLE_CATALOG: Omit<TableMeta, 'count'>[] = [
    { 
      tableName: 'metrics', 
      description: 'Web Vitals scores (LCP, CLS, INP, TTFB) & page visit load timings.',
      type: 'telemetry',
      severity: 'low'
    },
    { 
      tableName: 'errors', 
      description: 'Javascript, React bounds, asset resources, and serverless API execution failure exceptions.',
      type: 'telemetry',
      severity: 'low'
    },
    { 
      tableName: 'engagement_events', 
      description: 'Call-to-Action engagements, External URLs, Dossier view actions, and download patterns.',
      type: 'telemetry',
      severity: 'low'
    },
    { 
      tableName: 'contact_events', 
      description: 'Feedback form completion logs, automated rate-limit audits, spam counts, and validation checks.',
      type: 'telemetry',
      severity: 'medium'
    },
    { 
      tableName: 'security_events', 
      description: 'Host rate limits, automated script prevention flags, cross-site policy violations, and suspicious access blocks.',
      type: 'telemetry',
      severity: 'medium'
    },
    { 
      tableName: 'rate_limits', 
      description: 'IP rate limit registers safeguarding API gateways from denial of service and script exploitation.',
      type: 'telemetry',
      severity: 'medium'
    },
    { 
      tableName: 'deployments', 
      description: 'SRE Release metadata records reflecting application updates and historical latency deltas.',
      type: 'telemetry',
      severity: 'low'
    },
    { 
      tableName: 'daily_summary', 
      description: 'Compressed daily aggregation summaries powering long-term analytics graphs and SRE scorecards.',
      type: 'rollup',
      severity: 'high'
    },
    { 
      tableName: 'weekly_summary', 
      description: 'Weekly telemetry trends summaries powering wide-period SRE aggregation metrics.',
      type: 'rollup',
      severity: 'high'
    },
    { 
      tableName: 'monthly_summary', 
      description: 'Monthly SRE analytics data summarizing wide timeline trends.',
      type: 'rollup',
      severity: 'high'
    },
    { 
      tableName: 'admin_audit_logs', 
      description: 'Historical records tracking all SRE identity operations, personnel logins, and security revokes.',
      type: 'admin',
      severity: 'high',
      isProtected: true
    }
  ];

  const fetchDatabaseInfo = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/database/info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCounts(data.counts || {});
      } else {
        setErrorMsg(data.error || 'Failed to retreive database system configurations.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Fatal exception synchronizing metadata.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const handleClearTable = (tableName: string) => {
    setSelectedTableName(tableName);
    setActiveTarget('table');
    setConfirmationInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClearAll = () => {
    setSelectedTableName(null);
    setActiveTarget('all');
    setConfirmationInput('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const executePurge = async () => {
    if (confirmationInput.toUpperCase() !== 'CONFIRM') {
      setErrorMsg("Security Mismatch: You must enter 'CONFIRM' to execute cleansing operations.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) {
        setErrorMsg('Unauthorized session execution.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        target: activeTarget,
        tableName: selectedTableName,
        confirmationText: confirmationInput
      };

      const res = await fetch('/api/admin/database/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Cleansing executed securely.');
        setActiveTarget(null);
        setConfirmationInput('');
        // Refresh counts
        await fetchDatabaseInfo(true);
      } else {
        setErrorMsg(data.error || 'The system was unable to execute the requested purge.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Fatal error occurred connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build overall totals
  const totalCount = Object.values(counts).reduce((acc, val) => acc + val, 0);

  // Compute purgeable totals (excluding protected logs)
  const purgeableTables = TABLE_CATALOG.filter(t => !t.isProtected);
  const totalPurgeableCount = purgeableTables.reduce((acc, t) => acc + (counts[t.tableName] ?? 0), 0);

  return (
    <div className="space-y-6 w-full text-left" id="database-maintenance-panel">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2225]/40 pb-5">
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Database className="text-[#FF4A6B]" size={20} />
            Database Cleansing Panel
          </h2>
          <p className="text-[11px] font-semibold text-[#8B929A] mt-1 uppercase tracking-wider font-mono">
            Secure Operation Gateway • System Maintenance Mode
          </p>
        </div>

        <button
          onClick={() => fetchDatabaseInfo()}
          disabled={isLoading}
          className="h-9 px-4 bg-[#141719] border border-[#1F2225] hover:border-zinc-700 disabled:opacity-50 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 outline-none cursor-pointer self-start md:self-center select-none"
        >
          <RefreshCw size={12} className={`${isLoading ? 'animate-spin text-[#FF4A6B]' : 'text-zinc-400'}`} />
          {isLoading ? 'Reloading...' : 'Sync Data Quantities'}
        </button>
      </div>

      {/* FEEDBACK SYSTEM NOTIFICATIONS */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/15 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
          <p className="text-xs font-medium text-red-300 leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/15 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
          <p className="text-xs font-medium text-emerald-300 leading-relaxed">{successMsg}</p>
        </div>
      )}

      {/* SYSTEM DANGER WARNING BANNER */}
      <div className="p-5 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/5 to-transparent flex flex-col md:flex-row items-start gap-4">
        <div className="p-3 bg-red-500/10 rounded-xl text-red-400 shrink-0">
          <ShieldAlert size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-400 tracking-tight">System Owner Cleansing Protocol</h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl">
            Cleansing operations are non-reversible administrative actions. If executed, the selected live telemetry database records, access logs, and performance metrics will be permanently erased. Configuration and Identity variables (<span className="text-zinc-200 font-bold font-mono">admin_profiles</span>) remain strongly locked to preserve system accessibility.
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-[#111315]/80 border border-[#1F2225] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Storage Load</span>
            <Activity size={14} className="text-[#FF4A6B]" />
          </div>
          <div>
            <div className="text-2xl font-black text-white leading-none font-mono">
              {totalCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Total redundant records currently allocated across metadata tables.</p>
          </div>
        </div>

        <div className="bg-[#111315]/80 border border-[#1F2225] p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Critical Tables</span>
            <Shield size={14} className="text-[#26F0C4]" />
          </div>
          <div>
            <div className="text-2xl font-black text-white leading-none font-mono">
              11 <span className="text-xs text-zinc-400 font-normal">Active</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Telemetry tables monitored and cleared under SRE maintenance policies.</p>
          </div>
        </div>

        <div className="bg-[#111315]/80 border border-[#1F2225] p-5 rounded-2xl flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider font-semibold">Bulk Option</span>
            <Trash2 size={14} className="text-red-400 animate-pulse" />
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleClearAll}
              disabled={totalPurgeableCount === 0 || isLoading}
              className="w-full h-10 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
              Wipe Purgeable Data ({totalPurgeableCount.toLocaleString()})
            </button>
          </div>
        </div>

      </div>

      {/* METRIC TABLES DATABASE GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <Info size={13} /> Registered System Tables Inventory
        </h3>

        <div className="border border-[#1F2225]/60 rounded-2xl bg-[#111315]/50 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#111315]/90 border-b border-[#1F2225] select-none text-[#8B929A] font-mono text-[10px] uppercase font-bold">
                  <th className="p-4 pl-5">Database Table Name</th>
                  <th className="p-4">Purge Risk Level</th>
                  <th className="p-4">Summary Description</th>
                  <th className="p-4 text-center">Row Count</th>
                  <th className="p-4 pr-5 text-right">Cleansing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2225]/40 text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-zinc-500 font-mono">
                      <RefreshCw size={20} className="animate-spin text-[#FF4A6B] mx-auto mb-3" />
                      Resolving current database telemetry volume indicators...
                    </td>
                  </tr>
                ) : (
                  TABLE_CATALOG.map((meta) => {
                    const count = counts[meta.tableName] ?? 0;
                    return (
                      <tr key={meta.tableName} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 pl-5 font-mono font-bold text-[#D1D5DB] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4A6B]" />
                          {meta.tableName}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                            meta.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/15' :
                            meta.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/15' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                          }`}>
                            {meta.severity === 'high' ? 'Critical' : meta.severity === 'medium' ? 'Important' : 'Normal'}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400 max-w-sm truncate" title={meta.description}>
                          {meta.description}
                        </td>
                        <td className="p-4 font-mono font-bold text-center text-zinc-100">
                          {count.toLocaleString()}
                        </td>
                        <td className="p-4 pr-5 text-right">
                          {meta.isProtected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-[#26F0C4] bg-[#26F0C4]/10 border border-[#26F0C4]/15 px-2.5 py-1.5 rounded-lg select-none">
                              <Lock size={10} /> Immutable
                            </span>
                          ) : (
                            <button
                              onClick={() => handleClearTable(meta.tableName)}
                              disabled={count === 0}
                              className="bg-red-500/10 hover:bg-red-500 border border-red-500/15 hover:border-transparent text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-black tracking-tight font-mono cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Purge Records
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PROTECTED SYSTEM TABLES COLLAPSIBLE INFO */}
      <div className="bg-[#111315]/30 border border-[#1F2225] p-5 rounded-2xl space-y-3.5">
        <h4 className="text-xs font-black tracking-wider text-zinc-400 flex items-center gap-2 uppercase font-mono">
          <Lock size={13} className="text-[#26F0C4]" /> Lockout Protections Active
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The following relational databases mapping personnel data, invitations metrics, security roles, and profiles boundaries strictly block deletion payloads. This maintains system stability and resolves accidental locking out of owner operators:
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <span className="px-3 py-1.5 bg-[#0F1113] border border-[#1F2225] rounded-xl text-[10px] font-mono text-[#26F0C4] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4]" /> admin_profiles
          </span>
          <span className="px-3 py-1.5 bg-[#0F1113] border border-[#1F2225] rounded-xl text-[10px] font-mono text-[#26F0C4] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4]" /> admin_invitations
          </span>
          <span className="px-3 py-1.5 bg-[#0F1113] border border-[#1F2225] rounded-xl text-[10px] font-mono text-[#26F0C4] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4]" /> admin_access_renewals
          </span>
          <span className="px-3 py-1.5 bg-[#0F1113] border border-[#1F2225] rounded-xl text-[10px] font-mono text-[#26F0C4] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4]" /> admin_audit_logs (Immutable logs)
          </span>
        </div>
      </div>

      {/* ACCIDENTAL DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {activeTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTarget(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#111315]/98 border border-[#1F2225] rounded-2xl p-6 shadow-2xl z-20 space-y-5 text-left"
            >
              <div className="flex items-start gap-3.5 pr-2">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl shrink-0 mt-0.5">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    {activeTarget === 'table' ? `Purge table "${selectedTableName}"?` : "Confirm global database wipe?"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 lines-relaxed">
                    This will permanently clear all tuples in the specified target table. The action cannot be undone on the remote instance.
                  </p>
                </div>
              </div>

              {/* DANGER DETAIL SHEET */}
              <div className="p-4 bg-[#0F1113] border border-[#1F2225] rounded-xl space-y-1.5 font-mono text-[10px] uppercase">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Operation:</span>
                  <span className="text-red-400 font-bold">TRUNCATE / DELETE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Range:</span>
                  <span className="text-zinc-200 font-bold">
                    {activeTarget === 'table' ? `Table: "${selectedTableName}"` : "Global Telemetry System (Purgeable Tables)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Row Count Impact:</span>
                  <span className="text-zinc-200 font-bold">
                    {activeTarget === 'table' 
                      ? (counts[selectedTableName!] ?? 0).toLocaleString() 
                      : totalPurgeableCount.toLocaleString()} Rows
                  </span>
                </div>
              </div>

              {/* SAFETY GATES */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold font-mono tracking-wide text-zinc-400 uppercase">
                  To proceed, type <span className="text-red-400 font-bold">CONFIRM</span> below:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Type CONFIRM to authorize"
                  className="w-full h-11 bg-[#0F1113] border border-[#1F2225] focus:border-red-500/60 rounded-xl px-4 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                  disabled={isSubmitting}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTarget(null)}
                  className="flex-1 h-11 bg-[#141719] hover:bg-[#1E2226] border border-[#1F2225] text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={executePurge}
                  disabled={confirmationInput.toUpperCase() !== 'CONFIRM' || isSubmitting}
                  className="flex-1 h-11 bg-red-500 hover:bg-red-600 disabled:opacity-40 font-bold text-xs text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Wiping records...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      Wipe Data Now
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
