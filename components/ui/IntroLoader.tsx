import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AngeshLogo } from './AngeshLogo';

interface IntroLoaderProps {
  onComplete: () => void;
}

type AnimationPhase = 'center-no-text' | 'center-text' | 'header-pos' | 'fading';

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>('center-no-text');

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Stage 1: Logo creation drawing finishes in 1.6s, then reveal the name with a smooth slide/fade in.
    const textTimer = setTimeout(() => {
      setPhase('center-text');
    }, 1600);

    // Stage 2: Logo and name are fully visible, now fly the logo to the header position.
    const flyTimer = setTimeout(() => {
      setPhase('header-pos');
    }, 3000);

    // Stage 3: Logo settled in header position, fade out the background.
    const fadeTimer = setTimeout(() => {
      setPhase('fading');
    }, 4000);

    // Stage 4: Animation complete. Remove the loader entirely and let the live header take over.
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4850);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(flyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[200] overflow-hidden select-none ${phase === 'fading' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      {/* Dark Executive Matte Background */}
      <motion.div
        className="absolute inset-0 bg-[#0c1626]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.045'/%3E%3C/svg%3E\")"
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'fading' ? 0 : 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Logo container/wrapper with shared layoutId */}
      <div className="absolute inset-0 flex items-start justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-7xl h-full">
          <div 
            className={
              (phase === 'center-no-text' || phase === 'center-text')
                ? 'absolute inset-0 flex items-center justify-center p-6'
                : 'relative w-full h-10 grid grid-cols-[1fr_auto_1fr] items-center'
            }
          >
            <div 
              className={
                (phase === 'center-no-text' || phase === 'center-text')
                  ? 'flex items-center justify-center'
                  : 'col-start-1 justify-self-start flex flex-row items-center h-full pl-0 md:pl-2'
              }
            >
              <motion.div
                layout
                layoutId="brand-logo-wrapper"
                transition={{
                  layout: { type: 'spring', stiffness: 75, damping: 18, mass: 1.1 },
                  // Beautiful parabolic curve: snappy vertical lift, soft horizontal glide
                  x: { type: 'spring', stiffness: 40, damping: 24, mass: 1.4 },
                  y: { type: 'spring', stiffness: 130, damping: 14, mass: 0.7 }
                }}
                className="flex items-center justify-center"
              >
                <AngeshLogo
                  size={
                    (phase === 'center-no-text' || phase === 'center-text')
                      ? (isMobile ? 44 : 64)
                      : (isMobile ? 28 : 32)
                  }
                  variant={
                    (phase === 'center-no-text' || phase === 'center-text')
                      ? 'horizontal'
                      : (isMobile ? 'emblem' : 'horizontal')
                  }
                  hideText={phase === 'center-no-text'}
                  delayText={0}
                  layoutId="brand-logo"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
