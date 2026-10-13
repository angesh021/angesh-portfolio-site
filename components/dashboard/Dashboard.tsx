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
  Bot, Clock
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
import { AdminDropdown } from './AdminDropdown';

const Dashboard: React.FC<{ onLogout: (reason?: string) => void }> = ({ onLogout }) => {
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
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'performance' | 'security' | 'ai-analytics' | 'users' | 'audit-logs' | 'db-maintenance' | 'cv-management'>('overview');

  // Prevent mobile viewport shifting & ensure hamburger menu remains anchored at top
  useEffect(() => {
    window.scrollTo(0, 0);

    const lockWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('scroll', lockWindowScroll, { passive: true });
    window.addEventListener('resize', lockWindowScroll, { passive: true });
    window.addEventListener('orientationchange', lockWindowScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', lockWindowScroll);
      window.removeEventListener('resize', lockWindowScroll);
      window.removeEventListener('orientationchange', lockWindowScroll);
    };
  }, []);

  // Reset scroll to top of content area on tab switch
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // =========================================================================
  // Session Security & Inactivity Lifecycle Management
  // =========================================================================
  // Configurable timeout duration: 5m, 10m, 15m (default), 30m, 1h, 2h
  const [timeoutDurationMs, setTimeoutDurationMs] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('admin_timeout_setting_ms'));
      if ([300000, 600000, 900000, 1800000, 3600000, 7200000].includes(saved)) return saved;
    } catch (e) { /* ignore */ }
    return 15 * 60 * 1000; // 15 minutes default
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(timeoutDurationMs / 1000);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(60);
  const [isExtending, setIsExtending] = useState(false);
  const isWarningActiveRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastStorageWriteRef = useRef<number>(Date.now());

  const triggerLogout = useCallback((reason: string = 'inactivity') => {
    try {
      localStorage.removeItem('admin_last_activity');
    } catch (e) { /* ignore */ }
    onLogout(reason);
  }, [onLogout]);

  // Initialize or restore persistent activity timestamp on mount
  useEffect(() => {
    const now = Date.now();
    const stored = Number(localStorage.getItem('admin_last_activity'));
    if (!stored || isNaN(stored) || stored < 1000000000000) {
      localStorage.setItem('admin_last_activity', String(now));
      lastActivityRef.current = now;
      lastStorageWriteRef.current = now;
    } else {
      const elapsed = now - stored;
      // If already expired while away or tab was closed
      if (elapsed >= timeoutDurationMs) {
        triggerLogout('inactivity');
        return;
      }
      lastActivityRef.current = stored;
      lastStorageWriteRef.current = stored;
    }
  }, [triggerLogout, timeoutDurationMs]);

  // Record deliberate user activity across mouse, touch, keyboard, scroll, and viewport
  const recordActivity = useCallback(() => {
    const now = Date.now();

    // If warning alert was showing, ANY user interaction (typing, scrolling, mouse move, clicking)
    // demonstrates active presence — immediately dismiss the alert and reset full session TTL!
    if (isWarningActiveRef.current) {
      isWarningActiveRef.current = false;
      setShowInactivityWarning(false);
    }

    // Always update in-memory timestamp immediately (0ms latency, eliminates auto-lock when using)
    lastActivityRef.current = now;

    // Throttle writes to storage (max once every 2 seconds to preserve performance)
    if (now - lastStorageWriteRef.current > 2000) {
      lastStorageWriteRef.current = now;
      try {
        localStorage.setItem('admin_last_activity', String(now));
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Activity event listeners covering all real human interaction modes
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'pointermove',
      'pointerdown',
      'mousedown',
      'click',
      'keydown',
      'keyup',
      'touchstart',
      'touchmove',
      'touchend',
      'scroll',
      'wheel',
      'focus'
    ];

    const handleUserActivity = () => {
      recordActivity();
    };

    events.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true, capture: true });
      document.addEventListener(evt, handleUserActivity, { passive: true, capture: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const storedVal = Number(localStorage.getItem('admin_last_activity'));
        const validStored = (!storedVal || isNaN(storedVal) || storedVal < 1000000000000) ? 0 : storedVal;
        const mostRecent = Math.max(lastActivityRef.current, validStored);
        if (mostRecent > 0 && now - mostRecent >= timeoutDurationMs) {
          triggerLogout('inactivity');
        } else {
          // Returning to tab and within limit: record fresh activity
          recordActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      events.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity, { capture: true } as any);
        document.removeEventListener(evt, handleUserActivity, { capture: true } as any);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [recordActivity, triggerLogout, timeoutDurationMs]);

  // High precision checking interval every second
  useEffect(() => {
    const checkTimer = () => {
      const now = Date.now();
      const storedVal = Number(localStorage.getItem('admin_last_activity'));
      const validStored = (!storedVal || isNaN(storedVal) || storedVal < 1000000000000) ? 0 : storedVal;
      // The true last activity is whichever is newer between memory and localStorage
      const trueLastActivity = Math.max(lastActivityRef.current, validStored);
      const elapsed = now - trueLastActivity;
      const remainingMs = timeoutDurationMs - elapsed;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      // Check timeout expiration: ONLY when user has truly been completely inactive for the full duration
      if (elapsed >= timeoutDurationMs) {
        isWarningActiveRef.current = false;
        setShowInactivityWarning(false);
        triggerLogout('inactivity');
        return;
      }

      // Check warning threshold: only show modal when 60s or less remain
      const warningWindowMs = Math.min(60 * 1000, timeoutDurationMs * 0.2);
      if (remainingMs <= warningWindowMs && remainingMs > 0) {
        if (!isWarningActiveRef.current) {
          isWarningActiveRef.current = true;
          setShowInactivityWarning(true);
        }
        setInactivityCountdown(remainingSec);
      } else {
        if (isWarningActiveRef.current) {
          isWarningActiveRef.current = false;
          setShowInactivityWarning(false);
        }
      }
    };

    checkTimer();
    const intervalId = setInterval(checkTimer, 1000);
    return () => clearInterval(intervalId);
  }, [triggerLogout, timeoutDurationMs]);

  // Action: Extend session explicitly from warning modal
  const handleExtendInactivitySession = async () => {
    setIsExtending(true);
    try {
      await supabase.auth.refreshSession().catch(() => {});
      const now = Date.now();
      lastActivityRef.current = now;
      lastStorageWriteRef.current = now;
      try {
        localStorage.setItem('admin_last_activity', String(now));
      } catch (e) { /* ignore */ }
      isWarningActiveRef.current = false;
      setShowInactivityWarning(false);
      setInactivityCountdown(60);
      setSecondsRemaining(Math.ceil(timeoutDurationMs / 1000));
    } catch (err) {
      console.error('Failed to extend session:', err);
    } finally {
      setIsExtending(false);
    }
  };

  // Immediate Test Simulation: triggers warning modal with 15s remaining to test auto-logout
  const handleTestAutoLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const simulatedPastTime = Date.now() - (timeoutDurationMs - 15 * 1000);
    lastActivityRef.current = simulatedPastTime;
    lastStorageWriteRef.current = simulatedPastTime;
    try {
      localStorage.setItem('admin_last_activity', String(simulatedPastTime));
    } catch (err) { /* ignore */ }
    isWarningActiveRef.current = true;
    setShowInactivityWarning(true);
    setInactivityCountdown(15);
  };

  // Change inactivity timeout duration setting
  const handleTimeoutDurationChange = (newDurationMs: number) => {
    setTimeoutDurationMs(newDurationMs);
    try {
      localStorage.setItem('admin_timeout_setting_ms', String(newDurationMs));
    } catch (e) { /* ignore */ }
    const now = Date.now();
    lastActivityRef.current = now;
    lastStorageWriteRef.current = now;
    try {
      localStorage.setItem('admin_last_activity', String(now));
    } catch (e) { /* ignore */ }
    isWarningActiveRef.current = false;
    setShowInactivityWarning(false);
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
              onLogout('unauthorized');
            }
          }
        } else if (res.status === 401 || res.status === 403) {
          if (active) onLogout('unauthorized');
        }
      } catch (err) {
        console.error('Error validating profile (will retry on next activity):', err);
        // Do NOT force logout on transient network failure if user already had a valid session
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

  // Mobile Menu button component positioned in the top right corner of the dashboard
  const renderMobileMenuButton = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
      <button 
        type="button"
        onClick={() => setIsCommandPaletteOpen(true)}
        className="p-2 sm:px-2.5 sm:py-2 bg-[#141719] hover:bg-[#1F2225] rounded-xl border border-[#1F2225] text-zinc-400 hover:text-[#26F0C4] flex items-center justify-center transition-colors cursor-pointer"
        title="Search Commands (Ctrl+K)"
        aria-label="Search Commands"
      >
        <Search size={16} />
      </button>
      <button 
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="px-2.5 py-2 sm:px-3 sm:py-2 bg-[#141719] hover:bg-[#1B2D29] rounded-xl border border-[#26F0C4]/30 hover:border-[#26F0C4] text-[#26F0C4] flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
        title="Open Navigation Menu"
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
        <span className="text-xs font-mono font-bold">Menu</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full h-[100dvh] w-full bg-[#0A0C0E] text-[#E5E7EB] font-sans antialiased relative overflow-hidden select-none sm:select-auto">
      {/* Background radial overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vh] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vh] bg-emerald-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* 1. ADAPTIVE SIDEBAR (FOR DESKTOP & WIDE SCREENS >= 1024px) */}
      <div className="hidden lg:block relative w-[72px] m-4 flex-shrink-0 z-30">
        <aside className="absolute top-0 left-0 h-[calc(100vh-32px)] w-[72px] hover:w-[220px] group transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto overflow-x-hidden flex flex-col py-6 rounded-2xl bg-[#1C1E23]/95 backdrop-blur-2xl border border-white/[0.05] shadow-[0_0_40px_rgba(0,0,0,0.5)] hide-scrollbar">
          
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
              onClick={() => onLogout('manual')}
              className="w-full h-[40px] rounded-xl flex items-center px-3 outline-none text-zinc-400 hover:bg-red-500/10 hover:text-red-400 animate-in fade-in cursor-pointer"
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

      {/* Mobile drawer options overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[105] bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-[300px] max-w-[85vw] h-full max-h-[100dvh] bg-[#111315] border-l border-[#1F2225] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F2225]/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {currentUserProfile?.email ? (
                      <img 
                        src={currentUserProfile?.avatar_url || (currentUserProfile.email === 'angesh021@gmail.com' ? 'https://unavatar.io/github/angesh021' : `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUserProfile.email}`)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={15} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {currentUserProfile?.role === 'owner' ? 'Console Owner 👑' : 'Admin Operator'}
                    </span>
                    <span className="text-xs font-bold text-zinc-200 truncate max-w-[150px]">
                      {currentUserProfile?.email ? currentUserProfile.email.split('@')[0] : 'Admin'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close menu"
                >
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Search size={15} />
                Command Palette
              </button>
              <button
                onClick={() => onLogout('manual')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                Exit Console Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCROLLABLE MAIN CONTENT AREA */}
      <div 
        ref={mainContentRef}
        className="flex-grow flex-1 min-h-0 overflow-y-auto scroll-smooth w-full flex flex-col pt-0 pb-4 sm:pb-6 overflow-x-hidden"
      >
        
        {/* TELEMETRY BODY CONSOLE */}
        <main className="flex-grow px-3.5 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8 z-10 max-w-7xl mx-auto w-full">
          
          {activeTab === 'users' ? (
            <UserManagement mobileMenuButton={renderMobileMenuButton()} />
          ) : activeTab === 'audit-logs' ? (
            <AuditLogs mobileMenuButton={renderMobileMenuButton()} />
          ) : activeTab === 'db-maintenance' ? (
            <DatabaseMaintenance mobileMenuButton={renderMobileMenuButton()} />
          ) : activeTab === 'cv-management' && currentUserProfile?.role === 'owner' && currentUserProfile?.email?.toLowerCase() === 'angesh021@gmail.com' ? (
            <CvManagementTab mobileMenuButton={renderMobileMenuButton()} />
          ) : (
            <>
              {/* ADAPTIVE TITLE BANNER WITH MENU IN TOP-RIGHT CORNER */}
              <div className="flex flex-col gap-4 pb-5 sm:pb-6 mb-6 border-b border-[#1F2225]/60">
                {/* Top Row: Title + Mobile Menu Button on the exact same horizontal level */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="text-left flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-gradient-to-br from-[#141719] to-[#0A0C0E] border border-[#1F2225] items-center justify-center shadow-lg shrink-0">
                      <Activity className="text-[#26F0C4]" size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-[#E5E7EB] font-sans truncate">
                          SRE Control Console
                        </h1>
                        <span className="hidden sm:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#26F0C4]/10 text-[#26F0C4] border border-[#26F0C4]/20">
                          {activeTab.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-mono text-[#8B929A] mt-1 sm:mt-1.5">
                        <span className="flex items-center gap-1.5 bg-[#141719] border border-[#1F2225] py-1 px-2 sm:px-2.5 rounded-md text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#26F0C4] animate-pulse"></span>
                          EDGE-SEC-1A
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#141719] border border-[#1F2225] py-1 px-2 sm:px-2.5 rounded-md text-blue-400">
                          {footprintHash ? footprintHash.substring(0, 10) : 'DETERMINISTIC'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TOP RIGHT CORNER: MOBILE MENU BUTTON AT EXACT LEVEL OF TITLE */}
                  {renderMobileMenuButton()}
                </div>

                {/* Controls Row: Datepicker, Inactivity Controls, and Refresh */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full pt-1">
                  {/* Left: Datepicker */}
                  <div className="relative" ref={datePickerRef}>
                    <button 
                      type="button"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="h-9 px-3 sm:px-3.5 bg-[#141719] border border-[#1F2225] hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 outline-none cursor-pointer select-none"
                    >
                      <Calendar size={13} className="text-[#26F0C4]" />
                      <span>{dateRange.label}</span>
                      <ChevronDown size={11} className={`transition-transform duration-200 text-zinc-500 ${isDatePickerOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    {isDatePickerOpen && (
                      <div className="absolute left-0 top-full mt-2 w-64 bg-[#111315]/98 backdrop-blur-xl border border-[#1F2225] rounded-xl shadow-2xl p-2 z-50 text-left text-xs font-mono">
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
                              type="button"
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
                                  type="button"
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

                  {/* Right Controls: Auto-Logout Timeout, TTL display, Test Simulation, Refresh */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Timeout Duration Selector */}
                    <AdminDropdown<number>
                      value={timeoutDurationMs}
                      onChange={handleTimeoutDurationChange}
                      headerTitle="Session Idle Timeout"
                      title="Session Idle Timeout (Logout triggers only after continuous inactivity; stays open while you are using the dashboard)"
                      icon={<Clock size={12} className="text-[#26F0C4]" />}
                      options={[
                        { value: 300000, label: 'Idle Timeout: 5m' },
                        { value: 600000, label: 'Idle Timeout: 10m' },
                        { value: 900000, label: 'Idle Timeout: 15m (Default)' },
                        { value: 1800000, label: 'Idle Timeout: 30m' },
                        { value: 3600000, label: 'Idle Timeout: 1h' },
                        { value: 7200000, label: 'Idle Timeout: 2h' },
                      ]}
                    />

                    {/* TTL Countdown Indicator */}
                    <div
                      className={`h-9 px-2.5 sm:px-3 bg-[#141719] border rounded-xl flex items-center gap-1.5 text-xs font-mono select-none ${
                        showInactivityWarning || secondsRemaining <= 60
                          ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' 
                          : 'border-[#1F2225] text-zinc-300'
                      }`}
                      title="Session Idle Timer: Automatically resets whenever you move your mouse, scroll, click, or type. Logout only triggers after continuous inactivity."
                    >
                      <Shield size={12} className={showInactivityWarning || secondsRemaining <= 60 ? 'text-amber-400 animate-pulse' : 'text-[#26F0C4]'} />
                      <span className="font-bold">
                        {secondsRemaining !== null 
                          ? `${Math.floor(secondsRemaining / 60)}m ${String(secondsRemaining % 60).padStart(2, '0')}s` 
                          : "TTL Loading..."
                        }
                      </span>
                    </div>

                    {/* Instant Auto-Logout Test Simulation Trigger */}
                    <button
                      type="button"
                      onClick={handleTestAutoLogout}
                      className="h-9 px-2.5 sm:px-3 bg-[#1F2225] hover:bg-[#2B3035] text-[#8B929A] hover:text-[#26F0C4] border border-[#2B3035]/60 hover:border-[#26F0C4]/30 rounded-xl flex items-center gap-1.5 transition-all outline-none cursor-pointer text-xs font-mono active:scale-95"
                      title="Simulate auto-logout immediately (15s warning popup countdown)"
                    >
                      <Zap size={12} className="text-[#26F0C4]" />
                      <span className="hidden sm:inline">Test Auto-Logout (15s)</span>
                      <span className="sm:hidden">Test 15s</span>
                    </button>

                    {/* Telemetry Refresh Button */}
                    <button 
                      type="button"
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="h-9 w-9 bg-[#26F0C4]/10 hover:bg-[#26F0C4]/15 text-[#26F0C4] border border-[#26F0C4]/20 hover:border-[#26F0C4]/30 rounded-xl flex items-center justify-center transition-colors outline-none cursor-pointer disabled:opacity-50"
                      title="Recalibrate Live Telemetry Feed"
                    >
                      <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
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

      {/* Inactivity Security Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#141719] border border-amber-500/30 max-w-md w-full rounded-2xl p-5 sm:p-6 text-left shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden">
            {/* Visual glow at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] h-[4px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

            <div className="flex items-start gap-3.5 mb-5">
              <div className="shrink-0 p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30 animate-pulse">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 font-sans">Idle Session Security Alert</h3>
                <p className="text-xs text-[#8B929A] mt-1 font-mono">
                  Continuous inactivity detected. Moving your mouse, scrolling, typing, or clicking Keep Me Logged In will immediately keep your session active.
                </p>
              </div>
            </div>

            {/* Countdown Display & Decay Bar */}
            <div className="bg-[#0A0C0E] border border-[#1F2225] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-[#8B929A] uppercase tracking-wider">Time Before Idle Logout</span>
                <span className="text-sm font-mono font-bold text-amber-400">{inactivityCountdown}s remaining</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#1F2225] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (inactivityCountdown / Math.min(60, Math.ceil(timeoutDurationMs / 1000))) * 100))}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-[#8B929A] leading-relaxed mb-6 font-sans">
              Sessions never lock out while you are actively working. To confirm you are still here, click <strong className="text-zinc-200">"Keep Me Logged In"</strong> below or simply interact anywhere on the page.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => triggerLogout('inactivity')}
                className="h-10 px-4 rounded-xl font-bold text-xs bg-[#1F2225] text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-[#2B3035]/60 hover:border-red-900/30 transition-all cursor-pointer"
              >
                Secure Logout
              </button>
              <button
                type="button"
                disabled={isExtending}
                onClick={handleExtendInactivitySession}
                className="h-10 px-5 rounded-xl font-bold text-xs bg-[#26F0C4] text-[#0A0C0E] hover:bg-[#1FD9B1] shadow-[0_0_20px_rgba(38,240,196,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExtending ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Keep Me Logged In</span>
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
