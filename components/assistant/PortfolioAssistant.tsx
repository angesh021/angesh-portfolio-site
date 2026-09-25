import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  X,
  RefreshCw,
  ChevronRight,
  Download,
  User,
  UserCheck,
  Check,
  FileText,
  Mail,
  Globe,
  ArrowUp,
  Shield,
  Trash2,
  Settings,
  Plus,
  Lock,
  Sparkles,
  Folder,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  Activity,
  Radio,
  Cpu,
  Database,
  Zap,
  Calendar,
  ExternalLink,
  ArrowDown
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { AegisAvatar, AegisAvatarHandle } from "./AegisAvatar";
import {
  loadAssistantSession,
  saveAssistantSession,
  clearAssistantSession,
} from "../../lib/assistantStorage";

// Project Slugs mapping
const PROJECT_NAMES: Record<string, string> = {
  "enterprise-nac-lab": "Enterprise NAC Lab",
  "ise-monitoring": "ISE Monitoring & Alerting System"
};

// Animated Audio Waveform Visualizer
const AudioWaveformVisualizer = ({
  isActive = false,
  type = "speaking",
  className = ""
}: {
  isActive?: boolean;
  type?: "mic" | "speaking" | "thinking";
  className?: string;
}) => {
  if (!isActive) return null;

  const barCount = 5;
  const barColors = {
    mic: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
    speaking: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    thinking: "bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
  }[type];

  return (
    <div className={`flex items-center justify-center gap-1 h-5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.span
          key={i}
          className={`w-1 rounded-full ${barColors}`}
          animate={{
            height: ["6px", `${12 + (i % 3) * 6}px`, "4px"],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.35 + (i * 0.08),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Mini Circular Token Ring Meter (Next to Send Button)
const CircularTokenRingMeter = ({
  currentInputText = "",
  totalTokensUsed = 0,
  maxContextLimit = 32000,
  isFr = false,
  engine = "gemini",
}: {
  currentInputText?: string;
  totalTokensUsed?: number;
  maxContextLimit?: number;
  isFr?: boolean;
  engine?: "gemini" | "rag";
}) => {
  // Approximate input tokens: ~4 characters per token
  const estimatedInputTokens = Math.ceil(currentInputText.length / 4);
  const totalCombined = totalTokensUsed + estimatedInputTokens;
  const percentage = Math.min(100, Math.max(0.8, (totalCombined / maxContextLimit) * 100));

  // Ring geometry
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Dynamic color coding based on threshold or engine
  let strokeColor = engine === "rag" ? "#06b6d4" : "#a855f7"; // cyan for rag, purple for gemini
  let glowColor = engine === "rag" ? "rgba(6, 182, 212, 0.45)" : "rgba(168, 85, 247, 0.45)";
  
  if (percentage > 85) {
    strokeColor = "#f43f5e"; // red
    glowColor = "rgba(244, 63, 94, 0.5)";
  } else if (percentage > 60) {
    strokeColor = "#fbbf24"; // amber
    glowColor = "rgba(251, 191, 36, 0.45)";
  }

  const tooltipText = isFr
    ? `Contexte de jetons: ~${totalCombined.toLocaleString()} / ${(maxContextLimit / 1000).toFixed(0)}k (${percentage.toFixed(1)}%) • Moteur: ${engine === 'rag' ? 'RAG Vectoriel' : 'Gemini AI'}`
    : `Token Context Window: ~${totalCombined.toLocaleString()} / ${(maxContextLimit / 1000).toFixed(0)}k (${percentage.toFixed(1)}%) • Engine: ${engine === 'rag' ? 'Vector RAG' : 'Gemini AI'}`;

  return (
    <div
      className="relative flex items-center justify-center cursor-help group select-none"
      title={tooltipText}
    >
      <svg className="w-7 h-7 -rotate-90 transform" viewBox="0 0 30 30">
        {/* Background track circle */}
        <circle
          cx="15"
          cy="15"
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="2.4"
          fill="none"
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx="15"
          cy="15"
          r={radius}
          stroke={strokeColor}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 3px ${glowColor})`,
          }}
        />
      </svg>

      {/* Center Zap / Activity Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Zap
          size={10}
          className={`transition-colors duration-300 ${
            estimatedInputTokens > 0
              ? "text-purple-300 animate-pulse"
              : engine === "rag"
              ? "text-cyan-300"
              : totalTokensUsed > 0
              ? "text-purple-300"
              : "text-gray-500"
          }`}
        />
      </div>

      {/* Floating Hover Mini Badge */}
      <div className="absolute -top-7 right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
        <div className="bg-[#0b0f19] border border-white/15 px-2 py-0.5 rounded text-[9px] font-mono text-purple-200 whitespace-nowrap shadow-xl flex items-center gap-1">
          {engine === 'rag' && <span className="text-cyan-400 font-semibold">RAG •</span>}
          <span>~{totalCombined} tok</span>
        </div>
      </div>
    </div>
  );
};

