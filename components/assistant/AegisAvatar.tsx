import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { AIOrb, AIOrbState, AIOrbEmotion } from "./AIOrb";

export type AegisAvatarState = AIOrbState | "recruiter";
export type AegisAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AegisAvatarHandle {
  triggerShieldLock: () => void;
  triggerThreatAlert: () => void;
  triggerNod: () => void;
  triggerCelebration: () => void;
  triggerDoubleTake: () => void;
  setCuriousTilt: (angle: number) => void;
  setSpeechEnergy: (energy: number) => void;
  setStreaming: (streaming: boolean) => void;
  setNoCircleBorder: (enabled: boolean) => void;
  getOrb: () => AIOrb | null;
}

export interface AegisAvatarProps {
  state?: AegisAvatarState;
  emotion?: AIOrbEmotion;
  isThinking?: boolean;
  isStreaming?: boolean;
  isRecording?: boolean;
  isSpeaking?: boolean;
  isTyping?: boolean;
  isError?: boolean;
  isHappy?: boolean;
  isSleeping?: boolean;
  wireframeMode?: boolean;
  recruiterMode?: boolean;
  size?: AegisAvatarSize;
  pixelSize?: number;
  curiousTilt?: number;
  speechEnergy?: number;
  showStatusBadge?: boolean;
  showWaveform?: boolean;
  noCircleBorder?: boolean;
  className?: string;
  onClick?: () => void;
}

// Pixel dimensions mapping per size variant
const SIZE_MAP: Record<AegisAvatarSize, number> = {
  xs: 32,
  sm: 42,
  md: 56,
  lg: 180,
  xl: 240,
};

// Particle count tuning for optimal performance across sizes
const PARTICLE_COUNT_MAP: Record<AegisAvatarSize, number> = {
  xs: 25,
  sm: 35,
  md: 55,
  lg: 100,
  xl: 125,
};

