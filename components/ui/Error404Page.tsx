import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, Home, Compass, Radio } from 'lucide-react';

interface Error404PageProps {
  onGoBack: () => void;
}

const Error404Page: React.FC<Error404PageProps> = ({ onGoBack }) => {
  // Mouse magnetic tilt effect for the center layout
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for translation
  const springConfig = { damping: 30, stiffness: 120, mass: 0.5 };
  const translateX = useSpring(useTransform(mouseX, [-400, 400], [-15, 15]), springConfig);
  const translateY = useSpring(useTransform(mouseY, [-400, 400], [-15, 15]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Deterministic star sizes and positions to avoid hydration mismatches
  const backgroundStars = [
    { top: '10%', left: '8%', delay: 0.2, size: 1.5, opacity: 0.4 },
    { top: '15%', left: '42%', delay: 1.1, size: 2.0, opacity: 0.7 },
    { top: '8%', left: '78%', delay: 0.5, size: 1.2, opacity: 0.5 },
    { top: '25%', left: '20%', delay: 1.8, size: 2.2, opacity: 0.8 },
    { top: '30%', left: '88%', delay: 0.3, size: 1.5, opacity: 0.6 },
    { top: '38%', left: '12%', delay: 0.9, size: 2.5, opacity: 0.9 },
    { top: '45%', left: '62%', delay: 2.1, size: 1.0, opacity: 0.4 },
    { top: '55%', left: '18%', delay: 0.6, size: 1.8, opacity: 0.7 },
    { top: '62%', left: '82%', delay: 1.4, size: 2.0, opacity: 0.8 },
    { top: '70%', left: '38%', delay: 0.1, size: 1.5, opacity: 0.5 },
    { top: '78%', left: '10%', delay: 1.3, size: 2.4, opacity: 0.9 },
    { top: '85%', left: '70%', delay: 0.7, size: 1.2, opacity: 0.6 },
    { top: '90%', left: '26%', delay: 2.3, size: 2.0, opacity: 0.7 },
    { top: '92%', left: '90%', delay: 1.6, size: 1.5, opacity: 0.5 },
  ];

  return (
    <div 
      className="min-h-screen bg-[#03020a] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden font-sans select-none selection:bg-[#64ffda]/30 transition-all duration-500"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      
      {/* 1. Technical Cyber-Blueprint Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-screen overflow-hidden z-0">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0),
              linear-gradient(rgba(100, 255, 218, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 255, 218, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 40px 40px, 40px 40px'
          }}
        />
      </div>

      {/* 2. Soft-Glow Multi-Layer Space Nebulas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '15s' }} />
        <div className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] bg-cyan-950/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '20s' }} />
        <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-950/20 rounded-full blur-[110px]" />
      </div>

      {/* 3. Starfield Matrix */}
      {backgroundStars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full pointer-events-none z-0"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: star.size > 2 ? '0 0 8px rgba(255,255,255,0.8)' : 'none'
          }}
          animate={{
            opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 4. Elegant Top Margin Metadata Header / Telemetry (Premium design layout) */}
      <header className="relative w-full flex items-center justify-between z-10 text-[10px] sm:text-xs font-mono tracking-[0.25em] text-slate-500 max-w-7xl mx-auto border-b border-white/5 pb-4 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1b9ca6]/70 animate-ping" />
          <span className="text-[#1b9ca6] dark:text-[#64ffda] uppercase font-bold">SYSTEM SEARCH</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span>COORDINATES: [0x404::ERR]</span>
          <span>LAT: 40.0404° N</span>
          <span>SPEED: TERMINATED</span>
        </div>
        <div>
          <span>RELIABILITY_RATIO: 0.00%</span>
        </div>
      </header>

      {/* 5. Main Centerpiece - Direct layout without card/box container */}
      <main className="relative flex-grow flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-24 max-w-7xl mx-auto w-full z-10 py-12">
        
        {/* Left Side: Modern Interactive SVG Masterpiece (Geometric Gravitational Singularity) */}
        <motion.div 
          className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] flex items-center justify-center select-none"
          style={{ x: translateX, y: translateY }}
        >
          {/* Gravitational Core Flare Glow */}
          <div className="absolute w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] bg-gradient-to-tr from-purple-500/10 via-cyan-500/10 to-indigo-500/10 rounded-full blur-[60px]" />

          {/* Core Singularity Orb (Premium Glass Glassmorphism) */}
          <motion.div 
            className="absolute w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#0b0521] via-[#100732] to-[#200d5a] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl shadow-purple-950/40 z-20"
            animate={{
              boxShadow: [
                '0 0 30px rgba(100, 255, 218, 0.1)',
                '0 0 50px rgba(168, 85, 247, 0.15)',
                '0 0 30px rgba(100, 255, 218, 0.1)'
              ]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Deep Glass Reflection Radial Wave */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)] z-10" />
            
            {/* Minimalist Tech Vector Sphere Core */}
            <svg className="w-12 h-12 sm:w-16 sm:h-16 opacity-80" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="35" stroke="rgba(100, 255, 218, 0.4)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="25" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" />
              <motion.circle 
                cx="50" 
                cy="50" 
                r="15" 
                fill="url(#coreGradient)"
                animate={{ scale: [1, 1.15, 1] }} 
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <defs>
                <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#64ffda" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#03020a" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Orbit System - Nested Crisp Geometrics */}
          <svg className="absolute w-full h-full scale-95 md:scale-100" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            
            {/* Inner Dashboard Telemetry Scope */}
            <circle cx="200" cy="200" r="180" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1.5" strokeDasharray="1,12" />
            
            {/* Ring 1 - Deep Purple Dashed (Slower Reverse) */}
            <motion.g 
              animate={{ rotate: -360 }} 
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="origin-center"
            >
              <ellipse cx="200" cy="200" rx="135" ry="50" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" strokeDasharray="4,8" />
              {/* Outer Micro Node */}
              <circle cx="65" cy="200" r="3" fill="#8b5cf6" className="shadow-[0_0_8px_#8b5cf6]" />
            </motion.g>

            {/* Ring 2 - Elegant Gold / Amber Ring (Faster Forward) */}
            <motion.g 
              animate={{ rotate: 360 }} 
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="origin-center"
            >
              <ellipse cx="200" cy="200" rx="95" ry="95" stroke="url(#amberGradient)" strokeWidth="0.75" />
              
              {/* Signal Probe Node on Orbit Grid */}
              <g transform="translate(295, 200)">
                <circle cx="0" cy="0" r="3.5" fill="#f59e0b" />
                <circle cx="0" cy="0" r="6.5" stroke="#f59e0b" strokeWidth="0.5" className="animate-ping" />
              </g>
            </motion.g>

            {/* Ring 3 - Modern Neon Cyan Slanted Ring with high tech markings */}
            <motion.g 
              animate={{ rotate: 120 }} 
              style={{ transformOrigin: 'center' }}
            >
              <ellipse cx="200" cy="200" rx="160" ry="75" stroke="url(#cyanOrbitGrad)" strokeWidth="1.5" strokeDasharray="40,2,4,2,4,2" />
              
              {/* Sleek Minimalist Satellite Geometry */}
              <motion.g 
                animate={{ 
                  offsetDistance: ["0%", "100%"],
                  rotate: [0, 360]
                }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="origin-center"
              >
                {/* Visual Anchor Indicator */}
                <circle cx="360" cy="200" r="4.5" fill="#64ffda" />
                <path d="M351 200 L369 200 M360 191 L360 209" stroke="rgba(100,255,218,0.3)" strokeWidth="0.75" />
              </motion.g>
            </motion.g>

            {/* Gradients */}
            <defs>
              <linearGradient id="cyanOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64ffda" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1b9ca6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#64ffda" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Compass Rose Ring Overlay */}
          <div className="absolute inset-0 border-[0.5px] border-white/5 rounded-full scale-75 pointer-events-none" />
        </motion.div>

        {/* Right Side: Clean Display Typography (No central box container) */}
        <div className="flex flex-col items-center xl:items-start text-center xl:text-left space-y-6 max-w-xl px-4 sm:px-0">
          
          {/* Status badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-mono"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Radio size={12} className="text-[#1b9ca6] dark:text-[#64ffda] animate-pulse" />
            <span>BEACON LOSS DETECTION</span>
          </motion.div>

          <div className="space-y-4">
            {/* Elegant Modern 404 Header with glowing accents */}
            <motion.h1 
              className="text-[90px] sm:text-[130px] font-extrabold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 select-all filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              404
            </motion.h1>

            {/* Why am I here subtitle */}
            <motion.h2 
              className="text-2xl sm:text-3.5xl font-semibold tracking-tight text-white leading-tight"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Why am I here?
            </motion.h2>

            {/* Subtext description */}
            <motion.p 
              className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-md sm:max-w-lg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              The digital coordinates you request do not translate to an active target orbit. The page may have been decommissioned or relocated deep into private launch vectors.
            </motion.p>
          </div>

          {/* Premium Floating Button Grid */}
          <motion.div 
            className="pt-4 flex flex-col sm:flex-row items-center gap-4 w-full justify-center xl:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              id="btn-return-home"
              onClick={onGoBack}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-50 transition-all duration-300 transform active:scale-[0.98] text-xs sm:text-sm tracking-wider cursor-pointer shadow-lg shadow-white/5 saturate-[1.2]"
            >
              <Home size={16} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              RETURN TO BASE
            </button>
            
            <button
              id="btn-go-back-history"
              onClick={() => window.history.back()}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl border border-white/10 hover:border-[#1b9ca6]/50 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-white font-semibold transition-all duration-300 transform active:scale-[0.98] text-xs sm:text-sm tracking-wider cursor-pointer backdrop-blur-sm"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              PREVIOUS SECTOR
            </button>
          </motion.div>

        </div>
      </main>

      {/* 6. Deep Footer Coordinates / Telemetry System Status */}
      <footer className="relative w-full flex flex-col sm:flex-row items-center justify-between z-10 text-[9px] font-mono tracking-widest text-slate-600 max-w-7xl mx-auto border-t border-white/5 pt-4 gap-2 text-center select-none mt-6">
        <div>
          <span>SECURED CONTEXT // STATUS_OK</span>
        </div>
        <div className="hidden sm:block">
          <span>PORT: 3000 // DEPLOYMENT: CLOUD_RUN</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} PORTFOLIO. ALL LAUNCH COMMANDS ACTIVE.</span>
        </div>
      </footer>

    </div>
  );
};

export default Error404Page;