// Clean Markdown text renderer for assistant responses with deep link and URL support
const renderFormattedText = (rawText: string, onNavigate?: (target: string) => void) => {
  if (!rawText) return null;
  
  // Clean up any stray markdown headers like ### or ## or ** at line starts
  const cleanText = rawText.replace(/#{1,6}\s*/g, '');

  // Split into paragraph blocks
  const paragraphs = cleanText.split(/\n\n+/);

  // Helper to parse bold and markdown links: [Label](url_or_#hash)
  const parseInlineElements = (text: string, baseKey: string) => {
    // Regex matches [label](url_or_hash) OR **bold**
    const tokenRegex = /(\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, pIdx) => {
      const key = `${baseKey}-${pIdx}`;
      if (!part) return null;

      // Handle Markdown Link: [label](target)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (linkMatch) {
        const linkLabel = linkMatch[1];
        const linkTarget = linkMatch[2].trim();
        const isAnchor = linkTarget.startsWith('#') || linkTarget.startsWith('/#');

        return (
          <button
            key={key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (isAnchor && onNavigate) {
                onNavigate(linkTarget);
              } else if (isAnchor) {
                const elId = linkTarget.replace('/#', '').replace('#', '');
                const el = document.getElementById(elId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.open(linkTarget, '_blank', 'noopener,noreferrer');
              }
            }}
            className="inline-flex items-center gap-0.5 text-cyan-300 hover:text-cyan-200 underline underline-offset-2 font-medium hover:opacity-90 transition-opacity cursor-pointer mx-0.5"
          >
            <span>{linkLabel}</span>
            {isAnchor ? (
              <ChevronRight size={11} className="inline opacity-70" />
            ) : (
              <ExternalLink size={10} className="inline opacity-70" />
            )}
          </button>
        );
      }

      // Handle **bold**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed);
              const bulletContent = isBullet ? trimmed.replace(/^([•\-\*]|\d+\.)\s*/, '') : line;

              const formattedContent = parseInlineElements(isBullet ? bulletContent : line, `l-${pIdx}-${lIdx}`);

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 my-1 pl-1">
                    <span className="text-purple-400 font-bold text-xs select-none">•</span>
                    <span className="flex-1 text-gray-200">{formattedContent}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className={lIdx > 0 ? "mt-1 text-gray-200" : "text-gray-200"}>
                  {formattedContent}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Custom interactive diamond sparkle star icon
const DiamondStarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] ${className}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 0L15.3 8.7L24 12L15.3 15.3L12 24L8.7 15.3L0 12L8.7 8.7L12 0Z"
      fill="url(#sparkle-grad)"
    />
    <defs>
      <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

// ==========================================
// PREVIEW WIDGET: Mini Network Topology Map
// ==========================================
const MiniNetworkTopology: React.FC = () => {
  return (
    <div className="bg-[#05070c] border border-white/[0.04] rounded-xl p-3 flex flex-col justify-between h-[95px] w-full relative overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] text-purple-400 uppercase tracking-wider font-semibold">AAA NAC Access Topology</span>
        <span className="flex h-1 w-1 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1 w-1 bg-[#8B5CF6]"></span>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center py-1">
        <svg className="w-full h-full max-h-[55px]" viewBox="0 0 200 90" fill="none">
          {/* Connection Lines */}
          <path d="M30 45 H90" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="2 2" className="opacity-30" />
          <path d="M90 45 L150 25" stroke="#8B5CF6" strokeWidth="1" className="opacity-40" />
          <path d="M90 45 L150 65" stroke="#8B5CF6" strokeWidth="1" className="opacity-40" />

          {/* Animated auth signal */}
          <motion.circle
            r="2"
            fill="#C084FC"
            initial={{ cx: 30, cy: 45 }}
            animate={{ cx: [30, 90, 150, 90, 30] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />

          {/* Client Laptop Node */}
          <g transform="translate(15, 30)">
            <rect width="20" height="20" rx="3" fill="#0C0F17" stroke="#8B5CF6" strokeWidth="1" />
            <text x="10" y="13" fill="#fff" fontSize="8" textAnchor="middle">💻</text>
          </g>

          {/* Switch Node */}
          <g transform="translate(80, 30)">
            <rect width="20" height="20" rx="3" fill="#0C0F17" stroke="#FF9500" strokeWidth="1" />
            <text x="10" y="13" fill="#fff" fontSize="8" textAnchor="middle">🔌</text>
          </g>

          {/* Cisco ISE Node */}
          <g transform="translate(140, 15)">
            <rect width="20" height="18" rx="3" fill="#0C0F17" stroke="#34C759" strokeWidth="1" />
            <text x="10" y="12" fill="#fff" fontSize="7" textAnchor="middle">🛡️</text>
          </g>

          {/* Active Directory Node */}
          <g transform="translate(140, 55)">
            <rect width="20" height="18" rx="3" fill="#0C0F17" stroke="#AF52DE" strokeWidth="1" />
            <text x="10" y="12" fill="#fff" fontSize="7" textAnchor="middle">🔑</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// ==========================================
// PREVIEW WIDGET: Mini SOC SIEM Alerts Panel
// ==========================================
const MiniSecurityOperationsDashboard: React.FC = () => {
  const [threatScore, setThreatScore] = useState(96);
  const [lastAlert, setLastAlert] = useState("Containment pushed to Switch Port");

  useEffect(() => {
    const logs = [
      "RADIUS accept: host-04",
      "Posture success: compliance",
      "SIEM ingest: 12 events",
      "Threat Mitigation Active",
      "Port quarantine applied"
    ];

    const interval = setInterval(() => {
      setThreatScore((prev) => Math.max(90, Math.min(100, prev + (Math.random() > 0.5 ? 1 : -1))));
      setLastAlert(logs[Math.floor(Math.random() * logs.length)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#05070c] border border-white/[0.04] rounded-xl p-3 flex flex-col justify-between h-[95px] w-full relative overflow-hidden shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] text-indigo-400 uppercase tracking-wider font-semibold">SIEM Incident Log</span>
        <span className="flex h-1 w-1 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1 w-1 bg-[#FF3B30]"></span>
        </span>
      </div>

      <div className="flex items-center gap-2 py-1 flex-1">
        {/* Animated donut pie chart */}
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#34C759"
              strokeWidth="3.5"
              strokeDasharray={`${threatScore} ${100 - threatScore}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-sans font-bold text-[7.5px] text-white leading-none">{threatScore}%</span>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex-1 flex flex-col gap-0.5 justify-center">
          <div className="flex items-center justify-between text-[6.5px] font-mono">
            <span className="text-gray-400">Mitigation</span>
            <span className="text-[#34C759] font-bold">100% Ok</span>
          </div>
          <div className="w-full bg-white/[0.03] h-0.5 rounded-full overflow-hidden">
            <div className="bg-[#34C759] h-full rounded-full w-full" />
          </div>

          <div className="flex items-center justify-between text-[6.5px] font-mono">
            <span className="text-gray-400">Rate</span>
            <span className="text-white font-bold">14.2 evt/s</span>
          </div>
        </div>
      </div>

      <p className="font-mono text-[6.5px] text-[#FF9500] truncate flex items-center gap-0.5 mt-0.5">
        <span className="animate-pulse">●</span>
        <span>{lastAlert}</span>
      </p>
    </div>
  );
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25
    }
  }
};

interface MessageItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  showWidgets?: boolean;
  contextualChips?: string[];
  hasError?: boolean;
  telemetry?: AssistantTelemetry;
}

// Helper to parse actions
interface ParsedMessage {
  textWithoutActions: string;
  actions: { type: string; payload: string }[];
}

const parseMessageActions = (text: string): ParsedMessage => {
  const actions: { type: string; payload: string }[] = [];
  const actionRegex = /\[ACTION:\s*([^:]+):([^\]]+)\]/g;
  let match;
  let textWithoutActions = text;

  while ((match = actionRegex.exec(text)) !== null) {
    actions.push({
      type: match[1].trim(),
      payload: match[2].trim()
    });
  }

  const actionSimpleRegex = /\[ACTION:\s*([^:\]]+)\]/g;
  while ((match = actionSimpleRegex.exec(text)) !== null) {
    if (!match[0].includes(":")) {
      actions.push({
        type: match[1].trim(),
        payload: ""
      });
    }
  }

  textWithoutActions = textWithoutActions.replace(/\[ACTION:\s*[^\]]+\]/g, "").trim();
  return { textWithoutActions, actions };
};

// Helper for contextual chip generation based on current discussion
const getContextualFollowups = (query: string, reply: string, isFr: boolean): string[] => {
  const q = query.toLowerCase();
  const r = reply.toLowerCase();
  
  if (q.includes("project") || q.includes("projet") || r.includes("project") || r.includes("projet")) {
    return isFr 
      ? ["Détails sur Enterprise NAC Lab", "Comment fonctionne l'alerte ISE ?", "Quelles sont tes certifications ?"]
      : ["Enterprise NAC Lab details", "How does ISE alerting work?", "What certifications do you have?"];
  }
  if (q.includes("skill") || q.includes("compétence") || r.includes("skill") || r.includes("compétence")) {
    return isFr
      ? ["Expérience SIEM Wazuh ?", "Scripting d'automatisation ?", "Télécharger le CV"]
      : ["Wazuh SIEM experience?", "Security automation scripts?", "Download resume"];
  }
  if (q.includes("ise") || r.includes("ise") || q.includes("nac") || r.includes("nac")) {
    return isFr
      ? ["Expliquer la Posture 802.1X", "Intégration Active Directory", "Télécharger mon CV"]
      : ["Explain 802.1X Posture", "Active Directory integration", "Download my CV"];
  }
  if (q.includes("recruiter") || q.includes("recruteur") || r.includes("recruiter") || r.includes("recruteur")) {
    return isFr
      ? ["Télécharger le CV Français", "Télécharger le CV Anglais", "Voir mes compétences"]
      : ["Download English CV", "Download French CV", "See cybersecurity skills"];
  }
  
  // Default generic follow-ups
  return isFr
    ? ["Parle-moi de tes projets", "Quelles sont tes compétences ?", "Télécharger ton CV"]
    : ["Tell me about your projects", "What are your top skills?", "Download your CV"];
};

export interface AssistantTelemetry {
  engine: "gemini" | "rag";
  model?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  tokensAvailable?: string;
  contextLimit?: number;
  matchPercentage?: number;
  vectorScore?: number;
  topSource?: string;
}

export const PortfolioAssistant: React.FC = () => {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Core chat messages history hydrated from localStorage
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const saved = loadAssistantSession();
    return (saved?.messages as MessageItem[]) || [];
  });
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>(() => {
    const saved = loadAssistantSession();
    return saved?.conversationHistory || [];
  });
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userInputText, setUserInputText] = useState("");
  const [telemetry, setTelemetry] = useState<AssistantTelemetry | null>(() => {
    const saved = loadAssistantSession();
    return (saved?.telemetry as AssistantTelemetry) || null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearedState, setIsClearedState] = useState<boolean>(() => {
    const saved = loadAssistantSession();
    return saved?.isClearedState ?? false;
  });
  const [recruiterMode, setRecruiterMode] = useState<boolean>(() => {
    const saved = loadAssistantSession();
    return saved?.recruiterMode ?? false;
  });
  const [wireframeMode, setWireframeMode] = useState<boolean>(() => {
    const saved = loadAssistantSession();
    return saved?.wireframeMode ?? false;
  });

  // Voice Speech Recognition & Text-to-Speech (TTS) States
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingAudioMessageId, setLoadingAudioMessageId] = useState<string | null>(null);
  const [avatarEmotion, setAvatarEmotion] = useState<"neutral" | "curious" | "analytical" | "alert" | "playful" | "success" | "dizzy">("neutral");
  const recognitionRef = useRef<any>(null);
  const avatarRef = useRef<AegisAvatarHandle>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechPulseIntervalRef = useRef<any>(null);

  // Web Audio & HTML5 Audio Playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pre-load available system & cloud voices into browser cache
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const preloadVoices = () => {
        try {
          window.speechSynthesis.getVoices();
        } catch {}
      };
      preloadVoices();
      window.speechSynthesis.onvoiceschanged = preloadVoices;
    }
  }, []);

  const stopCurrentSpeech = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (speechPulseIntervalRef.current) {
      clearInterval(speechPulseIntervalRef.current);
      speechPulseIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = "";
      } catch {}
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    currentUtteranceRef.current = null;
    avatarRef.current?.setSpeechEnergy(0);
    setSpeakingMessageId(null);
    setLoadingAudioMessageId(null);
  };

  const startAudioLipSync = (audioEl: HTMLAudioElement) => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      // Note: createMediaElementSource can only be created once per HTMLAudioElement
      const source = ctx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioSourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const analyze = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        const count = Math.min(dataArray.length, 32);
        for (let i = 0; i < count; i++) {
          sum += dataArray[i];
        }
        const avg = sum / count;
        const normalizedEnergy = avg > 6 ? Math.min(1.0, Math.pow((avg - 6) / 70, 1.2)) : 0;
        avatarRef.current?.setSpeechEnergy(normalizedEnergy);
        animFrameRef.current = requestAnimationFrame(analyze);
      };
      animFrameRef.current = requestAnimationFrame(analyze);
    } catch (e) {
      // If Web Audio routing fails (e.g. cross-origin restrictions), use interval energy pulse
      if (speechPulseIntervalRef.current) clearInterval(speechPulseIntervalRef.current);
      speechPulseIntervalRef.current = setInterval(() => {
        const dynamicEnergy = 0.45 + Math.random() * 0.45;
        avatarRef.current?.setSpeechEnergy(dynamicEnergy);
      }, 100);
    }
  };

  const speakWithNativeSynthesis = (messageId: string, textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      stopCurrentSpeech();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      currentUtteranceRef.current = utterance;
      utterance.lang = language === "fr" ? "fr-FR" : "en-US";
      utterance.volume = 1.0;
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const targetLang = language === "fr" ? "fr" : "en";
        const bestVoice =
          voices.find(
            (v) =>
              v.lang.toLowerCase().startsWith(targetLang) &&
              (v.name.includes("Natural") ||
               v.name.includes("Google") ||
               v.name.includes("Samantha") ||
               v.name.includes("Aria"))
          ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));

        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onstart = () => {
        setLoadingAudioMessageId(null);
        setSpeakingMessageId(messageId);
        avatarRef.current?.setSpeechEnergy(0.75);

        if (speechPulseIntervalRef.current) clearInterval(speechPulseIntervalRef.current);
        speechPulseIntervalRef.current = setInterval(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          const dynamicEnergy = 0.45 + Math.random() * 0.45;
          avatarRef.current?.setSpeechEnergy(dynamicEnergy);
        }, 110);
      };

      utterance.onend = () => {
        stopCurrentSpeech();
      };

      utterance.onerror = () => {
        stopCurrentSpeech();
      };

      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      stopCurrentSpeech();
    }
  };

  const speakMessage = async (messageId: string, rawText: string) => {
    if (speakingMessageId === messageId || loadingAudioMessageId === messageId) {
      stopCurrentSpeech();
      return;
    }

    stopCurrentSpeech();

    // Clean text before reading (remove markdown, action tags, code blocks, URLs)
    const textToSpeak = rawText
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .replace(/^[\s*-]+/gm, "")
      .replace(/https?:\/\/[^\s]+/g, "")
      .trim();

    if (!textToSpeak) return;

    setLoadingAudioMessageId(messageId);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      // 1. Fetch fast, studio-quality neural MP3 audio stream from server
      const response = await fetch("/api/portfolio-assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: "Aoede",
          language: language || "en"
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error("Missing audio payload");
      }

      // 2. Play real sound with HTML5 Audio
      const audioUrl = `data:${data.mimeType || "audio/mpeg"};base64,${data.audio}`;
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setLoadingAudioMessageId(null);
        setSpeakingMessageId(messageId);
        startAudioLipSync(audio);
      };

      audio.onended = () => {
        stopCurrentSpeech();
      };

      audio.onerror = (e) => {
        console.warn("Audio playback error, falling back to native synthesis:", e);
        stopCurrentSpeech();
        speakWithNativeSynthesis(messageId, textToSpeak);
      };

      await audio.play();

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("Server TTS unavailable or timed out, using native speech synthesis:", err?.message || err);
      speakWithNativeSynthesis(messageId, textToSpeak);
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentSpeech();
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState<boolean>(false);
  const isAutoScrollingRef = useRef<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" ? window.innerWidth < 640 : false);
  const isFr = language === "fr";

  // Track window resize for mobile optimizations
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enhanced body and root scroll lock effect when chatbot is open on mobile and desktop
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyOverscroll = document.body.style.overscrollBehavior;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.overscrollBehavior = "none";

      return () => {
        document.body.style.overflow = originalBodyOverflow || "";
        document.body.style.overscrollBehavior = originalBodyOverscroll || "";
        document.documentElement.style.overflow = originalHtmlOverflow || "";
        document.documentElement.style.overscrollBehavior = originalHtmlOverscroll || "";
      };
    }
  }, [isOpen]);

  // Handle messages container scroll event: detects whether user is at bottom or scrolled up
  const handleMessagesScroll = () => {
    if (isAutoScrollingRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    // Distance to bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // Threshold of 60px: if user scrolled up more than 60px, pause auto-scroll
    if (distanceFromBottom > 60) {
      setIsUserScrolledUp(true);
    } else {
      setIsUserScrolledUp(false);
    }
  };

  // Helper to manually or programmatically scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    isAutoScrollingRef.current = true;
    setIsUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior });
    // Reset auto-scroll lock after smooth transition completes
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 450);
  };

  // Speech Recognition effect
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "fr" ? "fr-FR" : "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInputText(prev => prev + (prev ? " " : "") + transcript);
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleRecording = () => {
    if (!speechSupported) {
      alert(isFr ? "La reconnaissance vocale n'est pas supportée par votre navigateur." : "Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Auto Scroll to bottom - pauses if user scrolled up
  useEffect(() => {
    if (!isUserScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isUserScrolledUp]);

  // Auto-sync conversation session to localStorage
  useEffect(() => {
    // Avoid saving during active streaming chunk accumulation
    if (isStreaming) return;

    if (messages.length > 0 || isClearedState) {
      saveAssistantSession({
        messages,
        conversationHistory,
        telemetry,
        isClearedState,
        recruiterMode,
        wireframeMode,
      });
    }
  }, [messages, conversationHistory, telemetry, isClearedState, recruiterMode, wireframeMode, isStreaming]);

  // Language Dictionary
  const dict = {
    en: {
      tagline: "Security Operations & Portfolio Intelligence",
      welcomeTitle: "Hi, I'm ",
      assistantName: "Aegis",
      welcomeSub: "I am Aegis, Angesh's AI Security Operations & Portfolio Analyst. Ask me about his Cisco ISE NAC architectures, SIEM labs, certifications, or career background!",
      askAnything: "Ask Aegis anything...",
      thinking: "Aegis is analyzing query...",
      clearTitle: "Clear this conversation?",
      clearDesc: "This will remove all messages in this conversation. This cannot be undone.",
      cancel: "Cancel",
      clear: "Clear",
      clearedTitle: "Conversation cleared",
      clearedSub: "How can Aegis assist you today?",
      privateText: "Your conversations are private and never stored long-term.",
      chips: [
        "Give me a recruiter overview",
        "What are Angesh's key skills?",
        "Tell me about the SOC Lab project",
        "Summarize his Cisco ISE experience"
      ],
      newConv: "New Conversation",
      recruiter: "Recruiter Mode",
      wireframe: "Retro Cyberpunk Wireframe",
      langText: "Change Language",
      clearConv: "Clear Conversation",
      exportConv: "Export Conversation",
      deleteConv: "Delete Conversation",
      settings: "Settings"
    },
    fr: {
      tagline: "Opérations de Sécurité & Intelligence Portfolio",
      welcomeTitle: "Bonjour, je suis ",
      assistantName: "Aegis",
      welcomeSub: "Je suis Aegis, l'analyste de sécurité IA et l'unité d'intelligence du portfolio d'Angesh. Posez-moi vos questions sur ses architectures Cisco ISE, labs SIEM, certifications ou son parcours !",
      askAnything: "Poser une question à Aegis...",
      thinking: "Aegis analyse votre requête...",
      clearTitle: "Effacer cette conversation ?",
      clearDesc: "Cela supprimera tous les messages de cette conversation. Cette action est définitive.",
      cancel: "Annuler",
      clear: "Effacer",
      clearedTitle: "Conversation effacée",
      clearedSub: "Comment Aegis peut-il vous aider aujourd'hui ?",
      privateText: "Vos conversations sont privées et ne sont jamais stockées à long terme.",
      chips: [
        "Donnez-moi un aperçu recruteur",
        "Quelles sont ses compétences clés ?",
        "Parlez-moi du projet SOC Lab",
        "Résumez son expérience Cisco ISE"
      ],
      newConv: "Nouvelle conversation",
      recruiter: "Mode Recruteur",
      wireframe: "Mode Filaire Cyberpunk Rétro",
      langText: "Changer de langue",
      clearConv: "Effacer la conversation",
      exportConv: "Exporter la conversation",
      deleteConv: "Supprimer la conversation",
      settings: "Paramètres"
    }
  };

  const t = dict[isFr ? "fr" : "en"];

  // Chip Icons mapped for index matching State 1/6
  const chipIcons = [
    <User size={13} className="text-purple-400 group-hover:text-purple-300 shrink-0" />,
    <Sparkles size={13} className="text-purple-400 group-hover:text-purple-300 shrink-0" />,
    <Folder size={13} className="text-purple-400 group-hover:text-purple-300 shrink-0" />,
    <Shield size={13} className="text-purple-400 group-hover:text-purple-300 shrink-0" />
  ];

  // Handle action triggers from CTA buttons and markdown links
  const triggerAction = (type: string, payload: string) => {
    if (type === "navigate") {
      const sectionId = payload.replace("/#", "").replace("#", "").trim();
      window.location.hash = sectionId;
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    } else if (type === "open_project") {
      const event = new CustomEvent("open-project-modal", { detail: { slug: payload } });
      window.dispatchEvent(event);
      setIsOpen(false);
    } else if (type === "download_resume") {
      window.open(`/api/resume/download?lang=${payload}`, "_blank");
    } else if (type === "open_contact") {
      window.location.hash = "contact";
      const contactElement = document.getElementById("contact");
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: "smooth" });
      }
      setIsOpen(false);
    } else if (type === "open_schedule") {
      // Dispatches prefill event to contact section with meeting inquiry pre-selected
      window.location.hash = "contact";
      const contactElement = document.getElementById("contact");
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: "smooth" });
      }
      window.dispatchEvent(
        new CustomEvent("prefill-contact", {
          detail: {
            subject: "Meeting / Interview Schedule",
            message: isFr
              ? "Bonjour Angesh,\n\nJ'aimerais planifier un échange / entretien avec vous pour discuter d'une opportunité en cybersécurité."
              : "Hi Angesh,\n\nI would like to schedule a discussion / interview with you to explore cybersecurity opportunities.",
          },
        })
      );
      setIsOpen(false);
    } else if (type === "open_github") {
      window.open(payload, "_blank", "noopener,noreferrer");
    }
  };

  // Perform AI or Offline fallback sending
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isThinking || isStreaming) return;

    // Reset cleared state once a user initiates interaction
    setIsClearedState(false);
    setIsMenuOpen(false);
    setShowClearConfirmModal(false);
    setIsUserScrolledUp(false);

    // Formulate a timestamp
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to history
    const newUserMsg: MessageItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: "user",
      text: userText,
      timestamp: formattedTime
    };

    // Maintain brief conversation history array (up to last 10 turns)
    const recentHistory = conversationHistory.filter(h => h.text && h.text.trim().length > 0).slice(-10);

    setMessages(prev => [...prev, newUserMsg]);
    setIsThinking(true);
    setUserInputText("");

    // Lifelike Behavioral Nuance: Intelligent Nod of Receipt on input dispatch
    avatarRef.current?.triggerNod();

    // Context & Sentiment Analysis for Conversational Cognition & Cybersecurity Micro-Expressions
    const qLower = userText.toLowerCase();
    if (qLower.includes("dizzy") || qLower.includes("tournis") || qLower.includes("vertige") || qLower.includes("spin") || qLower.includes("tourne")) {
      setAvatarEmotion("dizzy");
    } else if (qLower.includes("wireframe") || qLower.includes("cyberpunk") || qLower.includes("matrix") || qLower.includes("filaire")) {
      setWireframeMode(true);
      setAvatarEmotion("analytical");
    } else if (qLower.includes("cve") || qLower.includes("attack") || qLower.includes("threat") || qLower.includes("incident") || qLower.includes("vulnerability") || qLower.includes("alerte") || qLower.includes("sécurité") || qLower.includes("hack") || qLower.includes("exploit")) {
      setAvatarEmotion("alert");
      avatarRef.current?.triggerThreatAlert();
    } else if (qLower.includes("architecture") || qLower.includes("code") || qLower.includes("cisco") || qLower.includes("radius") || qLower.includes("ise") || qLower.includes("nac") || qLower.includes("siem") || qLower.includes("analyze") || qLower.includes("analyser") || qLower.includes("802.1x") || qLower.includes("firewall")) {
      setAvatarEmotion("analytical");
      avatarRef.current?.triggerShieldLock();
    } else if (qLower.includes("hire") || qLower.includes("job") || qLower.includes("recruiter") || qLower.includes("recruteur") || qLower.includes("congrats") || qLower.includes("bravo") || qLower.includes("contact") || qLower.includes("offer") || qLower.includes("hired")) {
      setAvatarEmotion("success");
      avatarRef.current?.triggerCelebration();
    } else if (qLower.includes("who are you") || qLower.includes("easter") || qLower.includes("joke") || qLower.includes("fun") || qLower.includes("drôle")) {
      setAvatarEmotion("playful");
    } else if (userText.trim().endsWith("?")) {
      setAvatarEmotion("curious");
    }

    // Optimistically record user prompt in conversation history state
    const historyWithUser = [...recentHistory, { role: "user" as const, text: userText }];
    setConversationHistory(historyWithUser);

    const isProjectQuery = userText.toLowerCase().includes("project") || 
                           userText.toLowerCase().includes("projet") || 
                           userText.toLowerCase().includes("skills") ||
                           userText.toLowerCase().includes("compétence");

    try {
      const response = await fetch("/api/portfolio-assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          history: recentHistory,
          locale: language,
          recruiterMode,
          currentPath: window.location.pathname
        })
      });

      if (!response.ok) {
        throw new Error("API returned non-200");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream reader");

      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: "model",
        text: "",
        timestamp: formattedTime,
        showWidgets: isProjectQuery
      }]);

      setIsThinking(false);
      setIsStreaming(true);
      avatarRef.current?.setStreaming(true);

      let accumulatedText = "";
      let buffer = "";
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              isDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.meta) {
                setTelemetry(parsed.meta);
                setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, telemetry: parsed.meta } : m));
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: accumulatedText } : m));
              }
            } catch (e) {
              // Non-fatal parse issue
            }
          }
        }
      }

      setIsStreaming(false);
      avatarRef.current?.setStreaming(false);

      // If accumulated text is empty for any reason, provide local fallback answer directly
      if (!accumulatedText.trim()) {
        const queryLower = userText.toLowerCase();
        let fallbackReply = "";
        if (queryLower.includes("recruiter") || queryLower.includes("recruteur") || queryLower.includes("overview")) {
          fallbackReply = isFr
            ? "Angesh Chanderdip est un ingénieur de cybersécurité dévoué. Spécialisé en architectures AAA/NAC (Cisco ISE) et sécurité des SIEM (Wazuh). [ACTION: download_resume:fr] [ACTION: navigate:#about]"
            : "Angesh Chanderdip is an enterprise Cybersecurity Engineer specializing in network access control (Cisco ISE, 802.1X) and security operations. [ACTION: download_resume:en] [ACTION: navigate:#about]";
        } else if (queryLower.includes("skill") || queryLower.includes("compétence") || queryLower.includes("talent")) {
          fallbackReply = isFr
            ? "Ses compétences de pointe incluent Cisco ISE, l'ingénierie SIEM (Wazuh, ELK Stack), le scripting d'automatisation (Python, PowerShell) et les tests de conformité réseau. [ACTION: navigate:#experience]"
            : "His top technical skillsets include Cisco ISE NAC, SIEM operations (Wazuh, ELK Stack), network isolation, security automation scripts, and AD/PKI integrations. [ACTION: navigate:#experience]";
        } else {
          fallbackReply = isFr
            ? "Je suis **Aegis**, l'assistant IA de portfolio d'Angesh Chanderdip. Comment puis-je vous aider aujourd'hui ?\n\n[ACTION: download_resume:fr] [ACTION: open_contact]"
            : "Greetings! I am **Aegis**, Angesh Chanderdip's AI Security Analyst & Portfolio Intelligence Assistant. How can I assist you today?\n\n[ACTION: download_resume:en] [ACTION: open_contact]";
        }
        accumulatedText = fallbackReply;
        setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: fallbackReply } : m));
      }

      if (accumulatedText.trim()) {
        setConversationHistory([...historyWithUser.slice(-10), { role: "model" as const, text: accumulatedText }]);
        
        // Emotion state feedback based on reply context
        const accLower = accumulatedText.toLowerCase();
        if (accLower.includes("certif") || accLower.includes("experience") || accLower.includes("projet") || accLower.includes("project")) {
          setAvatarEmotion("analytical");
        } else if (accLower.includes("resume") || accLower.includes("cv") || accLower.includes("contact") || accLower.includes("recruiter")) {
          setAvatarEmotion("success");
        } else {
          setAvatarEmotion("playful");
        }

        if (isTtsEnabled) {
          speakMessage(botMessageId, accumulatedText);
        }
      }

    } catch (err) {
      console.warn("Falling back to local high-fidelity intelligence context search:", err);
      setIsThinking(false);
      setIsStreaming(false);
      avatarRef.current?.setStreaming(false);

      const ragTelemetry: AssistantTelemetry = {
        engine: "rag",
        matchPercentage: 92,
        vectorScore: 88,
        topSource: "Local RAG Intelligence Engine"
      };

      setTelemetry(ragTelemetry);

      let fallbackReply = "";
      const queryLower = userText.toLowerCase();

      if (queryLower.includes("recruiter") || queryLower.includes("recruteur") || queryLower.includes("overview")) {
        fallbackReply = isFr
          ? "Angesh Chanderdip est un ingénieur de cybersécurité dévoué. Spécialisé en architectures AAA/NAC (Cisco ISE) et sécurité des SIEM (Wazuh). [ACTION: download_resume:fr] [ACTION: navigate:#about]"
          : "Angesh Chanderdip is an enterprise Cybersecurity Engineer specializing in network access control (Cisco ISE, 802.1X) and security operations. [ACTION: download_resume:en] [ACTION: navigate:#about]";
      } else if (queryLower.includes("strongest") || queryLower.includes("skill") || queryLower.includes("compétence")) {
        fallbackReply = isFr
          ? "Ses compétences de pointe incluent Cisco ISE, l'ingénierie SIEM (Wazuh, ELK Stack), le scripting d'automatisation (Python, PowerShell) et les tests de conformité réseau. [ACTION: navigate:#experience]"
          : "His top technical skillsets include Cisco ISE NAC, SIEM operations (Wazuh, ELK Stack), network isolation, security automation scripts, and AD/PKI integrations. [ACTION: navigate:#experience]";
      } else if (queryLower.includes("project") || queryLower.includes("projet") || queryLower.includes("cybersecurity skills")) {
        fallbackReply = isFr
          ? "Voici les projets clés démontrant mon expertise en sécurité réseau et opérations :"
          : "Based on my portfolio, here are the projects that best demonstrate my cybersecurity expertise:";
      } else {
        fallbackReply = isFr
          ? "Je peux vous renseigner en détail sur le parcours, les certifications et les travaux de cybersécurité d'Angesh. Posez-moi vos questions !"
          : "Greetings! I am **Aegis**, Angesh Chanderdip's AI Security Analyst & Portfolio Intelligence Assistant. How can I assist you today?\n\n[ACTION: download_resume:en] [ACTION: open_contact]";
      }

      const fallbackId = (Date.now() + 2).toString();
      const fallbackFollowups = getContextualFollowups(userText, fallbackReply, isFr);
      setMessages(prev => {
        const hasExisting = prev.some(m => m.role === "model" && !m.text);
        if (hasExisting) {
          return prev.map(m => (m.role === "model" && !m.text) ? {
            ...m,
            text: fallbackReply,
            contextualChips: fallbackFollowups,
            telemetry: ragTelemetry
          } : m);
        }
        return [...prev, {
          id: fallbackId,
          role: "model",
          text: fallbackReply,
          timestamp: formattedTime,
          showWidgets: isProjectQuery,
          contextualChips: fallbackFollowups,
          telemetry: ragTelemetry
        }];
      });

      if (fallbackReply.trim()) {
        setConversationHistory([...historyWithUser.slice(-10), { role: "model" as const, text: fallbackReply }]);
        if (isTtsEnabled) {
          speakMessage(fallbackId, fallbackReply);
        }
      }
    }
  };

  const handleChipClick = (chipText: string) => {
    handleSendMessage(chipText);
  };

  return (
    <>
      {/* FLOATING SPARKLE LAUNCHER BUTTON (Visible ONLY when assistant modal is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 flex items-center gap-3"
          >
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-[#090C15]/95 backdrop-blur-md border border-purple-500/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-[0_12px_32px_rgba(139,92,246,0.15)] select-none cursor-pointer hover:bg-[#131929] hover:border-purple-500/30 transition-all duration-200"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span>{isFr ? "Discuter avec Aegis IA" : "Talk with Aegis AI"}</span>
            </motion.div>

            <motion.button
              onClick={() => setIsOpen(true)}
              aria-label={isFr ? "Ouvrir l'assistant Aegis IA" : "Open Aegis AI Assistant"}
              className="relative group flex items-center justify-center w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl sm:rounded-3xl border shadow-[0_8px_32px_rgba(139,92,246,0.45)] hover:shadow-[0_12px_44px_rgba(168,85,247,0.8)] bg-gradient-to-b from-[#131130] to-[#070913] border-purple-500/40 text-white transition-all cursor-pointer p-1 overflow-hidden"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              <AegisAvatar
                size="md"
                pixelSize={64}
                noCircleBorder={true}
                emotion={avatarEmotion}
                isThinking={isThinking}
                isStreaming={isStreaming}
                isRecording={isRecording}
                isSpeaking={speakingMessageId !== null}
                recruiterMode={recruiterMode}
                showStatusBadge={false}
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN BLURRED PORTAL OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-[#04060B]/95 sm:bg-[#04060B]/90 backdrop-blur-2xl z-[9990] flex items-center justify-center overflow-hidden p-0 sm:p-6 select-none touch-none">
            {/* Background Aesthetic Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none" />

            <div className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="z-10 w-full max-w-4xl h-full sm:h-[680px] md:h-[720px] sm:max-h-[820px] flex flex-col items-center relative sm:my-auto"
            >
              {/* UNIFIED INTERACTIVE CHAT ENGINE MODULE (No visual separation or overlay overflow) */}
              <div className="relative w-full h-full bg-[#090C15] sm:bg-[#090C15]/95 backdrop-blur-xl rounded-none sm:rounded-[28px] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden border-0 sm:border sm:border-white/10">
                
                {/* FLOATING TOP-RIGHT CONTROLS (Rounded Square Boxes, Zero Banner) */}
                <div className="absolute top-3.5 sm:top-4 right-3.5 sm:right-5 z-40 flex items-center gap-2 pt-[env(safe-area-inset-top)]">
                  {/* Settings / Options Button (Rounded Square Box) */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isFr ? "Paramètres" : "Settings"}
                    className={`w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-[14px] flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border shadow-sm active:scale-95 ${
                      isMenuOpen 
                        ? "bg-purple-600/30 border-purple-500/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]" 
                        : "bg-[#0C0F19]/90 hover:bg-[#151B2E] border-white/15 hover:border-purple-500/40 text-gray-300 hover:text-white"
                    }`}
                  >
                    <Settings size={16} className={isMenuOpen ? "animate-spin-slow text-purple-400" : ""} />
                  </button>

                  {/* Close Assistant Button (Rounded Square Box) */}
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label={isFr ? "Fermer l'assistant" : "Close Assistant"}
                    className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-[14px] bg-[#0C0F19]/90 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/15 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* UNIFIED MESSAGES VIEWPORT CONTAINER */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                  
                  {/* Option Menu Dropdown (Floating under Settings button) */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        {/* Click-outside backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsMenuOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute top-14 sm:top-15 right-3.5 sm:right-5 bg-[#0C0F19]/98 backdrop-blur-xl rounded-2xl p-2.5 w-64 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-1 z-50 text-left overflow-hidden border border-white/10 shadow-purple-950/30"
                        >
                          {/* New Conv */}
                          <button
                            onClick={() => {
                              stopCurrentSpeech();
                              setMessages([]);
                              setConversationHistory([]);
                              setIsClearedState(false);
                              setIsThinking(false);
                              setIsMenuOpen(false);
                              clearAssistantSession();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium cursor-pointer"
                          >
                            <Sparkles size={13} className="text-purple-400" />
                            <span>{t.newConv}</span>
                          </button>

                          {/* Voice Output Toggle */}
                          <div className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium">
                            <div className="flex items-center gap-2.5">
                              {isTtsEnabled ? <Volume2 size={13} className="text-purple-400" /> : <VolumeX size={13} className="text-gray-400" />}
                              <span>{isFr ? "Lecture vocale" : "Voice Output"}</span>
                            </div>
                            <button
                              onClick={() => {
                                setIsTtsEnabled(!isTtsEnabled);
                                if (speakingMessageId) {
                                  window.speechSynthesis?.cancel();
                                  setSpeakingMessageId(null);
                                }
                              }}
                              className={`w-8 h-4.5 rounded-full p-0.5 transition-all cursor-pointer relative flex items-center ${isTtsEnabled ? "bg-purple-600" : "bg-gray-700"}`}
                            >
                              <motion.div
                                layout
                                className="w-3.5 h-3.5 bg-white rounded-full"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                animate={{ x: isTtsEnabled ? 14 : 0 }}
                              />
                            </button>
                          </div>

                          {/* Change Lang */}
                          <button
                            onClick={() => {
                              setLanguage(language === "en" ? "fr" : "en");
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe size={13} className="text-purple-400" />
                              <span>{t.langText}</span>
                            </div>
                            <span className="text-[10px] font-bold text-purple-300 uppercase px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                              {language.toUpperCase()}
                            </span>
                          </button>

                          {/* Recruiter Toggle */}
                          <div className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium">
                            <div className="flex items-center gap-2.5">
                              {recruiterMode ? <UserCheck size={13} className="text-green-400" /> : <User size={13} className="text-purple-400" />}
                              <span>{t.recruiter}</span>
                            </div>
                            <button
                              onClick={() => setRecruiterMode(!recruiterMode)}
                              className={`w-8 h-4.5 rounded-full p-0.5 transition-all cursor-pointer relative flex items-center ${recruiterMode ? "bg-purple-600" : "bg-gray-700"}`}
                            >
                              <motion.div
                                layout
                                className="w-3.5 h-3.5 bg-white rounded-full"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                animate={{ x: recruiterMode ? 14 : 0 }}
                              />
                            </button>
                          </div>

                          {/* Retro Cyberpunk Wireframe Toggle */}
                          <div className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium">
                            <div className="flex items-center gap-2.5">
                              <Shield size={13} className={wireframeMode ? "text-cyan-400" : "text-purple-400"} />
                              <span>{t.wireframe}</span>
                            </div>
                            <button
                              onClick={() => setWireframeMode(!wireframeMode)}
                              className={`w-8 h-4.5 rounded-full p-0.5 transition-all cursor-pointer relative flex items-center ${wireframeMode ? "bg-cyan-500" : "bg-gray-700"}`}
                            >
                              <motion.div
                                layout
                                className="w-3.5 h-3.5 bg-white rounded-full"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                animate={{ x: wireframeMode ? 14 : 0 }}
                              />
                            </button>
                          </div>

                          {/* Clear */}
                          <button
                            onClick={() => {
                              setShowClearConfirmModal(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium cursor-pointer"
                          >
                            <RefreshCw size={13} className="text-purple-400" />
                            <span>{t.clearConv}</span>
                          </button>

                          {/* Export */}
                          <button
                            onClick={() => {
                              alert("Simulation: Export Completed Successfully");
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] rounded-xl text-gray-300 hover:text-white transition-all text-xs font-sans font-medium cursor-pointer"
                          >
                            <Download size={13} className="text-purple-400" />
                            <span>{t.exportConv}</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setShowClearConfirmModal(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-all text-xs font-sans font-bold cursor-pointer"
                          >
                            <Trash2 size={13} className="text-red-400" />
                            <span>{t.deleteConv}</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Clear Confirmation Modal (State 5) */}
                  <AnimatePresence>
                    {showClearConfirmModal && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-[#0C0F19] rounded-3xl p-6.5 text-center shadow-[0_24px_64px_rgba(0,0,0,0.7)] max-w-sm"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                            <Trash2 size={18} className="text-red-400" />
                          </div>

                          <h4 className="text-base font-extrabold text-white font-sans">{t.clearTitle}</h4>
                          <p className="text-xs text-gray-400 font-sans mt-2.5 leading-relaxed">
                            {t.clearDesc}
                          </p>

                          <div className="flex items-center gap-3 mt-5">
                            <button
                              onClick={() => setShowClearConfirmModal(false)}
                              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition-all cursor-pointer"
                            >
                              {t.cancel}
                            </button>
                            <button
                              onClick={() => {
                                stopCurrentSpeech();
                                setMessages([]);
                                setConversationHistory([]);
                                setIsClearedState(true);
                                setIsThinking(false);
                                setShowClearConfirmModal(false);
                                clearAssistantSession();
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                            >
                              {t.clear}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* CHAT MESSAGES PANEL */}
                  {messages.length === 0 ? (
                    isClearedState ? (
                      // State 6: After Deleting welcome screen
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center relative py-6 px-4 md:px-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
                      >
                        {/* Center Avatar & Branding */}
                        <div className="flex flex-col items-center justify-center z-10 my-auto">
                          {/* Standalone Floating Avatar with Refined Circular Border */}
                          <div className="relative mb-5 flex items-center justify-center">
                            <AegisAvatar
                              size={isMobile ? "md" : "lg"}
                              pixelSize={isMobile ? 120 : 180}
                              state="idle"
                              wireframeMode={wireframeMode}
                              showStatusBadge={false}
                              showWaveform={false}
                            />
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans max-w-lg">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 font-extrabold">
                              {t.clearedTitle}
                            </span>
                          </h3>
                          <p className="text-xs sm:text-[13px] text-gray-400 leading-relaxed font-sans mt-2.5 max-w-sm px-4">
                            {t.clearedSub}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      // State 1: Welcome Screen
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center relative pt-[max(3.5rem,calc(env(safe-area-inset-top)+2rem))] pb-6 px-4 md:px-8 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent"
                      >
                        {/* Center Avatar & Branding */}
                        <div className="flex flex-col items-center justify-center z-10 my-auto">
                          {/* Standalone Floating Avatar with Refined Circular Border */}
                          <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
                            <AegisAvatar
                              ref={avatarRef}
                              size={isMobile ? "lg" : "xl"}
                              pixelSize={isMobile ? 140 : 200}
                              emotion={avatarEmotion}
                              isThinking={isThinking}
                              isStreaming={isStreaming}
                              isRecording={isRecording}
                              isSpeaking={speakingMessageId !== null}
                              isTyping={userInputText.trim().length > 0}
                              wireframeMode={wireframeMode}
                              recruiterMode={recruiterMode}
                              showStatusBadge={true}
                              showWaveform={true}
                            />
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans max-w-lg">
                            {t.welcomeTitle}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500 font-extrabold">
                              {t.assistantName}
                            </span>
                          </h3>
                          <p className="text-xs sm:text-[13px] text-gray-400 leading-relaxed font-sans mt-2.5 max-w-sm px-4">
                            {t.welcomeSub}
                          </p>

                          {/* Quick Interactive Prompt Chips with Curious Head-Tilt on Hover */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 max-w-md w-full px-4">
                            {t.chips.map((chip, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleChipClick(chip)}
                                onMouseEnter={() => avatarRef.current?.setCuriousTilt(idx % 2 === 0 ? -0.09 : 0.09)}
                                onMouseLeave={() => avatarRef.current?.setCuriousTilt(0)}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-600/15 border border-white/[0.08] hover:border-purple-500/40 text-left text-xs font-sans text-gray-300 hover:text-white transition-all cursor-pointer group shadow-sm active:scale-95"
                              >
                                {chipIcons[idx % chipIcons.length]}
                                <span className="line-clamp-1">{chip}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  ) : (
                    // Conversation stream - SCROLLABLE MESSAGES VIEWPORT with Pause-on-User-Scroll
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleMessagesScroll}
                      className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))] pb-5 space-y-6 text-left scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent relative"
                    >
                      
                      {/* Top Grouped Date/Time Banner */}
                      <div className="flex items-center justify-center my-2 select-none">
                        <div className="px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10.5px] font-mono text-gray-400 flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                          <span>Today at {messages[0]?.timestamp || "03:15 PM"}</span>
                        </div>
                      </div>

                      {messages.map((m, mIdx) => {
                        const isUser = m.role === "user";
                        const parsed = parseMessageActions(m.text);
                        const isLatestModel = !isUser && mIdx === messages.length - 1;

                        if (isUser) {
                          return (
                            <div key={m.id} className="flex justify-end w-full">
                              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 border border-purple-400/20 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-md text-sm font-sans leading-relaxed break-words inline-block">
                                <p className="whitespace-pre-wrap">{m.text}</p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={m.id} className="flex items-start gap-3 w-full">
                            {/* State-Reactive AI Avatar */}
                            <AegisAvatar
                              size="sm"
                              pixelSize={42}
                              emotion={isLatestModel ? avatarEmotion : "neutral"}
                              isThinking={isLatestModel && isThinking}
                              isStreaming={isLatestModel && isStreaming}
                              isSpeaking={speakingMessageId === m.id}
                              wireframeMode={wireframeMode}
                              recruiterMode={recruiterMode}
                              className="shrink-0 mt-0.5"
                            />

                            <div className="flex-1 min-w-0">
                              {/* Header metadata */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                  <span className="font-bold text-purple-300 font-sans text-xs">Aegis AI</span>
                                  <span className="text-[10px] text-gray-500 font-mono">{m.timestamp}</span>

                                  {/* Vector RAG Source / Match Badge when active for this response */}
                                  {m.telemetry?.engine === 'rag' && (
                                    <div 
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[9.5px] font-mono text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)] animate-in fade-in duration-300"
                                      title={isFr ? `RAG Vectoriel activé • Score de similarité: ${m.telemetry.matchPercentage ?? 88}%` : `Vector RAG Active • Similarity Match: ${m.telemetry.matchPercentage ?? 88}%`}
                                    >
                                      <Activity size={10} className="text-cyan-400 shrink-0" />
                                      <span className="font-semibold text-cyan-200">Vector RAG</span>
                                      <span className="text-cyan-400/60">•</span>
                                      <span className="text-emerald-400 font-semibold">{m.telemetry.matchPercentage ?? 88}% {isFr ? "match" : "match"}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Voice Synthesis & Waveform Control */}
                                <div className="flex items-center gap-2">
                                  {speakingMessageId === m.id && (
                                    <AudioWaveformVisualizer isActive={true} type="speaking" />
                                  )}
                                  <button
                                    onClick={() => speakMessage(m.id, m.text)}
                                    disabled={loadingAudioMessageId === m.id}
                                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                      speakingMessageId === m.id
                                        ? "bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                        : loadingAudioMessageId === m.id
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
                                        : "text-gray-400 hover:text-purple-300 hover:bg-white/5"
                                    }`}
                                    title={
                                      speakingMessageId === m.id
                                        ? (isFr ? "Arrêter la voix d'Aegis (Aoede)" : "Stop Aegis Voice (Aoede)")
                                        : loadingAudioMessageId === m.id
                                        ? (isFr ? "Génération de la voix..." : "Generating voice...")
                                        : (isFr ? "Écouter avec la voix Aoede" : "Listen with Aoede Neural Voice")
                                    }
                                  >
                                    {loadingAudioMessageId === m.id ? (
                                      <Loader2 size={13} className="animate-spin text-purple-400" />
                                    ) : speakingMessageId === m.id ? (
                                      <VolumeX size={13} />
                                    ) : (
                                      <Volume2 size={13} />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Integrated Workspace Content Layout - No Restrictive Bubble */}
                              <div className="text-gray-100 text-sm font-sans leading-relaxed break-words pt-0.5">
                                <div>
                                  {renderFormattedText(parsed.textWithoutActions, (target) => triggerAction("navigate", target))}
                                  {/* Streaming Terminal Caret */}
                                  {isLatestModel && (isStreaming || (isThinking && !parsed.textWithoutActions)) && (
                                    <span className="inline-block w-2.5 h-4 bg-purple-400 animate-pulse align-middle ml-1 rounded-xs shadow-[0_0_10px_rgba(168,85,247,0.9)]">█</span>
                                  )}
                                </div>

                                {/* Action Buttons parsing if available */}
                                {parsed.actions.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3 pt-2">
                                    {parsed.actions.map((act, aIdx) => (
                                      <button
                                        key={aIdx}
                                        onClick={() => triggerAction(act.type, act.payload)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-[11px] font-semibold tracking-wide transition-all shadow active:scale-95 cursor-pointer"
                                      >
                                        {act.type === "download_resume" && <Download size={11} />}
                                        {act.type === "open_contact" && <Mail size={11} />}
                                        {act.type === "open_schedule" && <Calendar size={11} />}
                                        {act.type === "navigate" && <ChevronRight size={11} />}
                                        <span>
                                          {act.type === "download_resume" && (isFr ? "Télécharger le CV" : "Download CV")}
                                          {act.type === "open_contact" && (isFr ? "Contactez-moi" : "Contact Me")}
                                          {act.type === "open_schedule" && (isFr ? "Planifier un échange" : "Schedule Meeting")}
                                          {act.type === "navigate" && (isFr ? "Explorer" : "Explore")}
                                          {act.type === "open_project" && (PROJECT_NAMES[act.payload] || act.payload)}
                                          {act.type === "open_github" && "GitHub"}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Interactive Card Widgets when requested */}
                                {m.showWidgets && (
                                  <div className="space-y-4 mt-4 text-left">
                                    {/* Project A: Enterprise NAC Lab (Cisco ISE + AD) */}
                                    <div className="bg-[#0B0F19]/90 hover:bg-[#11172A] rounded-2xl p-5 transition-all duration-300 shadow-lg relative flex flex-col md:flex-row gap-4 group cursor-pointer border border-white/[0.06] hover:border-purple-500/30 overflow-hidden">
                                      <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-[12.5px] font-bold text-white font-sans group-hover:text-purple-300 transition-colors">
                                              Enterprise NAC Lab (Cisco ISE + AD)
                                            </h4>
                                            <span className="text-purple-300 text-[8px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10">
                                              Network Security
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-gray-400 font-sans leading-relaxed mt-2">
                                            {isFr
                                              ? "Laboratoire complet de sécurité démontrant Cisco ISE, l'intégration AD, le contrôle d'accès 802.1X et la mise en œuvre de postures de sécurité."
                                              : "End-to-end lab demonstrating Cisco ISE, Active Directory integration, 802.1X access control, posture assessment, and policy enforcement."}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5">
                                          <div className="bg-[#0284C7]/10 text-[#38BDF8] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full animate-pulse shrink-0" />
                                            <span>Cisco ISE</span>
                                          </div>
                                          <div className="bg-[#8B5CF6]/10 text-[#C084FC] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 bg-[#C084FC] rounded-full shrink-0" />
                                            <span>AD Domain</span>
                                          </div>
                                          <div className="bg-[#10B981]/10 text-[#34D399] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <Lock size={8} className="text-[#34D399] shrink-0" />
                                            <span>802.1X</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="w-full md:w-[160px] shrink-0 flex flex-col justify-center">
                                        <MiniNetworkTopology />
                                      </div>
                                    </div>

                                    {/* Project B: ISE Monitoring & Alerting System */}
                                    <div className="bg-[#0B0F19]/90 hover:bg-[#11172A] rounded-2xl p-5 transition-all duration-300 shadow-lg relative flex flex-col md:flex-row gap-4 group cursor-pointer border border-white/[0.06] hover:border-purple-500/30 overflow-hidden">
                                      <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-[12.5px] font-bold text-white font-sans group-hover:text-purple-300 transition-colors">
                                              ISE Monitoring & Alerting System
                                            </h4>
                                            <span className="text-indigo-300 text-[8px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10">
                                              Security Operations
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-gray-400 font-sans leading-relaxed mt-2">
                                            {isFr
                                              ? "Solution de surveillance en temps réel des journaux d'authentification de Cisco ISE avec alertes automatisées et détection des anomalies SIEM."
                                              : "Real-time monitoring solution for Cisco ISE authentication logs with automated alerting, anomaly detection, and reporting."}
                                          </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5">
                                          <div className="bg-[#3B82F6]/10 text-[#60A5FA] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full shrink-0" />
                                            <span>Python</span>
                                          </div>
                                          <div className="bg-[#F97316]/10 text-[#FB923C] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 bg-[#FB923C] rounded-full shrink-0" />
                                            <span>Grafana</span>
                                          </div>
                                          <div className="bg-[#14B8A6]/10 text-[#2DD4BF] px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 font-semibold uppercase tracking-wide">
                                            <span className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full shrink-0" />
                                            <span>Elasticsearch</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="w-full md:w-[160px] shrink-0 flex flex-col justify-center">
                                        <MiniSecurityOperationsDashboard />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Contextual Follow-up Chips with curious tilt on hover */}
                                {m.contextualChips && m.contextualChips.length > 0 && isLatestModel && !isThinking && !isStreaming && (
                                  <div className="flex flex-wrap gap-2 mt-3.5 pt-1">
                                    {m.contextualChips.map((chip, cIdx) => (
                                      <button
                                        key={cIdx}
                                        onClick={() => handleChipClick(chip)}
                                        onMouseEnter={() => avatarRef.current?.setCuriousTilt(cIdx % 2 === 0 ? -0.08 : 0.08)}
                                        onMouseLeave={() => avatarRef.current?.setCuriousTilt(0)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/40 text-purple-300 hover:text-white text-[11px] font-sans transition-all cursor-pointer shadow-sm active:scale-95"
                                      >
                                        <Sparkles size={11} className="text-purple-400 shrink-0" />
                                        <span>{chip}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Thinking indicators */}
                      {isThinking && (
                        <div className="flex items-start gap-3 w-full animate-in fade-in duration-200">
                          <AegisAvatar
                            size="sm"
                            pixelSize={42}
                            state="thinking"
                            isThinking={true}
                            wireframeMode={wireframeMode}
                            recruiterMode={recruiterMode}
                            className="shrink-0 mt-0.5"
                          />
                          <div className="flex items-center gap-2.5 pt-1.5 text-xs font-mono text-purple-300">
                            <span className="text-emerald-400 font-bold">$</span>
                            <span className="text-purple-300 font-medium">{t.thinking}</span>
                            <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-0.5 shadow-[0_0_10px_rgba(168,85,247,0.9)]">█</span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}

                  {/* Floating Scroll to Bottom pill when user scrolled up */}
                  <AnimatePresence>
                    {messages.length > 0 && isUserScrolledUp && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                        <motion.button
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.18 }}
                          onClick={() => scrollToBottom("smooth")}
                          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111726]/95 hover:bg-[#182136] text-purple-300 hover:text-white text-[11px] font-medium border border-purple-500/30 hover:border-purple-400 shadow-[0_4px_16px_rgba(0,0,0,0.6),0_0_12px_rgba(168,85,247,0.25)] backdrop-blur-md transition-all cursor-pointer group active:scale-95 select-none whitespace-nowrap"
                        >
                          <ArrowDown size={12} className="text-purple-400 group-hover:translate-y-0.5 transition-transform" />
                          <span>{isFr ? "Reprendre le défilement" : "Scroll to bottom"}</span>
                        </motion.button>
                      </div>
                    )}
                  </AnimatePresence>

                </div>

                {/* BOTTOM CHAT CARD INPUT FOOTER */}
                <div className="px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 bg-[#090C15] shrink-0 z-10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(userInputText);
                    }}
                    className="relative"
                  >
                    <div className="relative flex flex-col bg-[#0D1120] hover:bg-[#101528] focus-within:bg-[#12182E] rounded-2xl border border-white/10 focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-[0_12px_36px_rgba(0,0,0,0.6)] transition-all duration-300 overflow-hidden">
                      {/* Clean Textarea without intrusive top header */}
                      <textarea
                        rows={2}
                        value={userInputText}
                        placeholder={t.askAnything}
                        onChange={(e) => setUserInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(userInputText);
                          }
                        }}
                        style={{ fontSize: isMobile ? "16px" : undefined }}
                        className="w-full bg-transparent text-white placeholder-gray-500 text-[16px] sm:text-sm px-4 pt-3.5 pb-1 focus:outline-none focus:ring-0 outline-none border-none font-sans leading-relaxed resize-none overflow-y-auto"
                      />

                      {/* Bottom Actions Bar inside Prompt Container */}
                      <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                        {/* Left: Dynamic status text + Waveform Visualizer (Active only during recording or thinking, no static 'ready' status) */}
                        <div className="flex items-center gap-2 text-[11px] font-sans text-gray-400 select-none min-h-[22px]">
                          {isRecording ? (
                            <>
                              <AudioWaveformVisualizer isActive={true} type="mic" />
                              <span className="font-semibold text-red-400 animate-pulse">{isFr ? "Écoute en cours..." : "Listening..."}</span>
                            </>
                          ) : (isThinking || isStreaming) ? (
                            <>
                              <AudioWaveformVisualizer isActive={true} type="thinking" />
                              <span className="font-semibold text-cyan-300 animate-pulse">{isFr ? "Aegis réfléchit..." : "Aegis processing..."}</span>
                            </>
                          ) : null}
                        </div>

                        {/* Right: Voice Input + Mini Circular Token Ring Meter + Sleek Send Button */}
                        <div className="flex items-center gap-2.5">
                          {/* Voice Mic Button */}
                          <button
                            type="button"
                            onClick={toggleRecording}
                            className={`transition-all p-2 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-purple-400/40 ${
                              isRecording 
                                ? "text-red-400 bg-red-500/20 border border-red-500/40 scale-105 shadow-[0_0_12px_rgba(239,68,68,0.4)]" 
                                : "text-gray-400 hover:text-purple-300"
                            }`}
                            title={isRecording ? (isFr ? "Arrêter l'enregistrement" : "Stop recording") : (isFr ? "Saisie vocale" : "Voice Input")}
                          >
                            {isRecording ? (
                              <span className="w-3.5 h-3.5 rounded-sm bg-red-500 animate-pulse" />
                            ) : (
                              <Mic size={16} />
                            )}
                          </button>

                          {/* Mini Circular Token Ring Meter (Next to Send Button) */}
                          <CircularTokenRingMeter
                            currentInputText={userInputText}
                            totalTokensUsed={telemetry?.tokensUsed || 0}
                            maxContextLimit={telemetry?.contextLimit || 32000}
                            isFr={isFr}
                            engine={telemetry?.engine || "gemini"}
                          />

                          {/* Elevated Send Button */}
                          <button
                            type="submit"
                            disabled={!userInputText.trim() && !isRecording}
                            className="h-8 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_22px_rgba(139,92,246,0.55)] active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                          >
                            <span className="hidden sm:inline font-sans font-semibold tracking-wide">Send</span>
                            <ArrowUp size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* SECURE PRIVACY ANNOTATION */}
                  <div className="flex items-center justify-center gap-2 mt-2.5 text-[11px] font-sans text-gray-400">
                    <Lock size={11} className="text-purple-400 shrink-0" />
                    <span className="text-gray-400 text-[11px] font-medium">{t.privateText}</span>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