export const AegisAvatar = forwardRef<AegisAvatarHandle, AegisAvatarProps>(({
  state: explicitState,
  emotion = "neutral",
  isThinking = false,
  isStreaming = false,
  isRecording = false,
  isSpeaking = false,
  isTyping = false,
  isError = false,
  isHappy = false,
  isSleeping = false,
  wireframeMode = false,
  recruiterMode = false,
  size = "lg",
  pixelSize,
  curiousTilt = 0,
  speechEnergy = 0,
  showStatusBadge = false,
  showWaveform = false,
  noCircleBorder = false,
  className = "",
  onClick,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<AIOrb | null>(null);

  // Imperative handle for parent components
  useImperativeHandle(ref, () => ({
    triggerShieldLock: () => orbRef.current?.triggerShieldLock(),
    triggerThreatAlert: () => orbRef.current?.triggerThreatAlert(),
    triggerNod: () => orbRef.current?.triggerNod(),
    triggerCelebration: () => orbRef.current?.triggerCelebrationSpark(),
    triggerDoubleTake: () => orbRef.current?.triggerDoubleTake(),
    setCuriousTilt: (angle: number) => orbRef.current?.setCuriousTilt(angle),
    setSpeechEnergy: (energy: number) => orbRef.current?.setSpeechEnergy(energy),
    setStreaming: (streaming: boolean) => orbRef.current?.setStreaming(streaming),
    setNoCircleBorder: (enabled: boolean) => orbRef.current?.setNoCircleBorder(enabled),
    getOrb: () => orbRef.current,
  }));

  // Compute resolved target pixel size
  const targetSize = pixelSize || SIZE_MAP[size] || 180;

  // Determine active AIOrb animation state
  let orbState: AIOrbState = "idle";
  if (explicitState && explicitState !== "recruiter") {
    orbState = explicitState;
  } else if (isError) {
    orbState = "error";
  } else if (isHappy) {
    orbState = "happy";
  } else if (isThinking) {
    orbState = "thinking";
  } else if (isStreaming || isSpeaking) {
    orbState = "speaking";
  } else if (isRecording || isTyping) {
    orbState = "listening";
  } else if (isSleeping) {
    orbState = "sleep";
  } else if (explicitState === "recruiter" || recruiterMode) {
    orbState = "idle";
  } else {
    orbState = "idle";
  }

  // Initialize and mount AIOrb instance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous children if any
    container.innerHTML = "";

    const orb = new AIOrb(container, {
      size: targetSize,
      particleCount: PARTICLE_COUNT_MAP[size] || 90,
      background: "transparent",
      wireframeMode,
      noCircleBorder,
    });

    orb.setState(orbState);
    if (emotion !== "neutral") {
      orb.setEmotion(emotion);
    }
    orbRef.current = orb;

    return () => {
      orb.destroy();
      orbRef.current = null;
    };
  }, [targetSize, size, noCircleBorder]);

  // Synchronize wireframe mode changes dynamically
  useEffect(() => {
    if (orbRef.current && wireframeMode !== undefined) {
      orbRef.current.setWireframeMode(wireframeMode);
    }
  }, [wireframeMode]);

  // Synchronize noCircleBorder mode changes dynamically
  useEffect(() => {
    if (orbRef.current && noCircleBorder !== undefined) {
      orbRef.current.setNoCircleBorder(noCircleBorder);
    }
  }, [noCircleBorder]);

  // Synchronize state changes dynamically
  useEffect(() => {
    if (orbRef.current && orbRef.current.getState() !== orbState) {
      orbRef.current.setState(orbState);
    }
  }, [orbState]);

  // Synchronize emotion micro-expressions dynamically
  useEffect(() => {
    if (orbRef.current && emotion) {
      orbRef.current.setEmotion(emotion);
    }
  }, [emotion]);

  // Synchronize curious tilt while user is typing or on hover
  useEffect(() => {
    if (orbRef.current) {
      orbRef.current.setTyping(isTyping);
    }
  }, [isTyping]);

  // Synchronize curious head-tilt angle
  useEffect(() => {
    if (orbRef.current && curiousTilt !== undefined) {
      orbRef.current.setCuriousTilt(curiousTilt);
    }
  }, [curiousTilt]);

  // Synchronize code streaming visor matrix
  useEffect(() => {
    if (orbRef.current) {
      orbRef.current.setStreaming(isStreaming);
    }
  }, [isStreaming]);

  // Synchronize speech syllable energy
  useEffect(() => {
    if (orbRef.current && speechEnergy !== undefined) {
      orbRef.current.setSpeechEnergy(speechEnergy);
    }
  }, [speechEnergy]);

  const handleClick = () => {
    orbRef.current?.triggerNod();
    if (onClick) {
      onClick();
    }
  };

  // Theme styling for ambient halo & status badge
  const stateThemes = {
    idle: {
      halo: "bg-purple-600/20 shadow-[0_0_32px_rgba(147,51,234,0.35)]",
      borderColor: "border-purple-500/40",
      glowColor: "#9859ff",
      badgeDot: "bg-indigo-400",
      statusText: recruiterMode ? "Recruiter Mode" : "",
      statusColor: "text-purple-300 border-purple-500/30 bg-purple-950/60",
    },
    listening: {
      halo: "bg-sky-500/30 shadow-[0_0_40px_rgba(56,189,248,0.55)]",
      borderColor: "border-sky-400/60",
      glowColor: "#38bdf8",
      badgeDot: "bg-sky-400",
      statusText: "Listening",
      statusColor: "text-sky-200 border-sky-400/40 bg-sky-950/70 shadow-[0_0_15px_rgba(56,189,248,0.25)]",
    },
    thinking: {
      halo: "bg-purple-600/25 shadow-[0_0_36px_rgba(147,51,234,0.4)]",
      borderColor: "border-purple-500/50",
      glowColor: "#a855f7",
      badgeDot: "bg-purple-400",
      statusText: "Analyzing",
      statusColor: "text-purple-200 border-purple-400/40 bg-purple-950/70 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    },
    speaking: {
      halo: "bg-purple-500/40 shadow-[0_0_44px_rgba(168,85,247,0.7)]",
      borderColor: "border-purple-400/70",
      glowColor: "#c084fc",
      badgeDot: "bg-purple-400",
      statusText: "Responding",
      statusColor: "text-purple-200 border-purple-400/40 bg-purple-950/70 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
    },
    happy: {
      halo: "bg-emerald-500/35 shadow-[0_0_36px_rgba(16,185,129,0.5)]",
      borderColor: "border-emerald-400/60",
      glowColor: "#34d399",
      badgeDot: "bg-emerald-400",
      statusText: "Satisfied",
      statusColor: "text-emerald-200 border-emerald-400/40 bg-emerald-950/70 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
    },
    error: {
      halo: "bg-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.6)]",
      borderColor: "border-rose-400/70",
      glowColor: "#fb7185",
      badgeDot: "bg-rose-400",
      statusText: "Notice",
      statusColor: "text-rose-200 border-rose-400/40 bg-rose-950/70 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
    },
    sleep: {
      halo: "bg-indigo-950/20 shadow-[0_0_24px_rgba(79,70,229,0.2)]",
      borderColor: "border-indigo-500/25",
      glowColor: "#6366f1",
      badgeDot: "bg-indigo-400/60",
      statusText: "Resting",
      statusColor: "text-indigo-400/80 border-indigo-500/20 bg-indigo-950/50",
    },
    dizzy: {
      halo: "bg-amber-500/35 shadow-[0_0_36px_rgba(245,158,11,0.5)]",
      borderColor: "border-amber-400/60",
      glowColor: "#facc15",
      badgeDot: "bg-amber-400",
      statusText: "Dizzy",
      statusColor: "text-amber-200 border-amber-400/40 bg-amber-950/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
    },
  }[orbState];

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
    >
      {/* Outer Glow & Shell Wrapper */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: targetSize, height: targetSize }}
      >
        {/* Soft Ambient Radial Blur Halo */}
        <motion.div
          className={`absolute inset-0 ${noCircleBorder ? "rounded-2xl" : "rounded-full"} filter blur-xl ${stateThemes.halo}`}
          animate={{
            scale:
              orbState === "speaking"
                ? [1, 1.22, 1.05, 1.16, 1]
                : orbState === "thinking"
                ? [1, 1.16, 1.04, 1.12, 1]
                : [1, 1.06, 1],
            opacity: orbState === "idle" ? [0.4, 0.65, 0.4] : orbState === "thinking" ? [0.65, 0.95, 0.65] : [0.7, 0.95, 0.7],
          }}
          transition={{
            duration:
              orbState === "speaking"
                ? 0.7
                : orbState === "thinking"
                ? 1.0
                : 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulse Shockwave Ring when active listening, speaking or thinking */}
        {(orbState === "listening" || orbState === "speaking" || orbState === "thinking") && (
          <motion.div
            className={`absolute inset-0 ${noCircleBorder ? "rounded-2xl" : "rounded-full"} border border-current pointer-events-none opacity-50`}
            style={{ color: stateThemes.glowColor }}
            animate={{ scale: [1, 1.25, 1.45], opacity: [0.65, 0.25, 0] }}
            transition={{ duration: orbState === "thinking" ? 1.1 : 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        {/* Refined Outer Circular Orbital Ring when in circular mode */}
        {!noCircleBorder && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-all duration-300 z-10"
            style={{
              border: "1px solid rgba(168, 85, 247, 0.4)",
              boxShadow: "0 0 24px rgba(139, 92, 246, 0.3), inset 0 0 16px rgba(168, 85, 247, 0.15)",
            }}
          />
        )}

        {/* Canvas Mount Container */}
        <div
          ref={containerRef}
          className={`relative ${noCircleBorder ? "rounded-2xl" : "rounded-full"} flex items-center justify-center overflow-visible transition-transform duration-300 group-hover:scale-105 z-20`}
          style={{ width: targetSize, height: targetSize }}
        />
      </div>

      {/* Optional Audio Waveform Visualizer - Absolute to prevent shifting avatar container / surrounding content */}
      {showWaveform &&
        (orbState === "speaking" || orbState === "listening") && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 z-20 pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full"
                style={{ backgroundColor: stateThemes.glowColor }}
                animate={{
                  height: ["4px", `${10 + (i % 3) * 6}px`, "3px"],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 0.3 + i * 0.07,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

      {/* State indicator positioned neatly right below avatar */}
      {showStatusBadge && (size === "lg" || size === "xl") && (orbState !== "idle") && stateThemes.statusText && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20 select-none whitespace-nowrap pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`px-3 py-1 rounded-full border text-[11px] font-mono font-semibold tracking-wider flex items-center gap-2 backdrop-blur-md ${stateThemes.statusColor}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${stateThemes.badgeDot} animate-pulse shadow-[0_0_8px_currentColor]`}
            />
            <span>{stateThemes.statusText.toUpperCase()}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
});

AegisAvatar.displayName = "AegisAvatar";

export default AegisAvatar;
