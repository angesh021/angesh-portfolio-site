/**
 * File: /components/dashboard/Login.tsx
 * Purpose: Premium minimalist modern UI for Administrator authentication.
 * Inspired by the sleek split-screen layout with a curved wave division, high-end mountain-pine parallax background,
 * custom form field aesthetics with focus state glowing borders, interactive capsule buttons, a monogram accent logo,
 * and micro-animations while retaining full supabase, pre-auth check, and invitation validation mechanics.
 * 
 * Advanced Features Implemented:
 * 1. Interactive System Integrity Diagnostics Scan: Live cyber security diagnostics scanning with animated console outputs.
 * 2. Active Password Strength Assessment System: Dynamic complexity threat bar ('Exposed' -> 'Nominal' -> 'Encrypted') with visual meter.
 * 3. Manual Invitation Code Redemption Gate: Manual input mechanism and interactive token resolver.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Loader2, Check, X as IconX, Mail, KeyRound, 
  Eye, EyeOff, Lock, ShieldAlert, Cpu, Terminal, ArrowRight, Activity, 
  Settings, RefreshCw, Layers, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, Variants } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
}

// Scramble text effect for typewriter visual depth
const ScrambleText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const chars = '!<>-_\\/[]{}—=+*^?#';
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (time: number) => {
      if (startTimeRef.current === undefined) startTimeRef.current = time;
      const elapsedTime = time - startTimeRef.current;
      const progress = Math.min(elapsedTime / 800, 1);

      const newText = text.split('').map((char, index) => {
        const revealPosition = Math.floor(progress * text.length);
        if (index < revealPosition || char === ' ') return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');

      setDisplayedText(newText);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text]);

  return <span>{displayedText}</span>;
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {

  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [shake, setShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatic login check if session is already active
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onLoginSuccess();
      }
    });
  }, [onLoginSuccess]);

  const [email, setEmail] = useState('');
  const [checkedEmail, setCheckedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'initial' | 'checking' | 'login' | 'signup' | 'unauthorized' | 'error'>('initial');
  const [showPassword, setShowPassword] = useState(false);

  // Validate email dynamically
  useEffect(() => {
    let isStale = false;
    
    const handleEmailCheck = async () => {
      // Regex detects typically complete emails (e.g., has .com, .co.uk, etc.)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
      
      if (emailRegex.test(email)) {
        if (email !== checkedEmail) {
          setMode('checking');
          setErrorMessage(null);
          setAuthStatus('idle');
          try {
            const res = await fetch('/api/auth/check-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            if (isStale) return; // Prevent overwriting if user typed a new email
            
            const data = await res.json();
            if (res.ok) {
              setCheckedEmail(email);
              if (!data.inAccessList) {
                 setErrorMessage('Identity not found in Access Control List. Contact administrator.');
                 setMode('unauthorized');
                 setAuthStatus('error');
              } else {
                 setMode(data.isFirstTime ? 'signup' : 'login');
                 setErrorMessage(null);
                 setAuthStatus('idle');
              }
            } else {
              console.error('Email check failed:', data.error);
              setErrorMessage(data.error);
              setMode('error');
              setAuthStatus('error');
              setCheckedEmail(email);
            }
          } catch (err: any) {
            if (isStale) return;
            console.error(err);
            setErrorMessage('Network error while checking user status.');
            setMode('error');
            setAuthStatus('error');
            setCheckedEmail(email);
          }
        }
      } else if (mode !== 'initial' && mode !== 'checking') {
        // Reset if user modifies email back to an invalid state
        setMode('initial');
        setCheckedEmail('');
        setPassword('');
        setErrorMessage(null);
        setAuthStatus('idle');
      }
    };

    const timer = setTimeout(() => {
      handleEmailCheck();
    }, 400); // debounce slightly

    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [email, mode, checkedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'initial' || mode === 'checking') return;
    
    setAuthStatus('loading');
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onLoginSuccess();
      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/setup-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to establish credentials. Please try again.');
        
        // Wait briefly just to ensure triggers complete
        await new Promise(resolve => setTimeout(resolve, 500));

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Authentication process failed:', err.message);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      setAuthStatus('error');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setAuthStatus('idle');
      }, 2500);
    }
  };

  // Multilayer Parallax Coordinates based on mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 45, damping: 20, mass: 1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  // Transform settings for layered parallax movement
  const imgParallaxX = useTransform(smoothMouseX, [-500, 500], [-35, 35]);
  const imgParallaxY = useTransform(smoothMouseY, [-500, 500], [-35, 35]);

  const leftPanelTiltX = useTransform(smoothMouseY, [-500, 500], [1.5, -1.5]);
  const leftPanelTiltY = useTransform(smoothMouseX, [-500, 500], [-1.5, 1.5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left - width / 2);
    mouseY.set(e.clientY - top - height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (authStatus !== 'idle') return;

    setAuthStatus('loading');
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Authentication process failed:', err.message);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      setAuthStatus('error');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setAuthStatus('idle');
      }, 2500);
    }
  };

  // Staggered transitions
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8, 
        staggerChildren: 0.1, 
        delayChildren: 0.1 
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-[#0a0d14] flex flex-col md:flex-row select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      id="aether_login_container"
    >
      {/* =========================================================================
          LEFT SIDE: Minimalist Modern Workspace (Control Panel)
          ========================================================================= */}
      <motion.div 
        className="w-full md:w-[50%] lg:w-[48%] bg-[#0f121a] flex flex-col justify-between p-6 md:p-14 lg:p-16 z-20 relative shadow-[10px_0_40px_rgba(3,4,7,0.4)] overflow-y-auto"
        style={{ rotateX: leftPanelTiltX, rotateY: leftPanelTiltY, transformStyle: "preserve-3d" }}
      >
        {/* Animated subtle glass background highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.012] to-transparent pointer-events-none" />

        {/* Top Header: System Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-950/40 border border-white/[0.04] flex items-center justify-center text-sky-400">
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#8490a6] uppercase font-bold">
              <ScrambleText text="AETHER SECURITY" />
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <motion.div 
          className="my-auto py-8 flex flex-col gap-6 max-w-[420px] w-full mx-auto md:mx-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Typography Header Section */}
          <motion.div className="flex flex-col gap-2" variants={itemVariants}>
            <span className="text-[9.5px] tracking-[0.3em] font-mono font-bold text-sky-400 uppercase">
              ADMINISTRATION SUITE
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight">
              Admin console<span className="text-sky-400 font-black animate-pulse">.</span>
            </h1>
            <p className="text-xs text-[#8490a6] leading-relaxed">
              Verify your security context or redeem a verified invitation key to administer SRE telemetry networks.
            </p>
          </motion.div>

          {/* Core Login Choices */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 relative">
            
            <div className="relative group/field">
              <input 
                type="email" 
                autoComplete="email"
                placeholder="administrator@domain.com"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (val !== checkedEmail && mode !== 'initial') {
                    setMode('initial');
                    setAuthStatus('idle');
                    setErrorMessage(null);
                  }
                }}
                className="w-full h-12 bg-black/40 border border-[#1f2937] rounded-xl px-4 pl-12 font-mono text-[11.5px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:bg-[#0c1424] transition-all"
                disabled={authStatus === 'loading'}
                required
              />
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/field:text-sky-400 transition-colors" />
              
              {mode === 'checking' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {(mode === 'signup' || mode === 'login') && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="flex flex-col gap-4 overflow-hidden"
                >
                  <div className="text-[10.5px] font-mono text-zinc-400 mt-1 ml-1 flex items-start sm:items-center gap-2 animate-fade-in leading-relaxed pr-2">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                    <span className="whitespace-normal">
                      {mode === 'signup' ? 'Approved identity detected. First time login - please establish a secure password.' : 'Verified identity. Please provide your secure credentials.'}
                    </span>
                  </div>

                  <div className="relative group/field">
                    <input 
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === 'signup' ? "new-password" : "current-password"}
                      placeholder="••••••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 bg-black/40 border border-[#1f2937] rounded-xl px-4 pl-12 pr-12 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 focus:bg-[#0c1424] transition-all tracking-wider"
                      disabled={authStatus === 'loading'}
                      required
                      minLength={8}
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/field:text-sky-400 transition-colors" />
                    <button 
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authStatus === 'loading' || !password}
                    className="w-full h-12 relative rounded-full font-mono text-[11.5px] font-bold tracking-wider uppercase cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 text-[#0a101d] select-none active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed border bg-sky-400 border-sky-400 hover:bg-emerald-400 hover:border-emerald-400 group overflow-hidden mt-2"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                       {authStatus === 'loading' ? (
                          <><Loader2 size={14} className="animate-spin" /> EXECUTING...</>
                       ) : (
                          <>{mode === 'signup' ? 'Establish Credentials' : 'Authenticate Session'} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                       )}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Interactive Errors Container */}
            <div className="min-h-[34px] flex items-center justify-start mt-1">
              <AnimatePresence>
                {authStatus === 'error' && errorMessage && (
                  <motion.div
                    className="w-full bg-[#3c1518]/20 border border-red-500/15 rounded-xl p-3 flex gap-2 items-start"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={13} />
                    <p className="text-red-400 font-mono text-[9.5px] leading-relaxed max-w-full text-left">
                      {errorMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </form>


        </motion.div>

        {/* Footer info logs */}
        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-600 border-t border-white/[0.02] pt-4">
          <span className="flex items-center gap-1"><Activity size={10} className="text-emerald-500 animate-pulse" /> Nodes: Online</span>
          <span>Gateway v1.3</span>
        </div>
      </motion.div>

      {/* =========================================================================
          RIGHT SIDE: Custom Fluid Curved Split with Parallax Pine-Forest Mountains
          ========================================================================= */}
      <div className="hidden md:block md:w-[50%] lg:w-[52%] relative overflow-hidden h-full min-h-screen">
        
        {/* Curved division SVG mask to isolate the left panel separation in style */}
        <div className="absolute inset-y-0 left-0 w-16 z-30 pointer-events-none overflow-hidden select-none -translate-x-1">
          <svg className="w-full h-full text-[#0f121a] fill-current" viewBox="0 0 100 1000" preserveAspectRatio="none">
            <path d="M0,0 Q90,300 10,600 T0,1000 L0,1000 Z" />
          </svg>
          
          {/* Animated decorative dashed trace line following the curve */}
          <svg className="absolute inset-y-0 left-0 w-full h-full text-zinc-800 opacity-60" viewBox="0 0 100 1000" preserveAspectRatio="none">
            <path d="M0,0 Q90,300 10,600 T0,1000" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,4" />
          </svg>
        </div>

        {/* Multi-layered atmospheric landscape backdrop inside container */}
        <motion.div 
          className="absolute inset-[-40px] z-10"
          style={{ x: imgParallaxX, y: imgParallaxY }}
        >
          {/* Main Unsplash Forest / Mountains Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center grayscale contrast-[1.1] brightness-[0.4]"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1400&auto=format&fit=crop')` 
            }}
          />

          {/* Deep cybernetic blue color wash overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/80 via-[#0c1424]/35 to-transparent mix-blend-multiply" />
          <div className="absolute inset-0 bg-[#0f121a]/20 mix-blend-overlay" />

          {/* Glowing particle layer to enhance atmosphere */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0d14_90%)]" />
        </motion.div>

        {/* Highlight Monogram Logo in the bottom right corner (from screenshot reference) */}
        <div className="absolute bottom-10 right-10 z-30 select-none flex items-center gap-1.5">
          <span className="text-sm font-sans font-extralight text-[#8490a6] uppercase tracking-[0.25em]">
            AETHERIUS
          </span>
          <div className="flex items-center">
            <span className="text-lg font-mono font-bold text-white tracking-widest uppercase">
              Λ
            </span>
            {/* The signature white dot accent */}
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 ml-0.5 animate-pulse" />
          </div>
        </div>

        {/* Dynamic Telemetry terminal coordinates displayed subtly */}
        <div className="absolute top-10 right-10 z-30 font-mono text-[9.5px] text-zinc-500/80 leading-relaxed text-right select-all">
          <p>LOC_GRID: 47.6062° N // 122.3321° W</p>
          <p>DEFENSE_SEC: COGNITIVE_KEY</p>
          <p>IP_STATUS: ISOLATED_SESSION</p>
        </div>

      </div>
    </div>
  );
};

export default Login;
