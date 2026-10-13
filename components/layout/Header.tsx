import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// FIX: Import Variants to correctly type framer-motion variants objects.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Home, User, Briefcase, Code, GraduationCap, Mail, Settings, X, Check, Power, Volume2, ChevronDown, Sparkles } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useTheme, accentColorOptions, AccentColorName } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { useStreak } from '../../hooks/useStreak';
import { BACKGROUND_MODES } from '../ui/MatrixBackground';
import LanguageSelector from '../ui/LanguageSelector';
import ResumeDownloader from '../ui/ResumeDownloader';
import { AngeshLogo } from '../ui/AngeshLogo';

// --- Configuration ---
const navItemsConfig = (t: (key: any) => string) => [
  { id: 'hero', label: t('nav_home') || 'Home', icon: Home, type: 'link' },
  { id: 'about', label: t('nav_about'), icon: User, type: 'link' },
  { id: 'experience', label: t('nav_experience'), icon: Briefcase, type: 'link' },
  { id: 'projects', label: t('nav_projects'), icon: Code, type: 'link' },
  { id: 'education', label: t('nav_education'), icon: GraduationCap, type: 'link' },
  { id: 'contact', label: t('nav_contact'), icon: Mail, type: 'link' },
  { id: 'settings', label: t('settings_title'), icon: Settings, type: 'action' },
];

// --- Hooks ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return isMobile;
};

// --- Sub-Components ---

/**
 * NEW: A general-purpose, animated toggle switch for settings.
 * Designed with absolute-translate spring animation of exactly 24px
 * to guarantee there is zero layout shift or toggle jitter when toggled or mounted.
 */
const ToggleSwitch: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange();
    }
  };

  return (
    <div
      className={`relative w-[44px] h-[24px] rounded-full p-[2px] cursor-pointer flex items-center border transition-all duration-300 ${
        checked 
          ? 'bg-primary border-primary shadow-[0_0_12px_rgba(100,255,218,0.25)]' 
          : 'bg-light-bg-alt/80 dark:bg-dark-bg/80 border-light-border dark:border-dark-card/60 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.08)]'
      }`}
      onClick={onChange}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        className="w-[18px] h-[18px] bg-white rounded-full shadow-[0_1.5px_3px_rgba(0,0,0,0.15)] flex items-center justify-center pointer-events-none"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={`w-[4px] h-[4px] rounded-full transition-all duration-300 ${checked ? 'bg-primary scale-125' : 'bg-light-text-secondary/35 dark:bg-dark-text-secondary/25'}`} />
      </motion.div>
    </div>
  );
};


/**
 * RENAMED: The special-purpose animated toggle for light/dark theme.
 */
const AnimatedThemeToggle: React.FC<{ checked: boolean, onChange: () => void }> = ({ checked, onChange }) => {
  const isDark = checked;

  // FIX: Added Variants type to help TypeScript infer types correctly.
  const sunRaysVariants: Variants = {
    light: { rotate: 0, scale: 1 },
    dark: { rotate: 90, scale: 0 },
  };

  // FIX: Explicitly cast 'spring' to const to prevent TypeScript from widening the type to 'string'.
  const spring = { type: "spring" as const, stiffness: 400, damping: 25 };

  // FIX: Added Variants type to help TypeScript infer types correctly.
  const moonMaskVariants: Variants = {
    light: { cx: 24, transition: { ...spring, delay: 0 } },
    dark: { cx: 12, transition: { ...spring, delay: 0.1 } },
  };
  
  return (
    <motion.button
      onClick={onChange}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
      whileTap={{ scale: 0.9, rotate: 15 }}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-light-bg-alt dark:bg-dark-card border border-light-border dark:border-dark-card transition-colors hover:border-primary"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible text-yellow-500 dark:text-primary transition-colors duration-500"
      >
        <mask id="theme-toggle-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            cx="12"
            cy="4"
            r="9"
            fill="black"
            variants={moonMaskVariants}
            initial={false}
            animate={isDark ? 'dark' : 'light'}
            transition={spring}
          />
        </mask>
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          fill="currentColor"
          mask="url(#theme-toggle-mask)"
          transition={spring}
        />
        <motion.g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={sunRaysVariants}
          initial={false}
          animate={isDark ? 'dark' : 'light'}
          transition={spring}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </motion.g>
      </svg>
    </motion.button>
  );
};


const SettingToggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
}> = ({ label, description, checked, onChange }) => {
    const { language } = useI18n();
    const isFr = language === 'fr';
    const statusText = checked 
        ? (isFr ? 'ACTIVÉ' : 'ENABLED') 
        : (isFr ? 'DÉSACTIVÉ' : 'DISABLED');

    return (
        <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
                <h4 className="font-semibold text-light-text dark:text-dark-text text-sm sm:text-base leading-snug">{label}</h4>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5 leading-relaxed">{description}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 select-none min-w-[70px]">
                <ToggleSwitch checked={checked} onChange={onChange} />
                <span className={`text-[9px] font-mono tracking-widest font-semibold transition-colors duration-300 ${
                    checked 
                        ? 'text-primary dark:text-primary drop-shadow-[0_0_8px_rgba(100,255,218,0.25)]' 
                        : 'text-light-text-secondary/70 dark:text-dark-text-secondary/60'
                }`}>
                    {statusText}
                </span>
            </div>
        </div>
    );
};


// --- Settings Panel ---

// Color helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => r + r + g + g + b + b));
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function isColorLight(hex: string): boolean {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    // Using the luminance formula to determine brightness
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
}

const SettingsPanel: React.FC<{
  onClose: () => void;
  t: (key: string) => string;
  navRef: React.RefObject<HTMLDivElement>;
  gearRef: React.RefObject<HTMLButtonElement>;
}> = ({ onClose, t, navRef, gearRef }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [transformOrigin, setTransformOrigin] = useState('50% 0%');
  const { theme, toggleTheme, setAccentColor, uniformTheme, toggleUniformTheme, accentColorName } = useTheme();
  const { addPoints } = useStreak();
  const {
    highContrastMode,
    showCrtLines,
    showFirewallGlow,
    showGlitchEffect,
    skipBootSequence,
    zoomedMode,
    toggleSetting,
    resetSettings,
    activeBgId,
    setSetting
  } = useSettings();

  const handleToggle = (settingName: any) => {
    toggleSetting(settingName);
    addPoints(5, 'toggle_setting');
  };

  const [isBgDropdownOpen, setIsBgDropdownOpen] = useState(false);
  const bgSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bgSelectorRef.current && !bgSelectorRef.current.contains(event.target as Node)) {
        setIsBgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent background scrolling while panel is open
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Prevent scroll chaining when searching/scrolling boundaries of settings panel on trackpads and mobile touch screens
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startY = e.touches[0].pageY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const currentY = e.touches[0].pageY;
      const difference = startY - currentY; // positive = scroll down, negative = scroll up

      // At top limit and trying to scroll up (dragging fingers down -> difference < 0)
      if (el.scrollTop <= 0 && difference < 0) {
        if (e.cancelable) e.preventDefault();
      }

      // At bottom limit and trying to scroll down (dragging fingers up -> difference > 0)
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop >= maxScroll - 1 && difference > 0) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;

      // At top limit and trying to scroll up (deltaY < 0)
      if (el.scrollTop <= 0 && delta < 0) {
        if (e.cancelable) e.preventDefault();
      }

      // At bottom limit and trying to scroll down (deltaY > 0)
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (el.scrollTop >= maxScroll - 1 && delta > 0) {
        if (e.cancelable) e.preventDefault();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getModeStatusAndTone = (id: string) => {
    switch (id) {
      case 'stealth':
        return {
          style: 'bg-zinc-600 dark:bg-zinc-500 border-zinc-400/30',
          glow: 'shadow-[0_0_6px_rgba(113,113,122,0.4)]',
          iconColor: 'text-zinc-400'
        };
      case 'nexus':
        return {
          style: 'bg-gradient-to-r from-blue-600 to-indigo-500 border-indigo-400/50',
          glow: 'shadow-[0_0_10px_rgba(99,102,241,0.6)]',
          iconColor: 'text-indigo-400'
        };
      case 'grid':
        return {
          style: 'bg-teal-500/30 border-teal-400/60',
          glow: 'shadow-[0_0_10px_rgba(20,184,166,0.6)]',
          iconColor: 'text-teal-400'
        };
      case 'flow':
        return {
          style: 'bg-gradient-to-tr from-cyan-400 to-emerald-400 border-emerald-400/50',
          glow: 'shadow-[0_0_10px_rgba(52,211,153,0.6)]',
          iconColor: 'text-emerald-400'
        };
      case 'mosaic':
        return {
          style: 'bg-gradient-to-br from-fuchsia-500 to-indigo-600 border-fuchsia-400/50',
          glow: 'shadow-[0_0_10px_rgba(240,73,214,0.6)]',
          iconColor: 'text-fuchsia-400'
        };
      case 'fiber_paper':
        return {
          style: 'bg-gradient-to-r from-orange-400 to-amber-300 border-amber-400/50',
          glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
          iconColor: 'text-amber-400'
        };
      case 'aurora':
        return {
          style: 'bg-gradient-to-tr from-teal-400 via-cyan-500 to-purple-500 border-cyan-300/50',
          glow: 'shadow-[0_0_12px_rgba(34,211,238,0.7)]',
          iconColor: 'text-cyan-400'
        };
      case 'art_deco':
        return {
          style: 'bg-gradient-to-b from-yellow-500 to-amber-600 border-yellow-400/60',
          glow: 'shadow-[0_0_10px_rgba(234,179,8,0.6)]',
          iconColor: 'text-yellow-400'
        };
      case 'waterfall':
        return {
          style: 'bg-green-500/20 border-green-400/70',
          glow: 'shadow-[0_0_12px_rgba(74,222,128,0.8)]',
          iconColor: 'text-green-400 animate-pulse'
        };
      default:
        return {
          style: 'bg-primary border-primary',
          glow: 'shadow-[0_0_10px_rgba(100,255,218,0.5)]',
          iconColor: 'text-primary'
        };
    }
  };


  useLayoutEffect(() => {
    const calculateOrigin = () => {
      if (!gearRef.current || !panelRef.current || !navRef.current) return;

      const gearRect = gearRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      const gearCenterX = gearRect.left + gearRect.width / 2;
      const gearCenterY = gearRect.top + gearRect.height / 2;

      const originX = gearCenterX - panelRect.left;
      const originY = gearCenterY - panelRect.top;

      setTransformOrigin(`${originX}px ${originY}px`);
    };

    const timeoutId = setTimeout(calculateOrigin, 50);
    window.addEventListener('resize', calculateOrigin);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateOrigin);
    };
  }, [gearRef, navRef]);

  const variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1 },
  };

  const navRect = navRef.current?.getBoundingClientRect();

  return (
    <motion.div
      ref={panelRef}
      className="settings-panel"
      style={{
        top: navRect ? navRect.bottom + 16 : '100px',
        left: '50%',
        x: '-50%',
        transformOrigin: transformOrigin,
      }}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ type: 'tween', duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-light-text dark:text-dark-text">{t('settings_title')}</h2>
        <motion.button 
          onClick={onClose} 
          className="p-1 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-primary"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={20} />
        </motion.button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-6">
            {/* APPEARANCE */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">{t('set_appearance') || 'Appearance'}</h3>
                <div className="space-y-5 p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-light-text dark:text-dark-text">{t('set_theme') || 'Theme'}</h4>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{t('set_theme_desc') || 'Switch between light & dark.'}</p>
                        </div>
                        <AnimatedThemeToggle checked={theme === 'dark'} onChange={() => { toggleTheme(); addPoints(5, 'toggle_setting'); }} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-light-text dark:text-dark-text mb-2">{t('set_accent') || 'Accent Color'}</h4>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(accentColorOptions).map(([key, options]) => {
                                const color = options[theme];
                                const isSelected = accentColorName === key;
                                const checkColor = isColorLight(color) ? '#0a192f' : '#ffffff';

                                return (
                                    <motion.button
                                        key={key}
                                        onClick={() => { setAccentColor(key as AccentColorName); addPoints(5, 'toggle_setting'); }}
                                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                                        style={{ 
                                            backgroundColor: color,
                                            borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                            boxShadow: `0 0 0 2px ${isSelected ? 'var(--color-primary)' : 'rgba(0,0,0,0)'}`,
                                        }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        title={options.name}
                                        aria-label={`Set accent color to ${options.name}`}
                                    >
                                        <AnimatePresence>
                                        {isSelected && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                <Check size={16} color={checkColor} strokeWidth={3} />
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-light-border dark:border-dark-card">
                        <SettingToggle
                          label={t('set_uniform') || 'Uniform Theming'}
                          description={t('set_uniform_desc') || 'Apply accent to all elements.'}
                          checked={uniformTheme}
                          onChange={toggleUniformTheme}
                        />
                    </div>
                </div>
            </div>
            {/* BACKGROUND THEME STYLE */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">
                    {t('set_bg_style') || 'Background Style'}
                </h3>
                <div className="p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card space-y-3">
                    <div className="flex flex-col gap-1.5" ref={bgSelectorRef}>
                        <label className="font-semibold text-light-text dark:text-dark-text text-sm mb-1">
                            {t('set_theme') === 'Thème' ? 'Canevas de fond' : 'Active Canvas Background'}
                        </label>
                        
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsBgDropdownOpen(!isBgDropdownOpen)}
                                className="flex items-center justify-between w-full rounded-md border border-light-border dark:border-dark-card/85 bg-light-bg/80 dark:bg-dark-bg/85 px-4 py-3 text-xs font-mono text-light-text dark:text-dark-text hover:border-primary/50 hover:bg-light-bg dark:hover:bg-dark-bg-alt/44 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center justify-center">
                                        <div className={`w-3.5 h-3.5 rounded-full border border-white/20 ${getModeStatusAndTone(activeBgId).style} ${getModeStatusAndTone(activeBgId).glow}`} />
                                        <span className="absolute flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30"></span>
                                        </span>
                                    </div>
                                    <span className="font-semibold tracking-wide text-light-text dark:text-dark-text group-hover:text-primary transition-colors">
                                        {BACKGROUND_MODES.find(m => m.id === activeBgId)?.name || 'Select Background'}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isBgDropdownOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center"
                                >
                                    <ChevronDown size={14} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-primary" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {isBgDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-light-border dark:border-dark-card/90 bg-light-bg-alt/95 dark:bg-[#112240]/95 backdrop-blur-md shadow-2xl z-55 py-1.5 scrollbar-thin scrollbar-thumb-light-border dark:scrollbar-thumb-dark-card scrollbar-track-transparent divide-y divide-light-border/20 dark:divide-dark-card/40"
                                    >
                                        {BACKGROUND_MODES.map((m) => {
                                            const isSelected = m.id === activeBgId;
                                            const tone = getModeStatusAndTone(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSetting('activeBgId', m.id);
                                                        setIsBgDropdownOpen(false);
                                                    }}
                                                    className={`flex flex-col w-full text-left px-4 py-2.5 text-xs font-mono transition-all origin-left ${
                                                        isSelected
                                                            ? 'bg-primary/10 text-primary dark:text-primary font-bold'
                                                            : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg/60 dark:hover:bg-dark-bg/40 hover:text-light-text dark:hover:text-dark-text'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-2.5 h-2.5 rounded-full border border-white/10 ${tone.style} ${tone.glow}`} />
                                                            <span className="truncate">{m.name}</span>
                                                        </div>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="w-4 h-4 bg-primary/20 rounded-full border border-primary flex items-center justify-center shadow-[0_0_8px_rgba(100,255,218,0.35)]"
                                                            >
                                                                <Check size={9} className="text-primary font-bold" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-light-text-secondary/60 dark:text-dark-text-secondary/50 mt-1 line-clamp-1 font-sans pl-[22px]">
                                                        {m.desc}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed mt-1.5 pl-1 italic border-l-2 border-primary/45 dark:border-primary/30">
                            {t('set_bg_style_desc') || (BACKGROUND_MODES.find(m => m.id === activeBgId)?.desc || 'Configure background aesthetic')}
                        </p>
                    </div>
                </div>
            </div>
            {/* LANGUAGE */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">{t('set_language') || 'Language'}</h3>
                <div className="flex justify-between items-center p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card">
                    <div>
                        <h4 className="font-semibold text-light-text dark:text-dark-text">{t('set_interface_lang') || 'Interface Language'}</h4>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{t('set_interface_lang_desc') || 'Switch between EN and FR.'}</p>
                    </div>
                    <LanguageSelector />
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="space-y-6 mt-6 md:mt-0">
             {/* ACCESSIBILITY */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">{t('set_accessibility') || 'Accessibility'}</h3>
                <div className="space-y-5 p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card">
                    <SettingToggle
                        label={t('set_zoomed') || 'Zoomed Mode'}
                        description={t('set_zoomed_desc') || 'Increase text and interface size.'}
                        checked={zoomedMode}
                        onChange={() => handleToggle('zoomedMode')}
                    />
                    <SettingToggle
                        label={t('set_high_contrast') || 'High Contrast Mode'}
                        description={t('set_high_contrast_desc') || 'Improve readability and accessibility.'}
                        checked={highContrastMode}
                        onChange={() => handleToggle('highContrastMode')}
                    />
                </div>
            </div>
             {/* VISUAL EFFECTS */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">{t('set_visuals') || 'Visual Effects'}</h3>
                <div className="space-y-5 p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card">
                     <SettingToggle
                        label={t('set_crt') || 'CRT Scanlines'}
                        description={t('set_crt_desc') || 'Toggle the retro screen effect.'}
                        checked={showCrtLines}
                        onChange={() => handleToggle('showCrtLines')}
                    />
                    <SettingToggle
                        label={t('set_glow') || 'Firewall Mouse Glow'}
                        description={t('set_glow_desc') || 'Toggle the interactive border highlight.'}
                        checked={showFirewallGlow}
                        onChange={() => handleToggle('showFirewallGlow')}
                    />
                    <SettingToggle
                        label={t('set_glitch') || 'Section Title Glitch'}
                        description={t('set_glitch_desc') || 'Toggle the glitch animation on titles.'}
                        checked={showGlitchEffect}
                        onChange={() => handleToggle('showGlitchEffect')}
                    />
                </div>
            </div>
             {/* SYSTEM */}
            <div>
                <h3 className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-3">{t('set_system') || 'System'}</h3>
                 <div className="space-y-5 p-4 rounded-lg bg-light-bg-alt/50 dark:bg-dark-bg/50 border border-light-border dark:border-dark-card">
                    <SettingToggle
                        label={t('set_skip_boot') || 'Skip Boot Sequence'}
                        description={t('set_skip_boot_desc') || 'Bypass startup animation on next visit.'}
                        checked={skipBootSequence}
                        onChange={() => handleToggle('skipBootSequence')}
                    />
                    <div className="pt-4 border-t border-light-border dark:border-dark-card">
                        <h4 className="font-semibold text-light-text dark:text-dark-text mb-2">{t('set_reset_all') || 'Reset All Settings'}</h4>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">{t('set_reset_all_desc') || 'This will restore all appearance, language, and system settings to their defaults.'}</p>
                        <motion.button
                            onClick={resetSettings}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md font-mono text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Power size={14} />
                            {t('set_reset_btn') || 'Reset to Default'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Navigation Component ---
const Header: React.FC = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const scrollDirection = useScrollDirection();
  const navRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  const navItems = navItemsConfig(t);
  const sectionIds = navItems.filter(item => item.type === 'link').map(item => item.id);
  const activeSection = useActiveSection(sectionIds);

  const [isVisible, setIsVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const preventOutsideScroll = (e: TouchEvent | WheelEvent) => {
        const target = e.target as HTMLElement;
        // If the interaction is NOT inside the settings panel, prevent it!
        if (target && !target.closest('.settings-panel')) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      };

      document.addEventListener('touchmove', preventOutsideScroll, { passive: false });
      document.addEventListener('wheel', preventOutsideScroll, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.removeEventListener('touchmove', preventOutsideScroll);
        document.removeEventListener('wheel', preventOutsideScroll);
      };
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    if (scrollDirection === 'down' && window.scrollY > 100) {
      setIsVisible(false);
      setIsSettingsOpen(false);
    } else {
      setIsVisible(true);
    }
  }, [scrollDirection]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 w-full flex items-start justify-center p-4 pointer-events-none"
        variants={{ hidden: { y: '-120%', opacity: 0 }, visible: { y: '0%', opacity: 1 } }}
        initial={false}
        animate={isVisible ? "visible" : "hidden"}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="relative w-full max-w-7xl h-10 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left brand logo */}
          <div className="pointer-events-auto col-start-1 justify-self-start flex flex-row items-center h-full pl-0 md:pl-2">
            {isMobile ? (
              <AngeshLogo size={28} variant="emblem" layoutId="brand-logo" />
            ) : (
              <AngeshLogo size={32} variant="horizontal" layoutId="brand-logo" />
            )}
          </div>

          {/* Centered Navigation */}
          <nav className="pointer-events-auto col-start-2">
            <motion.div
              ref={navRef}
              className="relative flex items-center gap-1 px-2 py-2 rounded-full aetherius-bar"
              animate={{ y: ["0px", "-3.5px", "0px", "2px", "0px"] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                const isSettings = item.id === 'settings';

                if (isSettings) {
                  return (
                    <React.Fragment key="settings-fragment">
                      <div className="w-px h-5 bg-gray-500/30 dark:bg-dark-text-secondary/30 mx-1" />

                      <motion.button
                        key={item.id}
                        ref={gearRef}
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        animate={{ rotate: isSettingsOpen ? 360 : 0 }}
                        transition={{
                          repeat: isSettingsOpen ? Infinity : 0,
                          duration: isSettingsOpen ? 4 : 0.6,
                          ease: isSettingsOpen ? 'linear' : [0.16, 1, 0.3, 1],
                        }}
                        aria-label="Open settings"
                        className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-primary"
                      >
                        <item.icon size={isMobile ? 20 : 18} />
                      </motion.button>
                    </React.Fragment>
                  );
                }

                return (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`relative z-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                      isActive ? 'text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary'
                    } ${isMobile ? 'w-10 h-10' : 'px-3 py-2 text-sm gap-2'}`}
                    whileHover={isActive ? {} : { y: -2 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    <item.icon size={isMobile ? 20 : 16} />
                    {!isMobile && <span className="font-medium">{item.label}</span>}
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="nav-item-highlight"
                        style={{ borderRadius: '9999px' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      />
                    )}
                  </motion.a>
                );
              })}
            </motion.div>
          </nav>
          
          {/* Resume Downloader */}
          <div className="pointer-events-auto col-start-3 justify-self-end lg:pr-4">
            <ResumeDownloader />
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              key="backdrop"
              className="settings-panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setIsSettingsOpen(false)}
            />
            <SettingsPanel
              key="settings-panel"
              onClose={() => setIsSettingsOpen(false)}
              t={t}
              navRef={navRef}
              gearRef={gearRef}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;