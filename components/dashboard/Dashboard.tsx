/**
 * File: /components/dashboard/Dashboard.tsx
 * Purpose: Enterprise-grade SRE portfolio telemetry administrative control hub.
 * Reorganized as a modular, tab-based layout with logical groupings and advanced responsive menus.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Home, BarChart2, LogOut, ArrowUpRight, Search, Activity, 
  RefreshCw, Shield, LayoutGrid, Sparkles, Database, User,
  Users, Zap, ChevronDown, Calendar, X, Menu, FileText, UserCheck, Trash,
  Bot
} from 'lucide-react';

import { Project } from '../../types';
import { getContent } from '../../lib/contentService';
import { AnalyticsTracker } from '../../lib/analyticsTracker';
import CommandPalette, { Command } from './CommandPalette';
import { supabase } from '../../lib/supabase';
import { UserManagement } from './UserManagement';
import { AuditLogs } from './AuditLogs';
import { DatabaseMaintenance } from './DatabaseMaintenance';
import { CvManagementTab } from './CvManagementTab';

// Brand New Modular Tab Components
import { OverviewTab } from './OverviewTab';
import { AudienceTab } from './AudienceTab';
import { PerformanceTab } from './PerformanceTab';
import { SecurityTab } from './SecurityTab';
import { AiAnalyticsTab } from './AiAnalyticsTab';
import { TelemetryData } from './types';

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const projectData = getContent<Project[]>('projects', 'en') || [];

  const [isLoading, setIsLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [footprintHash, setFootprintHash] = useState<string>('');
  
  // Dashboard overall custom time period
  const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null, label: string }>({ start: null, end: null, label: 'Last 30 Days' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'performance' | 'security' | 'ai-analytics' | 'users' | 'audit-logs' | 'db-maintenance' | 'cv-management'>('overview');

  // Session Security, Inactivity & Lifecycle Management
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [sessionForceExpiryDemo, setSessionForceExpiryDemo] = useState(false);

  // Inactivity tracking states (15 minutes limit, 30 seconds warning)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(30);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningActiveRef = useRef<boolean>(false);

  // 1. Inactivity tracking event listeners on window
  useEffect(() => {
    const handleActivity = () => {
      // If warning modal is actively showing, user must click the explicit 'Extend' button
      if (isWarningActiveRef.current) return;
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, []);

  // 2. High precision checking interval for inactivity and session expiration
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkTimers = async () => {
      try {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;

        const totalInactivityLimit = 15 * 60 * 1000; // 15 minutes
        const warningThreshold = 30 * 1000; // 30 seconds warning

        // A. Inactivity Check
        if (elapsed >= totalInactivityLimit) {
          clearInterval(intervalId);
          onLogout();
          return;
        } else if (elapsed >= totalInactivityLimit - warningThreshold) {
          isWarningActiveRef.current = true;
          setShowInactivityWarning(true);
          const remainingSec = Math.max(0, Math.ceil((totalInactivityLimit - elapsed) / 1000));
          setInactivityCountdown(remainingSec);
        } else {
          isWarningActiveRef.current = false;
          setShowInactivityWarning(false);
        }

        // B. Absolute Session Expiration Check
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          onLogout();
          return;
        }

        const expiresAtSec = session.expires_at;
        const nowSec = Math.floor(now / 1000);
        let diff = expiresAtSec - nowSec;

        if (sessionForceExpiryDemo) {
          diff = Math.min(diff, 60);
        }

        setSecondsRemaining(diff);

        if (diff <= 60 && diff > 0) {
          setShowSessionWarning(true);
        } else if (diff <= 0) {
          setShowSessionWarning(false);
          onLogout();
        } else {
          setShowSessionWarning(false);
        }
      } catch (err) {
        console.error('Security & Inactivity heartbeat error:', err);
      }
    };

    // Run first check immediately
    checkTimers();

    // Check every 1 second for seamless countdown updates
    intervalId = setInterval(checkTimers, 1000);

    return () => clearInterval(intervalId);
  }, [onLogout, sessionForceExpiryDemo]);

  // Action: Reset inactivity timer & refresh backend security session token
  const handleExtendInactivitySession = async () => {
    setIsExtending(true);
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;

      // Reset markers
      lastActivityRef.current = Date.now();
      isWarningActiveRef.current = false;
      setShowInactivityWarning(false);
    } catch (err) {
      console.error('Failed to extend inactive session:', err);
    } finally {
      setIsExtending(false);
    }
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setSessionForceExpiryDemo(false);
      setShowSessionWarning(false);
      
      const expiresAtSec = data.session?.expires_at || Math.floor(Date.now() / 1000) + 3600;
      setSecondsRemaining(expiresAtSec - Math.floor(Date.now() / 1000));
    } catch (err) {
      console.error('Failed to extend session:', err);
    } finally {
      setIsExtending(false);
    }
  };

  useEffect(() => {
    let active = true;
    const findMe = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        if (!token) {
          onLogout();
          return;
        }

        const res = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            if (data.success && data.profile) {
              setCurrentUserProfile({ 
                ...data.profile, 
                avatar_url: session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture 
              });
            } else {
              onLogout();
            }
          }
        } else {
          if (active) onLogout();
        }
      } catch (err) {
        console.error('Error validating profile:', err);
        if (active) onLogout();
      }
    };
    findMe();
    return () => {
      active = false;
    };
  }, [onLogout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (isDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  // Fetch telemetry packet
  const fetchTelemetry = useCallback(async (isSilent: boolean = false, range = dateRange) => {
    if (!isSilent) setIsLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) {
        console.warn("Telemetry query prevented: Unresolved active context");
        return;
      }

      let url = `/api/admin/dashboard?mode=real`;
      if (range.start) url += `&startDate=${encodeURIComponent(range.start)}`;
      if (range.end) url += `&endDate=${encodeURIComponent(range.end)}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      } else {
        console.error('Failed to resolve active metrics pipeline');
      }
    } catch (err) {
      console.error('Error fetching dashboard aggregation:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    let active = true;

    // Resolve anonymous fingerprint
    AnalyticsTracker.getAnonymousFootprintHash().then(hash => {
      if (active) setFootprintHash(hash);
    });

    fetchTelemetry(false, dateRange).then(() => {
      if (active) setIsLoading(false);
    });

    // Sub-10s live database sync
    const interval = setInterval(() => {
      if (active) fetchTelemetry(true, dateRange);
    }, 6000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchTelemetry, dateRange]);

  const handleRefresh = async () => {
    await fetchTelemetry(false, dateRange);
  };

  const commands: Command[] = useMemo(() => [
    { id: 'logout', type: 'action', title: 'Logout / Clear Console Session', icon: <LogOut size={16}/>, action: onLogout },
    { id: 'trigger-diagnostics', type: 'action', title: 'Force Telemetry Diagnostic Recalibration', icon: <RefreshCw size={16}/>, action: handleRefresh },
    { id: 'tab-ai', type: 'action', title: 'Navigate to AI Analytics & Cost Usage', icon: <Bot size={16}/>, action: () => setActiveTab('ai-analytics') },
    ...projectData.map((p): Command => ({
        id: `project-${p.id}`, type: 'project', title: `Dossier: ${p.title}`, icon: <ArrowUpRight size={16}/>, action: () => setSelectedProject(p)
    }))
  ], [projectData, onLogout]);

  // Command palette listener (Ctrl+K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#0A0C0E] text-[#E5E7EB] font-sans antialiased relative overflow-hidden pb-0">
      {/* Background radial overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vh] bg-emerald-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* 1. ADAPTIVE SIDEBAR (FOR DESKTOP & WIDE SCREENS) */}
      <div className="hidden md:block relative w-[72px] m-4 flex-shrink-0 z-[100]">
        <aside className="absolute top-0 left-0 h-[calc(100vh-32px)] w-[72px] hover:w-[220px] group transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col py-6 rounded-2xl bg-[#1C1E23]/95 backdrop-blur-2xl border border-white/[0.05] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          
          {/* User Profile Section */}
          <div className="flex items-center px-[14px] w-full mb-8 mt-2 relative">
            <div className="relative w-[44px] h-[44px] rounded-full shrink-0 flex items-center justify-center bg-white/5 border border-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
              {currentUserProfile?.email ? (
                <img 
                  src={currentUserProfile?.avatar_url || (currentUserProfile.email === 'angesh021@gmail.com' ? 'https://unavatar.io/github/angesh021' : `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUserProfile.email}`)}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-zinc-400" />
              )}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-md -z-10 group-hover:bg-white/20 transition-all pointer-events-none" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-[#1C1E23] rounded-full" />
            </div>
            
            <div className="flex flex-col ml-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
               <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">{currentUserProfile?.role === 'owner' ? 'Owner 👑' : 'Good Day 👋'}</span>
               <span className="text-[12px] leading-tight font-semibold text-zinc-100 w-[130px] whitespace-nowrap overflow-hidden text-ellipsis">
                 {currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : 'Admin'}
               </span>
            </div>
          </div>

          {/* Navigation Group: Telemetry Sections */}
          <div className="flex flex-col w-full gap-5">
            
            <div>
              <span className="px-[22px] text-[9px] font-bold tracking-wider uppercase text-zinc-500 mb-2.5 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Telemetry
              </span>
              <div className="flex flex-col w-full gap-1.5 relative px-[14px]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                    activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-[20px]">
                    <LayoutGrid size={18} className={activeTab === 'overview' ? 'text-[#26F0C4]' : ''} />
                  </div>
                  <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                    Overview
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('audience')}
                  className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                    activeTab === 'audience' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-[20px]">
                    <Users size={18} className={activeTab === 'audience' ? 'text-[#26F0C4]' : ''} />
                  </div>
                  <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                    Audience
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('performance')}
                  className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                    activeTab === 'performance' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-[20px]">
                    <Zap size={18} className={activeTab === 'performance' ? 'text-[#26F0C4]' : ''} />
                  </div>
                  <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                    Performance
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                    activeTab === 'security' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-[20px]">
                    <Shield size={18} className={activeTab === 'security' ? 'text-[#26F0C4]' : ''} />
                  </div>
                  <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                    SecOps & Logs
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('ai-analytics')}
                  className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                    activeTab === 'ai-analytics' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <div className="shrink-0 flex items-center justify-center w-[20px]">
                    <Bot size={18} className={activeTab === 'ai-analytics' ? 'text-[#26F0C4]' : ''} />
                  </div>
                  <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left whitespace-nowrap">
                    AI Analytics & Costs
                  </span>
                </button>
              </div>
            </div>

            {(currentUserProfile?.role === 'owner' || currentUserProfile?.role === 'admin') && (
              <div>
                <span className="px-[22px] text-[9px] font-bold tracking-wider uppercase text-zinc-500 mb-2.5 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Console Operations
                </span>
                <div className="flex flex-col w-full gap-1.5 relative px-[14px]">
                  {currentUserProfile?.role === 'owner' && currentUserProfile?.email?.toLowerCase() === 'angesh021@gmail.com' && (
                    <button
                      onClick={() => setActiveTab('cv-management')}
                      className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                        activeTab === 'cv-management' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                      title="CV Repository"
                    >
                      <div className="shrink-0 flex items-center justify-center w-[20px]">
                        <FileText size={18} className={activeTab === 'cv-management' ? 'text-[#26F0C4]' : ''} />
                      </div>
                      <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                        CV Repository
                      </span>
                    </button>
                  )}

                  {currentUserProfile?.role === 'owner' && (
                    <>
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                          activeTab === 'users' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center w-[20px]">
                          <UserCheck size={18} className={activeTab === 'users' ? 'text-[#26F0C4]' : ''} />
                        </div>
                        <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                          Personnel
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('audit-logs')}
                        className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                          activeTab === 'audit-logs' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center w-[20px]">
                          <FileText size={18} className={activeTab === 'audit-logs' ? 'text-[#26F0C4]' : ''} />
                        </div>
                        <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                          Audit Trail
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('db-maintenance')}
                        className={`w-full min-h-[40px] py-1.5 rounded-xl flex items-center px-3 outline-none transition-all group/item overflow-hidden relative ${
                          activeTab === 'db-maintenance' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                      >
                        <div className="shrink-0 flex items-center justify-center w-[20px]">
                          <Database size={18} className={activeTab === 'db-maintenance' ? 'text-[#FF4A6B]' : ''} />
                        </div>
                        <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                          DB Cleansing
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom logout / utilities */}
          <div className="flex flex-col w-full gap-1.5 mt-auto relative px-[14px]">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full h-[40px] rounded-xl flex items-center px-3 outline-none text-zinc-400 hover:bg-white/5 hover:text-white"
              title="Ctrl + K Command Palette"
            >
              <div className="shrink-0 flex items-center justify-center w-[20px]">
                <Search size={18} />
              </div>
              <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                Command Palette
              </span>
            </button>

            <button
              onClick={onLogout}
              className="w-full h-[40px] rounded-xl flex items-center px-3 outline-none text-zinc-400 hover:bg-red-500/10 hover:text-red-400 animate-in fade-in"
              title="Logout"
            >
              <div className="shrink-0 flex items-center justify-center w-[20px]">
                <LogOut size={18} />
              </div>
              <span className="ml-[18px] text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-50 text-left">
                Logout
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* 2. RESPONSIVE HEADER FOR PHONES AND MOBILE TABLETS */}
      <div className="md:hidden w-full bg-[#111315]/90 border-b border-[#1F2225] p-4 flex items-center justify-between z-50 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Activity size={18} className="text-[#26F0C4]" />
          <span className="text-xs font-black tracking-tight uppercase text-zinc-200">
            {activeTab.toUpperCase()} PANEL
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="p-2 bg-[#1C1E23] hover:bg-white/5 rounded-xl border border-white/5 text-zinc-400 hover:text-[#26F0C4]"
          >
            <Search size={16} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-[#1B2D29] hover:bg-[#25453E] rounded-xl border border-[#26F0C4]/20 text-[#26F0C4] flex items-center justify-center"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Mobile drawer options overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[101] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-[280px] h-full bg-[#111315] border-l border-[#1F2225] p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F2225]/40 pb-3">
                <span className="text-xs font-black text-[#8B929A] uppercase tracking-wider">Metrics Selection</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Mobile categories List */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8B929A] block mb-2 tracking-wide">Telemetry pages</span>
                  <div className="space-y-1.5">
                    {[
                      { id: 'overview', label: 'Executive Overview', icon: <LayoutGrid size={15} /> },
                      { id: 'audience', label: 'Audience & Converts', icon: <Users size={15} /> },
                      { id: 'performance', label: 'Network & Speed', icon: <Zap size={15} /> },
                      { id: 'security', label: 'SecOps & Firewalls', icon: <Shield size={15} /> },
                      { id: 'ai-analytics', label: 'AI Analytics & Costs', icon: <Bot size={15} /> }
                    ].map(menuItem => (
                      <button
                        key={menuItem.id}
                        onClick={() => {
                          setActiveTab(menuItem.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                          activeTab === menuItem.id ? 'bg-[#26F0C4]/10 text-[#26F0C4] font-black' : 'text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        {menuItem.icon}
                        {menuItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(currentUserProfile?.role === 'owner' || currentUserProfile?.role === 'admin') && (
                  <div className="border-t border-[#1F2225]/45 pt-3">
                    <span className="text-[10px] uppercase font-bold text-[#8B929A] block mb-2 tracking-wide">Console Operations</span>
                    <div className="space-y-1.5">
                      {currentUserProfile?.role === 'owner' && currentUserProfile?.email?.toLowerCase() === 'angesh021@gmail.com' && (
                        <button
                          onClick={() => {
                            setActiveTab('cv-management');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                            activeTab === 'cv-management' ? 'bg-[#26F0C4]/10 text-[#26F0C4] font-black' : 'text-zinc-400 hover:bg-white/5'
                          }`}
                        >
                          <FileText size={15} className={activeTab === 'cv-management' ? 'text-[#26F0C4]' : ''} />
                          CV Repository
                        </button>
                      )}

                      {currentUserProfile?.role === 'owner' && (
                        <>
                          {[
                            { id: 'users', label: 'Personnel Access', icon: <UserCheck size={15} /> },
                            { id: 'audit-logs', label: 'System Audit Trail', icon: <FileText size={15} /> },
                            { id: 'db-maintenance', label: 'Database Cleansing', icon: <Database size={15} className={activeTab === 'db-maintenance' ? 'text-[#FF4A6B]' : ''} /> }
                          ].map(menuItem => (
                            <button
                              key={menuItem.id}
                              onClick={() => {
                                setActiveTab(menuItem.id as any);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                                activeTab === menuItem.id ? 'bg-[#26F0C4]/10 text-[#26F0C4] font-black' : 'text-zinc-400 hover:bg-white/5'
                              }`}
                            >
                              {menuItem.icon}
                              {menuItem.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#1F2225] pt-4 mt-4 space-y-2">
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5"
              >
                <Search size={15} />
                Command Palette
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={15} />
                Exit Console Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-grow flex-1 min-h-0 overflow-y-auto scroll-smooth w-full flex flex-col pt-0 pb-10 overflow-x-hidden">
        
        {/* TELEMETRY BODY CONSOLE */}
        <main className="flex-grow px-4 md:px-10 pt-6 md:pt-10 pb-20 z-10 max-w-7xl mx-auto w-full">
          
          {activeTab === 'users' ? (
            <UserManagement />
          ) : activeTab === 'audit-logs' ? (
            <AuditLogs />
          ) : activeTab === 'db-maintenance' ? (
            <DatabaseMaintenance />
          ) : activeTab === 'cv-management' && currentUserProfile?.role === 'owner' && currentUserProfile?.email?.toLowerCase() === 'angesh021@gmail.com' ? (
            <CvManagementTab />
          ) : (
            <>
              {/* BRAND NEW ADAPTIVE LAYOUT TITLE BANNER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 mb-6 border-b border-[#1F2225]/60">
                <div className="text-left flex items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-gradient-to-br from-[#141719] to-[#0A0C0E] border border-[#1F2225] items-center justify-center shadow-lg">
                    <Activity className="text-[#26F0C4]" size={20} />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#E5E7EB] mb-2 font-sans">
                      SRE Control Console
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#8B929A]">
                      <span className="flex items-center gap-1.5 bg-[#141719] border border-[#1F2225] py-1 px-2.5 rounded-md text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4] animate-pulse"></span>
                        EDGE-SEC-1A
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#141719] border border-[#1F2225] py-1 px-2.5 rounded-md text-blue-400">
                        {footprintHash ? footprintHash.substring(0, 10) : 'DETERMINISTIC'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Datepicker and refresh controls */}
                <div className="flex items-center gap-3 self-start md:self-end">
                  <div className="relative" ref={datePickerRef}>
                    <button 
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="h-9 px-3.5 bg-[#141719] border border-[#1F2225] hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 outline-none cursor-pointer select-none"
                    >
                      <Calendar size={13} className="text-[#26F0C4]" />
                      <span>{dateRange.label}</span>
                      <ChevronDown size={11} className={`transition-transform duration-200 text-zinc-500 ${isDatePickerOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    {isDatePickerOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-[#111315]/98 backdrop-blur-xl border border-[#1F2225] rounded-xl shadow-2xl p-2 z-50 text-left text-xs font-mono">
                        <span className="block text-[9px] font-bold text-[#8B929A] px-2.5 py-1 uppercase tracking-wider border-b border-[#1F2225]/40 mb-1.5">Select Period</span>
                        {([
                          { label: 'Last 24 Hours', start: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), end: null },
                          { label: 'Last 3 Days', start: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), end: null },
                          { label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), end: null },
                          { label: 'Last 30 Days', start: null, end: null },
                          { label: 'Custom Range', start: 'custom', end: null }
                        ]).map((item, i) => (
                          <div key={i}>
                            <button
                              onClick={() => {
                                if (item.label === 'Custom Range') {
                                  setDateRange({ ...dateRange, label: 'Custom Range' });
                                } else {
                                  setDateRange({ start: item.start, end: item.end, label: item.label });
                                  setIsDatePickerOpen(false);
                                }
                              }}
                              className={`w-full h-8 px-2.5 rounded-lg text-left transition-colors font-medium border-none cursor-pointer flex items-center justify-between ${
                                dateRange.label === item.label 
                                  ? 'bg-[#26F0C4]/10 text-[#26F0C4]' 
                                  : 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span>{item.label}</span>
                              {dateRange.label === item.label && <span className="w-1.5 h-1.5 bg-[#26F0C4] rounded-full" />}
                            </button>
                            {item.label === 'Custom Range' && dateRange.label === 'Custom Range' && (
                              <div className="p-2 mt-1 border-t border-[#1F2225]/40 flex flex-col gap-2">
                                <div>
                                  <label className="text-[10px] text-[#8B929A] mb-1 block">Start Date</label>
                                  <input 
                                    type="date" 
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full bg-[#0A0C0E] border border-[#2B3035] rounded p-1 text-[#E5E7EB] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-[#8B929A] mb-1 block">End Date</label>
                                  <input 
                                    type="date" 
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full bg-[#0A0C0E] border border-[#2B3035] rounded p-1 text-[#E5E7EB] outline-none"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    if (customStart && customEnd) {
                                      setDateRange({
                                        start: new Date(customStart).toISOString(),
                                        end: new Date(customEnd).toISOString(),
                                        label: `Custom: ${customStart} - ${customEnd}`
                                      });
                                      setIsDatePickerOpen(false);
                                    }
                                  }}
                                  disabled={!customStart || !customEnd}
                                  className="w-full mt-1 bg-[#26F0C4]/20 hover:bg-[#26F0C4]/30 disabled:opacity-50 text-[#26F0C4] py-1 rounded transition-colors"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Session Expiry Status & Demo Simulation Trigger */}
                  <div className="relative group/ttl flex items-center gap-2">
                    {/* Inactivity Simulation Trigger */}
                    <button
                      onClick={() => {
                        // Set last activity timestamp to 14 minutes and 32 seconds ago, triggering a 28s remaining countdown instantly!
                        lastActivityRef.current = Date.now() - (14 * 60 * 1000 + 32 * 1000);
                      }}
                      className="h-9 px-3 bg-[#1F2225] hover:bg-[#2B3035] text-[#8B929A] hover:text-[#26F0C4] border border-[#2B3035]/60 rounded-xl flex items-center gap-1.5 transition-colors outline-none cursor-pointer text-xs font-mono"
                      title="Simulate 15-minute inactivity timeout (30s warning popup) instantly"
                    >
                      <Zap size={12} className="text-[#26F0C4]" />
                      <span>Demo 15m Idle</span>
                    </button>

                    {/* JWT Expiration Status */}
                    <button
                      onClick={() => setSessionForceExpiryDemo(true)}
                      className="h-9 px-3 bg-[#1F2225] hover:bg-[#2B3035] text-[#8B929A] hover:text-[#26F0C4] border border-[#2B3035]/60 rounded-xl flex items-center gap-1.5 transition-colors outline-none cursor-pointer text-xs font-mono"
                      title="Click to force a 60-second Session Expiration Alert for demonstration"
                    >
                      <Shield size={12} className={showSessionWarning || showInactivityWarning ? "text-amber-500 animate-pulse" : "text-[#26F0C4]"} />
                      <span>
                        {secondsRemaining !== null 
                          ? `${Math.floor(secondsRemaining / 60)}m ${secondsRemaining % 60}s` 
                          : "TTL Loading..."
                        }
                      </span>
                    </button>
                    {/* Hover Tooltip */}
                    <div className="absolute right-0 bottom-[-42px] hidden group-hover/ttl:block bg-[#141719] border border-[#1F2225] text-[10px] text-zinc-300 px-2 py-1.5 rounded-lg font-sans shadow-lg whitespace-nowrap z-50 pointer-events-none">
                      Session TTL status & Inactivity simulation controls.
                    </div>
                  </div>

                  <button 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-9 w-9 bg-[#26F0C4]/10 hover:bg-[#26F0C4]/15 text-[#26F0C4] border border-[#26F0C4]/20 hover:border-[#26F0C4]/30 rounded-xl flex items-center justify-center transition-colors outline-none cursor-pointer disabled:opacity-50"
                    title="Recalibrate Live Telemetry Feed"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* 4. MODULAR PAGES ROUTING ENGINE */}
              {isLoading && !telemetry ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3.5">
                  <RefreshCw size={24} className="text-[#26F0C4] animate-spin" />
                  <p className="text-xs font-mono text-[#8B929A] uppercase tracking-wider animate-pulse">Synchronizing Pipeline Metrics...</p>
                </div>
              ) : telemetry ? (
                <div className="transition-opacity duration-300">
                  {activeTab === 'overview' && <OverviewTab telemetry={telemetry} />}
                  {activeTab === 'audience' && <AudienceTab telemetry={telemetry} />}
                  {activeTab === 'performance' && <PerformanceTab telemetry={telemetry} />}
                  {activeTab === 'security' && <SecurityTab telemetry={telemetry} />}
                  {activeTab === 'ai-analytics' && <AiAnalyticsTab telemetry={telemetry} />}
                </div>
              ) : (
                <div className="py-24 text-center text-xs font-mono text-[#8B929A] border border-red-500/10 bg-red-500/5 rounded-2xl">
                  AN UNEXPECTED ANOMALY BLOCKED TELEMETRY INTEGRITY AGGREGATIONS
                </div>
              )}
            </>
          )}

        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        commands={commands} 
      />

      {/* Subtle, non-intrusive warning modal */}
      {showSessionWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141719] border border-amber-500/20 max-w-md w-full rounded-2xl p-6 text-left shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
            {/* Visual glow at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[4px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="flex items-start gap-4 mb-5">
              <div className="shrink-0 p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 animate-pulse">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-serif">Session Security Timeout</h3>
                <p className="text-xs text-[#8B929A] mt-1">Your authorized portfolio console session will expire shortly due to inactive JWT token expiration.</p>
              </div>
            </div>

            {/* Countdown Display & Decay Bar */}
            <div className="bg-[#0A0C0E] border border-[#1F2225] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#8B929A] uppercase tracking-wider">Estimated TTL Remaining</span>
                <span className="text-xs font-mono font-bold text-amber-400">{secondsRemaining ?? 0}s</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#1F2225] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, ((secondsRemaining ?? 60) / 60) * 100))}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-[#8B929A] leading-relaxed mb-6 font-mono">
              Action Required: Extending updates server-side session cookies, validating personnel credentials, and sustaining live web socket tunnels.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onLogout}
                className="h-10 px-4 rounded-xl font-bold text-xs bg-[#1F2225] text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#2B3035]/60 hover:border-red-900/30 transition-all cursor-pointer"
              >
                Secure Logout
              </button>
              <button
                disabled={isExtending}
                onClick={handleExtendSession}
                className="h-10 px-5 rounded-xl font-bold text-xs bg-[#26F0C4] text-[#0A0C0E] hover:bg-[#1FD9B1] shadow-[0_0_20px_rgba(38,240,196,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExtending ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Renewing...
                  </>
                ) : (
                  "Extend Session"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inactivity Security Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141719] border border-amber-500/20 max-w-md w-full rounded-2xl p-6 text-left shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
            {/* Visual glow at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[4px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div className="flex items-start gap-4 mb-5">
              <div className="shrink-0 p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 animate-pulse">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-serif">Inactivity Security Alert</h3>
                <p className="text-xs text-[#8B929A] mt-1">You have been inactive for over 14 minutes. For security protection, you will be logged out shortly.</p>
              </div>
            </div>

            {/* Countdown Display & Decay Bar */}
            <div className="bg-[#0A0C0E] border border-[#1F2225] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#8B929A] uppercase tracking-wider">Estimated Idle Time Expiration</span>
                <span className="text-xs font-mono font-bold text-amber-400">{inactivityCountdown}s remaining</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#1F2225] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(inactivityCountdown / 30) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-[#8B929A] leading-relaxed mb-6 font-mono">
              To keep your session secure and active, click the "Extend Session" button below. Otherwise, secure logout will occur automatically.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onLogout}
                className="h-10 px-4 rounded-xl font-bold text-xs bg-[#1F2225] text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#2B3035]/60 hover:border-red-900/30 transition-all cursor-pointer"
              >
                Secure Logout
              </button>
              <button
                disabled={isExtending}
                onClick={handleExtendInactivitySession}
                className="h-10 px-5 rounded-xl font-bold text-xs bg-[#26F0C4] text-[#0A0C0E] hover:bg-[#1FD9B1] shadow-[0_0_20px_rgba(38,240,196,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExtending ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Extending...
                  </>
                ) : (
                  "Extend Session"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
