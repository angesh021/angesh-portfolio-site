import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import DecompilingText from '../ui/DecompilingText';
import StatusIndicator from '../ui/StatusIndicator';
import CertificationBadges from '../ui/CertificationBadges';
import SocialLinksBar from '../ui/SocialLinksBar';

// --- Helper Components ---

/**
 * A sub-component for interactive data points on the HUD.
 * Displays a tooltip on click, and closes on outside click or scroll.
 */
const HudDataPoint: React.FC<{
    text: string;
    tooltipText: string;
    className?: string;
}> = ({ text, tooltipText, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Effect to close tooltip on outside click or scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            setIsOpen(false);
        };

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Cleanup function
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isOpen]); // Re-run effect when isOpen changes

    return (
        <div
            ref={wrapperRef}
            className={`hud-text absolute ${className || ''}`}
        >
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="font-mono text-xs text-primary bg-transparent border-none p-0 cursor-pointer"
                whileHover={{ textShadow: '0 0 8px #64ffda', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Toggle details for ${text}`}
                aria-expanded={isOpen}
            >
                {text}
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="hud-tooltip"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        role="tooltip"
                    >
                        {tooltipText}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


/**
 * Renders the profile picture as a "Threat Analysis HUD". This features
 * a multi-layered, interactive display with a scanner, rings, and parallax effects.
 */
const ThreatAnalysisHudProfile: React.FC = () => {
    const { t } = useI18n();
    const prefersReducedMotion = useReducedMotion();
    const imageSrc = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Linkedin%20crop.jpeg";

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothMouseX = useSpring(mouseX, { stiffness: 100, damping: 20, mass: 0.5 });
    const smoothMouseY = useSpring(mouseY, { stiffness: 100, damping: 20, mass: 0.5 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (prefersReducedMotion) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left - width / 2;
        const y = e.clientY - top - height / 2;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const invX = useTransform(smoothMouseX, v => prefersReducedMotion ? 0 : -v);
    const invY = useTransform(smoothMouseY, v => prefersReducedMotion ? 0 : -v);

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="hud-container-parent relative w-[340px] h-[380px] md:w-[420px] md:h-[480px] lg:w-[480px] lg:h-[550px] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="hud-container relative w-full h-full" style={{ perspective: 1200 }}>
                {/* Main Hexagon Image - applying clipping directly to the image */}
                <motion.div
                    className="absolute w-full h-full"
                    style={{ x: invX, y: invY, z: 20 }}
                >
                    <div className="w-full h-full relative">
                         <img src={imageSrc} alt="Angesh Chanderdip Profile" className="w-full h-full object-cover hex-clip" />
                    </div>
                </motion.div>

                {/* Decorative Brackets with more parallax */}
                <motion.div
                  className="absolute w-full h-full"
                  style={{ x: useTransform(invX, v => v * 0.25), y: useTransform(invY, v => v * 0.25), z: 50 }}
                >
                    <div className="hud-bracket" style={{ top: '18%', left: '0%', borderWidth: '2px 0 0 2px' }}></div>
                    <div className="hud-bracket" style={{ top: '18%', right: '0%', borderWidth: '2px 2px 0 0' }}></div>
                    <div className="hud-bracket" style={{ bottom: '18%', left: '0%', borderWidth: '0 0 2px 2px' }}></div>
                    <div className="hud-bracket" style={{ bottom: '18%', right: '0%', borderWidth: '0 2px 2px 0' }}></div>
                </motion.div>

                {/* Scanner Line */}
                <div className="hud-scanner" style={{ animationPlayState: prefersReducedMotion ? 'paused' : 'running' }} />

                {/* Data Points - repositioned for hex shape */}
                <HudDataPoint
                    text={t('hud_id_label') || "ID: A.CHANDERDIP"}
                    tooltipText={t('hud_id_tooltip') || "Identity Verified"}
                    className="top-2 left-1/2 -translate-x-1/2"
                />
                <HudDataPoint
                    text={t('hud_status_label') || "STATUS: SECURE"}
                    tooltipText={t('hud_status_tooltip') || "All systems nominal"}
                    className="bottom-2 left-1/2 -translate-x-1/2"
                />
                <HudDataPoint
                    text={t('hud_threat_label') || "THREAT LVL: 0.0"}
                    tooltipText={t('hud_threat_tooltip') || "No active threats detected"}
                    className="top-[48%] -left-4"
                />
                <HudDataPoint
                    text={t('hud_sys_label') || "SYS: AETHERIUS_OS"}
                    tooltipText={t('hud_sys_tooltip') || "Custom Secure Operating System"}
                    className="top-[48%] -right-8 text-right"
                />
            </div>
        </motion.div>
    );
};


// --- Main Hero Section Component ---
const HeroSection: React.FC = () => {
  const { t, language } = useI18n();
  const [animationComplete, setAnimationComplete] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Reset animation complete state when language changes so DecompilingText can run again properly
  useEffect(() => {
    setAnimationComplete(false);
  }, [language]);

  const linesConfig = [
    { text: t('hero_greeting'), className: 'font-mono text-primary mb-4' },
    { text: t('hero_name'), className: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-dark-text mb-4' },
    { text: t('hero_subtitle'), className: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark-text-secondary mb-8' },
  ];

  return (
    <>
      <section ref={containerRef} id="hero" className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-32 lg:pb-40">
        
        <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-16 w-full items-start">
                
                {/* Right Column - Profile HUD & Social Links */}
                <div className="relative z-0 md:col-span-2 flex flex-col items-center justify-start md:order-last">
                    <ThreatAnalysisHudProfile />
                    <SocialLinksBar />
                </div>
                
                {/* Left Column - Text content & Certifications */}
                <div className="relative z-10 md:col-span-3 text-center md:text-left md:order-first">
                    <DecompilingText key={language} linesConfig={linesConfig} onComplete={() => setAnimationComplete(true)} />

                    <motion.div
                        className="flex flex-col items-center md:items-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                            opacity: animationComplete ? 1 : 0, 
                            y: animationComplete ? 0 : 20 
                        }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: 0.2 }}
                        style={{ pointerEvents: animationComplete ? 'auto' : 'none' }}
                        aria-hidden={!animationComplete}
                    >
                        <StatusIndicator />
                        <p className="max-w-xl text-dark-text-secondary mb-12">
                            {t('hero_description')}
                        </p>
                        <CertificationBadges />
                    </motion.div>
                </div>
            </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;