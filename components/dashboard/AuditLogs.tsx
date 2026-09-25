/**
 * File: /components/dashboard/AuditLogs.tsx
 * Purpose: Secure admin audit logging viewport.
 * Provides owners with an immutable, searchable history of administrative, login, and authorization events.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Search, RefreshCw, AlertCircle, Info, Terminal, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  severity: 'info' | 'warning' | 'critical';
  metadata: Record<string, any>;
  created_at: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('Unauthenticated user session');

      const res = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs);
      } else {
        throw new Error(data.error || 'Failed to retrieve immutable logging store');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' || 
        (log.actor_email && log.actor_email.toLowerCase().includes(query)) ||
        (log.target_email && log.target_email.toLowerCase().includes(query)) ||
        log.action.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query);

      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;

      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchQuery, selectedSeverity]);

  return (
    <div className="flex flex-col gap-6 text-left" id="audit-logs">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1F2225]/40 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#E5E7EB] flex items-center gap-2">
            <FileText size={20} className="text-[#26F0C4]" />
            Immutable Audit Trail Engine
          </h2>
          <p className="text-xs text-[#8B929A] mt-1 font-sans">
            Cryptographically tracked telemetry log capturing logins, authorization failures, and privilege alterations in real-time.
          </p>
        </div>
        
        <button 
          onClick={fetchLogs}
          className="h-[38px] px-3.5 rounded-lg bg-[#141719] border border-[#1F2225] hover:border-[#8B929A]/50 text-xs text-[#E5E7EB] flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Sync Event Feed</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-300">{errorMsg}</div>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between bg-[#111315] p-4 rounded-xl border border-[#1F2225] w-full">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by action, actor, or target..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 p-2.5 pl-9 rounded-xl text-xs font-mono text-[#E5E7EB] outline-none transition-all"
          />
          <Search size={14} className="absolute left-3 top-3.5 text-[#8B929A]" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <span className="text-[10px] uppercase font-mono text-[#8B929A] whitespace-nowrap">Filter Severity</span>
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-40 bg-[#0A0C0E] border border-[#1F2225] focus:border-[#26F0C4]/40 p-2 rounded-lg text-xs font-mono text-[#E5E7EB] outline-none cursor-pointer"
          >
            <option value="all">All Events (Verbose)</option>
            <option value="info">Info</option>
            <option value="warning">Warning (Fault Warning)</option>
            <option value="critical">Critical (Privilege Change)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* EVENT TRAIL LOGGER */}
        <div className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="text-sm font-bold text-[#E5E7EB] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Terminal size={16} className="text-[#26F0C4]" />
            Syslog Terminal Stream
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-[#1F2225] text-[#8B929A] font-mono text-[10px] uppercase tracking-wider pb-3">
                  <th className="pb-3 pl-2">Created At</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Security Action</th>
                  <th className="pb-3">Actor Identity</th>
                  <th className="pb-3 text-right pr-2">Sys Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2225]/40 text-xs font-mono">
                {filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((log) => (
                  <tr key={log.id} className="hover:bg-[#1C2023]/20 transition-all">
                    <td className="py-4 pl-2 h-14">
                      <div className="flex items-center gap-1 text-[#8B929A]">
                        <Clock size={11} />
                        <span className="text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {log.severity === 'critical' ? (
                        <span className="text-[9px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                          CRITICAL
                        </span>
                      ) : log.severity === 'warning' ? (
                        <span className="text-[9px] font-extrabold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md">
                          WARNING
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          VERBOSE
                        </span>
                      )}
                    </td>
                    <td className="py-4 font-bold text-[#E5E7EB]">
                      {log.action}
                    </td>
                    <td className="py-4 select-all">
                      <div className="flex flex-col">
                        <span className="text-xs">{log.actor_email || 'System Context'}</span>
                        {log.target_email && (
                          <span className="text-[9px] text-[#26F0C4]">➔ {log.target_email}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="p-1 px-2.5 rounded-md bg-[#1F2225]/50 border border-[#2B3035]/50 hover:bg-[#26F0C4]/15 hover:text-[#26F0C4] hover:border-[#26F0C4]/40 text-[#8B929A] font-mono text-[10px] transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-[#8B929A]">
                      Polling security registers...
                    </td>
                  </tr>
                )}
                {!isLoading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-[#8B929A]">
                      No audit events caught in selected filter boundaries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-[#0A0C0E]/50 rounded-xl border border-[#1F2225]/45">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <span className="text-[11px] text-[#8B929A] font-mono">Show:</span>
                <select 
                  className="bg-[#141719] border border-[#2B3035] text-[#E5E7EB] text-xs font-mono rounded px-2 py-1 outline-none focus:border-[#26F0C4]/50 cursor-pointer"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
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
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs font-mono text-[#E5E7EB]">
                  Page {currentPage} of {Math.ceil(filteredLogs.length / itemsPerPage) || 1}
                </span>
                <button 
                  disabled={currentPage === (Math.ceil(filteredLogs.length / itemsPerPage) || 1)}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLogs.length / itemsPerPage) || 1, p + 1))}
                  className="text-xs font-mono px-3 py-1.5 rounded bg-[#141719] border border-[#2B3035] text-[#8B929A] hover:text-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* METADATA DIAGNOSTIC CARD */}
        <div className="bg-[#111315] border border-[#1F2225] rounded-2xl p-6 h-fit sticky top-6">
          <h3 className="text-sm font-bold text-[#E5E7EB] mb-4 flex items-center gap-2 font-mono uppercase tracking-wider border-b border-[#1F2225] pb-3.5">
            <Info size={16} className="text-[#26F0C4]" />
            Diagnostic Packet
          </h3>

          <AnimatePresence mode="wait">
            {inspectedLog ? (
              <motion.div
                key={inspectedLog.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-4 font-mono text-xs text-[#8B929A]"
              >
                <div>
                  <span className="text-[10px] uppercase text-[#555] block mb-0.5">Payload ID</span>
                  <span className="text-[#E5E7EB] break-all text-[11px] select-all bg-[#0A0C0E] border border-[#1F2225] p-2 rounded-md block md:inline-block w-full">{inspectedLog.id}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#555] block mb-0.5">Timestamp Context</span>
                  <span className="text-[#E5E7EB] font-sans block">{new Date(inspectedLog.created_at).toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-[#555] block mb-0.5">Origin Actor ID</span>
                  <span className="text-[#E5E7EB] break-all select-all block">{inspectedLog.actor_user_id || 'SYSTEM_DAEMON'}</span>
                </div>

                {inspectedLog.target_user_id && (
                  <div>
                    <span className="text-[10px] uppercase text-[#555] block mb-0.5">target ID</span>
                    <span className="text-[#E5E7EB] break-all select-all block">{inspectedLog.target_user_id}</span>
                  </div>
                )}

                <div className="border-t border-[#1F2225]/50 pt-4 mt-1.5">
                  <span className="text-[10px] uppercase text-[#555] block mb-2">Metadrive Context Payload</span>
                  <pre className="p-3.5 bg-[#0A0C0E] border border-[#1F2225] rounded-xl text-[10.5px] leading-relaxed text-[#26F0C4] overflow-x-auto max-h-[220px] scrollbar-thin">
                    {JSON.stringify(inspectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8B929A] italic flex flex-col items-center gap-2.5">
                <Terminal size={24} className="opacity-25" />
                <span>Select a syslog event frame in the grid to telemetry decode high-entropy variables.</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
