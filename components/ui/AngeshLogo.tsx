// Premium Architectural Fluid Ribbon Monogram Brand Module
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { motion } from 'framer-motion';

interface AngeshLogoProps {
  isDarkMode?: boolean;
  size?: number;
  variant?: 'horizontal' | 'emblem';
  layoutId?: string;
  hideText?: boolean;
  delayText?: number;
}

export function AngeshLogo({ isDarkMode, size = 44, variant = 'horizontal', layoutId, hideText = false, delayText = 0 }: AngeshLogoProps) {
  // Use our application's active theme or the explicit override
  const { theme } = useTheme();
  const activeDark = isDarkMode !== undefined ? isDarkMode : theme === 'dark';

  const strokeColor = activeDark ? '#fdfbfa' : '#232b2f';
  const secondaryColor = '#b4ae9c';
  const lineCap = 'round' as any;

  const renderSVG = (svgSize: number) => (
    <motion.svg 
      viewBox="0 0 100 100" 
      width={svgSize} 
      height={svgSize} 
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={{
        hover: {
          scale: 1.05,
          rotate: [0, -2, 2, 0],
          transition: { duration: 0.5, ease: "easeInOut" }
        }
      }}
    >
      {/* Symmetrical and fluid underlay glow paths (Suggestion 3 & 2: Neon Underlay + Ambient Breathe) */}
      <motion.path 
        d="M 30,70 C 30,40 42,24 50,24 C 58,24 70,40 70,70" 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth={14} 
        strokeLinecap={lineCap} 
        strokeLinejoin="round" 
        style={{ filter: "blur(6px)", pointerEvents: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, activeDark ? 0.2 : 0.08, activeDark ? 0.44 : 0.22, activeDark ? 0.2 : 0.08] }}
        transition={{
          times: [0, 0.3, 0.65, 1],
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        variants={{
          hover: {
            opacity: activeDark ? 0.55 : 0.35,
            strokeWidth: 18,
            transition: { duration: 0.3, ease: "easeOut" }
          }
        }}
      />
      <motion.path 
        d="M 80,28 C 62,28 40,36 40,50 C 40,64 62,72 80,72" 
        fill="none" 
        stroke={secondaryColor} 
        strokeWidth={14} 
        strokeLinecap={lineCap} 
        strokeLinejoin="round" 
        style={{ filter: "blur(6px)", pointerEvents: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, activeDark ? 0.24 : 0.12, activeDark ? 0.5 : 0.28, activeDark ? 0.24 : 0.12] }}
        transition={{
          times: [0, 0.3, 0.65, 1],
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
        variants={{
          hover: {
            opacity: activeDark ? 0.6 : 0.4,
            strokeWidth: 18,
            transition: { duration: 0.3, ease: "easeOut" }
          }
        }}
      />

      {/* Symmetrical and fluid foreground paths forming the ribbon system */}
      <motion.path 
        d="M 30,70 C 30,40 42,24 50,24 C 58,24 70,40 70,70" 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth={7.7} 
        strokeLinecap={lineCap} 
        strokeLinejoin="round" 
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut" } },
          hover: {
            strokeWidth: 8.5,
            filter: activeDark ? "drop-shadow(0px 0px 3px rgba(255,255,255,0.25))" : "drop-shadow(0px 0px 3px rgba(0,0,0,0.15))",
            transition: { duration: 0.3 }
          }
        }}
      />
      <motion.path 
        d="M 80,28 C 62,28 40,36 40,50 C 40,64 62,72 80,72" 
        fill="none" 
        stroke={secondaryColor} 
        strokeWidth={7.7} 
        strokeLinecap={lineCap} 
        strokeLinejoin="round" 
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: "easeInOut", delay: 0.2 } },
          hover: {
            strokeWidth: 8.5,
            filter: "drop-shadow(0px 0px 3px rgba(180,174,156,0.35))",
            transition: { duration: 0.3 }
          }
        }}
      />

      {/* Endpoint circles with elastic spring pop-in (Suggestion 5) & Interactive Hover (Suggestion 1) */}
      <motion.circle 
        cx="30" 
        cy="70" 
        r={7.315} 
        fill={strokeColor} 
        variants={{ 
          hidden: { scale: 0, opacity: 0 }, 
          visible: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
              type: "spring", 
              stiffness: 280, 
              damping: 11, 
              delay: 1.2 
            } 
          },
          hover: { 
            scale: 1.35, 
            filter: activeDark ? "drop-shadow(0px 0px 5px rgba(255,255,255,0.7))" : "drop-shadow(0px 0px 5px rgba(0,0,0,0.45))",
            transition: { type: "spring", stiffness: 450, damping: 10 } 
          } 
        }} 
      />
      <motion.circle 
        cx="70" 
        cy="70" 
        r={7.315} 
        fill={strokeColor} 
        variants={{ 
          hidden: { scale: 0, opacity: 0 }, 
          visible: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
              type: "spring", 
              stiffness: 280, 
              damping: 11, 
              delay: 1.1 
            } 
          },
          hover: { 
            scale: 1.35, 
            filter: activeDark ? "drop-shadow(0px 0px 5px rgba(255,255,255,0.7))" : "drop-shadow(0px 0px 5px rgba(0,0,0,0.45))",
            transition: { type: "spring", stiffness: 450, damping: 10 } 
          } 
        }} 
      />
      <motion.circle 
        cx="80" 
        cy="28" 
        r={7.315} 
        fill={secondaryColor} 
        variants={{ 
          hidden: { scale: 0, opacity: 0 }, 
          visible: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
              type: "spring", 
              stiffness: 280, 
              damping: 11, 
              delay: 1.3 
            } 
          },
          hover: { 
            scale: 1.35, 
            filter: "drop-shadow(0px 0px 5px rgba(180,174,156,0.85))",
            transition: { type: "spring", stiffness: 450, damping: 10 } 
          } 
        }} 
      />
      <motion.circle 
        cx="80" 
        cy="72" 
        r={7.315} 
        fill={secondaryColor} 
        variants={{ 
          hidden: { scale: 0, opacity: 0 }, 
          visible: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
              type: "spring", 
              stiffness: 280, 
              damping: 11, 
              delay: 1.4 
            } 
          },
          hover: { 
            scale: 1.35, 
            filter: "drop-shadow(0px 0px 5px rgba(180,174,156,0.85))",
            transition: { type: "spring", stiffness: 450, damping: 10 } 
          } 
        }} 
      />
    </motion.svg>
  );

  if (variant === 'emblem') {
    return (
      <motion.div 
        layoutId={layoutId}
        className="flex items-center justify-center select-none" 
        style={{ width: size, height: size }}
      >
        {renderSVG(size)}
      </motion.div>
    );
  }

  return (
    <motion.div 
      layoutId={layoutId}
      layout="position"
      className="inline-flex items-center select-none cursor-pointer group" 
      style={{ 
        gap: size * 0.22 + 'px',
        fontFamily: '"Space Grotesk", sans-serif'
      }}
      whileHover="hover"
    >
      <motion.div 
        layout="position"
        className="flex-shrink-0 flex items-center justify-center" 
        style={{ width: size, height: size }}
        variants={{
          hover: { scale: 1.05, transition: { duration: 0.4, ease: "easeOut" } }
        }}
      >
        {renderSVG(size)}
      </motion.div>
      {!hideText && (
        <>
          <motion.div 
            layout="position"
            style={{ 
              height: size * 0.65 + 'px', 
              width: '1px', 
              backgroundColor: activeDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              transformOrigin: 'top'
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: delayText + 0.5, ease: "easeOut" }}
            variants={{
              hover: { 
                scaleY: 1.15, 
                backgroundColor: activeDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                transition: { duration: 0.3 } 
              }
            }}
          />
          <motion.div layout="position" className="flex flex-col text-left justify-center">
            <motion.h1 
              className="font-sans font-black tracking-[0.35em] leading-normal" 
              style={{
                fontSize: size * 0.27 + 'px',
                color: strokeColor,
                margin: 0,
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: delayText + 0.7 }}
              variants={{
                hover: { 
                  color: activeDark ? '#ffffff' : '#000000',
                  transition: { duration: 0.3, ease: "easeOut" } 
                }
              }}
            >
              ANGESH CHANDERDIP
            </motion.h1>
            <motion.p 
              className="font-sans font-bold tracking-[0.55em]" 
              style={{
                fontSize: size * 0.1 + 'px',
                color: secondaryColor,
                margin: '2px 0 0 0',
                lineHeight: 1
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.8, x: 0 }}
              transition={{ duration: 0.8, delay: delayText + 0.9 }}
              variants={{
                hover: { 
                  opacity: 1,
                  color: activeDark ? '#f0ebd8' : '#736d5d',
                  transition: { duration: 0.3, ease: "easeOut" } 
                }
              }}
            >
              SOFTWARE ENGINEER
            </motion.p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
