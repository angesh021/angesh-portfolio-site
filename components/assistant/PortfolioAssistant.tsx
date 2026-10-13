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
  ArrowDown,
  MessageSquare,
  Clock
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { AegisAvatar, AegisAvatarHandle } from "./AegisAvatar";
import {
  InlineCiscoIseSimulatorCard,
  InlineWazuhSiemDemoCard,
  InlineCodeArtifactCard,
} from "./AssistantArtifactCards";
import {
  loadAssistantSession,
  saveAssistantSession,
  clearAssistantSession,
  loadSavedConversations,
  saveConversationToHistory,
  deleteSavedConversation,
  clearAllSavedConversations,
  exportConversationAsFile,
  StoredConversation,
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

export interface PromptEmojiData {
  emoji: string;
  category: "contact" | "appreciation" | "greeting" | "security" | "project" | "career" | "education" | "skills" | "location" | "inquiry" | "understanding";
  labelEn: string;
  labelFr: string;
  descriptionEn: string;
  descriptionFr: string;
}

export const getPromptEmojiData = (text: string): PromptEmojiData => {
  const q = (text || "").toLowerCase().trim();

  // 1. Contact / Reach Out / Connect / Hire / Meet / Message -> Heart emoji (explicitly requested by user: "when user ask to contact Angesh the a heart emoji")
  if (
    q.includes("contact") ||
    q.includes("reach") ||
    q.includes("email") ||
    q.includes("mail") ||
    q.includes("message") ||
    q.includes("hire") ||
    q.includes("meet") ||
    q.includes("schedule") ||
    q.includes("interview") ||
    q.includes("talk to") ||
    q.includes("call") ||
    q.includes("phone") ||
    q.includes("connect") ||
    q.includes("linkedin") ||
    q.includes("github") ||
    q.includes("joindre") ||
    q.includes("embaucher") ||
    q.includes("recruter") ||
    q.includes("rencontrer") ||
    q.includes("échanger") ||
    q.includes("contacter") ||
    q.includes("discuter avec") ||
    q.includes("rendez-vous")
  ) {
    return {
      emoji: "❤️",
      category: "contact",
      labelEn: "Connect & Contact",
      labelFr: "Contact & Échange",
      descriptionEn: "Reaching out to connect with Angesh",
      descriptionFr: "Prise de contact cordiale avec Angesh"
    };
  }

  // 2. Appreciation / Gratitude / Compliments -> Polite Folded Hands 🙏
  if (
    q.includes("thank") ||
    q.includes("merci") ||
    q.includes("awesome") ||
    q.includes("great") ||
    q.includes("super") ||
    q.includes("bravo") ||
    q.includes("cool") ||
    q.includes("nice") ||
    q.includes("good job") ||
    q.includes("impressive") ||
    q.includes("appreciate") ||
    q.includes("parfait") ||
    q.includes("chapeau")
  ) {
    return {
      emoji: "🙏",
      category: "appreciation",
      labelEn: "Polite Appreciation",
      labelFr: "Remerciement Courtois",
      descriptionEn: "Polite gratitude & appreciation",
      descriptionFr: "Politesse et remerciement"
    };
  }

  // 3. Greetings / Introductions -> Polite Wave 👋
  if (
    q.startsWith("hi") ||
    q.startsWith("hello") ||
    q.startsWith("hey") ||
    q.startsWith("bonjour") ||
    q.startsWith("salut") ||
    q.startsWith("coucou") ||
    q.includes("good morning") ||
    q.includes("good afternoon") ||
    q.includes("good evening") ||
    q.includes("who are you") ||
    q.includes("qui es-tu") ||
    q.includes("presentation") ||
    q.includes("présente-toi")
  ) {
    return {
      emoji: "👋",
      category: "greeting",
      labelEn: "Warm Greeting",
      labelFr: "Salutations Cordiales",
      descriptionEn: "Friendly greeting & introduction",
      descriptionFr: "Salutation cordiale à Aegis"
    };
  }

  // 4. Security / Architecture / Cisco ISE / SIEM / Wazuh / Cyber / Firewall / Threats / Posture -> 🛡️
  if (
    q.includes("security") ||
    q.includes("sécurité") ||
    q.includes("cisco") ||
    q.includes("ise") ||
    q.includes("nac") ||
    q.includes("802.1x") ||
    q.includes("siem") ||
    q.includes("wazuh") ||
    q.includes("threat") ||
    q.includes("menace") ||
    q.includes("vulnerability") ||
    q.includes("vulnérabilité") ||
    q.includes("cve") ||
    q.includes("firewall") ||
    q.includes("pare-feu") ||
    q.includes("soc") ||
    q.includes("incident") ||
    q.includes("mitre") ||
    q.includes("posture") ||
    q.includes("radius") ||
    q.includes("pki") ||
    q.includes("active directory") ||
    q.includes("ldap") ||
    q.includes("kerberos") ||
    q.includes("attack") ||
    q.includes("defense") ||
    q.includes("défense") ||
    q.includes("zero trust")
  ) {
    return {
      emoji: "🛡️",
      category: "security",
      labelEn: "Security Architecture",
      labelFr: "Architecture Sécurité",
      descriptionEn: "Cybersecurity & infrastructure topic",
      descriptionFr: "Sujet de cybersécurité & infrastructure"
    };
  }

  // 5. Projects / Labs / Code / Demos / Scripts -> 🚀
  if (
    q.includes("project") ||
    q.includes("projet") ||
    q.includes("lab") ||
    q.includes("demo") ||
    q.includes("démo") ||
    q.includes("simulate") ||
    q.includes("simuler") ||
    q.includes("code") ||
    q.includes("script") ||
    q.includes("python") ||
    q.includes("bash") ||
    q.includes("repo") ||
    q.includes("github") ||
    q.includes("aura") ||
    q.includes("build") ||
    q.includes("réalisation")
  ) {
    return {
      emoji: "🚀",
      category: "project",
      labelEn: "Project & Lab",
      labelFr: "Projet & Lab",
      descriptionEn: "Hands-on engineering & technical projects",
      descriptionFr: "Projets techniques et laboratoires"
    };
  }

  // 6. Work Experience / Background / Career / GM / GTECHNA / Resume / Recruiter -> 💼
  if (
    q.includes("experience") ||
    q.includes("expérience") ||
    q.includes("career") ||
    q.includes("carrière") ||
    q.includes("gm") ||
    q.includes("general motors") ||
    q.includes("gtechna") ||
    q.includes("work") ||
    q.includes("travail") ||
    q.includes("job") ||
    q.includes("poste") ||
    q.includes("role") ||
    q.includes("rôle") ||
    q.includes("parcours") ||
    q.includes("recruiter") ||
    q.includes("recruteur") ||
    q.includes("overview") ||
    q.includes("resume") ||
    q.includes("cv") ||
    q.includes("background")
  ) {
    return {
      emoji: "💼",
      category: "career",
      labelEn: "Career & Experience",
      labelFr: "Parcours Professionnel",
      descriptionEn: "Work history and recruiter summary",
      descriptionFr: "Expérience professionnelle & profil recruteur"
    };
  }

  // 7. Certifications / Education / University / Degree -> 🎓
  if (
    q.includes("certif") ||
    q.includes("degree") ||
    q.includes("diploma") ||
    q.includes("diplôme") ||
    q.includes("education") ||
    q.includes("formation") ||
    q.includes("comptia") ||
    q.includes("security+") ||
    q.includes("btl1") ||
    q.includes("blue team") ||
    q.includes("university") ||
    q.includes("université") ||
    q.includes("school") ||
    q.includes("école") ||
    q.includes("etude") ||
    q.includes("étude")
  ) {
    return {
      emoji: "🎓",
      category: "education",
      labelEn: "Certifications & Education",
      labelFr: "Certifications & Diplômes",
      descriptionEn: "Verified credentials & academic background",
      descriptionFr: "Certifications validées & formation"
    };
  }

  // 8. Location / Relocation / Availability / Remote -> 📍
  if (
    q.includes("location") ||
    q.includes("where") ||
    q.includes("montreal") ||
    q.includes("montréal") ||
    q.includes("canada") ||
    q.includes("quebec") ||
    q.includes("québec") ||
    q.includes("remote") ||
    q.includes("télétravail") ||
    q.includes("relocate") ||
    q.includes("relocalisation") ||
    q.includes("available") ||
    q.includes("disponibilité") ||
    q.includes("habite") ||
    q.includes("vivre") ||
    q.includes("basé")
  ) {
    return {
      emoji: "📍",
      category: "location",
      labelEn: "Location & Availability",
      labelFr: "Localisation & Disponibilité",
      descriptionEn: "Geographic location & work availability",
      descriptionFr: "Localisation géographique & disponibilité"
    };
  }

  // 9. Technical Skills / Tech Stack / Tools / Competencies -> ⚡
  if (
    q.includes("skill") ||
    q.includes("compétence") ||
    q.includes("stack") ||
    q.includes("tool") ||
    q.includes("outil") ||
    q.includes("strength") ||
    q.includes("force") ||
    q.includes("expert") ||
    q.includes("ability") ||
    q.includes("capacité")
  ) {
    return {
      emoji: "⚡",
      category: "skills",
      labelEn: "Technical Skills",
      labelFr: "Compétences Clés",
      descriptionEn: "Core capabilities and technical proficiency",
      descriptionFr: "Compétences clés et maîtrise technique"
    };
  }

  // 10. Insightful / Thoughtful Inquiries / Deep Explanations -> 💡
  if (
    q.includes("how") ||
    q.includes("why") ||
    q.includes("explain") ||
    q.includes("comment") ||
    q.includes("pourquoi") ||
    q.includes("explique") ||
    q.includes("tell me about") ||
    q.includes("parle-moi") ||
    q.includes("help") ||
    q.includes("aide")
  ) {
    return {
      emoji: "💡",
      category: "inquiry",
      labelEn: "Insightful Query",
      labelFr: "Question Approfondie",
      descriptionEn: "Seeking detailed explanation or insight",
      descriptionFr: "Demande d'explications et d'éclaircissements"
    };
  }

  // 11. Default / Understanding (as explicitly requested: "a thumbs up means I understand the question")
  return {
    emoji: "👍",
    category: "understanding",
    labelEn: "Question Understood",
    labelFr: "Question Comprise",
    descriptionEn: "Query received & understood by Aegis",
    descriptionFr: "Requête bien reçue et comprise par Aegis"
  };
};

export interface ReactionDefinition {
  emoji: string;
  key: "love" | "like" | "understand" | "agree" | "best" | "fire";
  labelEn: string;
  labelFr: string;
  stateEn: string;
  stateFr: string;
}

export const REACTION_DEFINITIONS: ReactionDefinition[] = [
  {
    emoji: "❤️",
    key: "love",
    labelEn: "Love",
    labelFr: "Adoré",
    stateEn: "Loved the question",
    stateFr: "Question adorée"
  },
  {
    emoji: "👍",
    key: "like",
    labelEn: "Like",
    labelFr: "Aimé",
    stateEn: "Liked the question",
    stateFr: "Question appréciée"
  },
  {
    emoji: "💡",
    key: "understand",
    labelEn: "Understand",
    labelFr: "Compris",
    stateEn: "Understood the question",
    stateFr: "Question bien comprise"
  },
  {
    emoji: "🤝",
    key: "agree",
    labelEn: "Agree",
    labelFr: "D'accord",
    stateEn: "Agreed with query",
    stateFr: "En accord total"
  },
  {
    emoji: "⭐",
    key: "best",
    labelEn: "The Best",
    labelFr: "Le Meilleur",
    stateEn: "It's the best question",
    stateFr: "La meilleure question"
  },
  {
    emoji: "🔥",
    key: "fire",
    labelEn: "Fire",
    labelFr: "Génial",
    stateEn: "Fire inquiry",
    stateFr: "Excellente question"
  }
];

export interface MessageReactionState {
  emoji: string;
  key: string;
  count: number;
  userReacted?: boolean;
  aegisReacted?: boolean;
  justStamped?: boolean;
}

export const getAegisInitialReaction = (text: string): { emoji: string; key: string; stateEn: string; stateFr: string } => {
  const q = (text || "").toLowerCase().trim();

  // 1. Loved the question (Contact, Hire, Meet, Compliments, Hearting)
  if (
    q.includes("contact") ||
    q.includes("reach") ||
    q.includes("hire") ||
    q.includes("meet") ||
    q.includes("interview") ||
    q.includes("email") ||
    q.includes("mail") ||
    q.includes("message") ||
    q.includes("talk to") ||
    q.includes("call") ||
    q.includes("phone") ||
    q.includes("connect") ||
    q.includes("linkedin") ||
    q.includes("thank") ||
    q.includes("merci") ||
    q.includes("awesome") ||
    q.includes("great") ||
    q.includes("bravo") ||
    q.includes("cool") ||
    q.includes("nice") ||
    q.includes("impressive") ||
    q.includes("love") ||
    q.includes("adore") ||
    q.includes("embaucher") ||
    q.includes("recruter") ||
    q.includes("contacter") ||
    q.includes("discuter")
  ) {
    return {
      emoji: "❤️",
      key: "love",
      stateEn: "Loved the question",
      stateFr: "Question adorée"
    };
  }

  // 2. The Best / Fire (Key Projects, Architecture, Labs, SIEM, Top questions)
  if (
    q.includes("project") ||
    q.includes("projet") ||
    q.includes("best") ||
    q.includes("meilleur") ||
    q.includes("architecture") ||
    q.includes("lab") ||
    q.includes("nac") ||
    q.includes("wazuh") ||
    q.includes("siem") ||
    q.includes("cisco") ||
    q.includes("ise") ||
    q.includes("zero trust") ||
    q.includes("top") ||
    q.includes("demo")
  ) {
    return {
      emoji: "⭐",
      key: "best",
      stateEn: "It's the best question",
      stateFr: "La meilleure question"
    };
  }

  // 3. Understood / Insightful (Technical inquiries, security questions, protocols, certifications)
  if (
    q.includes("how") ||
    q.includes("comment") ||
    q.includes("why") ||
    q.includes("pourquoi") ||
    q.includes("security") ||
    q.includes("sécurité") ||
    q.includes("802.1x") ||
    q.includes("radius") ||
    q.includes("certif") ||
    q.includes("skill") ||
    q.includes("compétence") ||
    q.includes("experience") ||
    q.includes("background") ||
    q.includes("vulnerab") ||
    q.includes("threat") ||
    q.includes("cve")
  ) {
    return {
      emoji: "💡",
      key: "understand",
      stateEn: "Understood the question",
      stateFr: "Question bien comprise"
    };
  }

  // 4. Default / Liked & Agreed
  return {
    emoji: "👍",
    key: "like",
    stateEn: "Liked & understood",
    stateFr: "Question validée & comprise"
  };
};

interface MessageItem {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  showWidgets?: boolean;
  artifactType?: "cisco_ise" | "wazuh_siem" | "code_snippet" | "project_cards";
  promptBadge?: PromptEmojiData;
  contextualChips?: string[];
  hasError?: boolean;
  telemetry?: AssistantTelemetry;
  reactions?: MessageReactionState[];
  isAegisReacting?: boolean;
}

// Helper to parse actions and artifacts
interface ParsedMessage {
  textWithoutActions: string;
  actions: { type: string; payload: string }[];
  artifactType?: "cisco_ise" | "wazuh_siem" | "code_snippet" | "project_cards";
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

  // Parse inline artifact markers if present
  let artifactType: "cisco_ise" | "wazuh_siem" | "code_snippet" | "project_cards" | undefined = undefined;
  const artifactRegex = /\[ARTIFACT:\s*([^\]]+)\]/i;
  const artMatch = textWithoutActions.match(artifactRegex);
  if (artMatch) {
    const val = artMatch[1].trim().toLowerCase();
    if (val.includes("ise") || val.includes("cisco") || val.includes("802")) {
      artifactType = "cisco_ise";
    } else if (val.includes("siem") || val.includes("wazuh") || val.includes("soc")) {
      artifactType = "wazuh_siem";
    } else if (val.includes("code") || val.includes("script") || val.includes("snippet")) {
      artifactType = "code_snippet";
    } else if (val.includes("project")) {
      artifactType = "project_cards";
    }
    textWithoutActions = textWithoutActions.replace(artifactRegex, "").trim();
  }

  return { textWithoutActions, actions, artifactType };
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
  const [aegisStampEvent, setAegisStampEvent] = useState<{
    msgId: string;
    emoji: string;
    stateEn: string;
    stateFr: string;
  } | null>(null);

  // Active glowing micro-orb / emoji projectile shooting from Aegis Avatar header to user bubble
  const [activeProjectile, setActiveProjectile] = useState<{
    id: string;
    msgId: string;
    emoji: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    stateEn: string;
    stateFr: string;
    defKey: string;
  } | null>(null);
  const [isAvatarLaunching, setIsAvatarLaunching] = useState<boolean>(false);

  // Menu Tab & Multi-Conversation States
  const [menuActiveTab, setMenuActiveTab] = useState<"history" | "settings">("history");
  const [savedConversations, setSavedConversations] = useState<StoredConversation[]>(() => {
    return loadSavedConversations();
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

  const handleLoadConversation = (conv: StoredConversation) => {
    stopCurrentSpeech();
    setMessages(conv.messages as MessageItem[]);
    setConversationHistory(conv.conversationHistory || []);
    setTelemetry(conv.telemetry as AssistantTelemetry || null);
    setIsClearedState(false);
    setIsThinking(false);
    setIsMenuOpen(false);
  };

  const handleNewConversation = () => {
    stopCurrentSpeech();
    if (messages.length > 0) {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser ? firstUser.text.slice(0, 42).trim() : "Conversation with Aegis";
      const lastMsg = messages[messages.length - 1];
      const preview = lastMsg ? lastMsg.text.slice(0, 60).trim() : "";
      saveConversationToHistory({
        id: "conv_" + Date.now(),
        title,
        preview,
        updatedAt: Date.now(),
        messageCount: messages.length,
        messages: messages as any,
        conversationHistory,
        telemetry: telemetry || null,
      });
    }
    setMessages([]);
    setConversationHistory([]);
    setIsClearedState(false);
    setIsThinking(false);
    setIsMenuOpen(false);
    clearAssistantSession();
    setSavedConversations(loadSavedConversations());
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedConversation(id);
    setSavedConversations(loadSavedConversations());
  };

  const handleClearAllHistory = () => {
    clearAllSavedConversations();
    setSavedConversations([]);
    setMessages([]);
    setConversationHistory([]);
    setIsClearedState(false);
    setIsMenuOpen(false);
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
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState<boolean>(false);
  const isAutoScrollingRef = useRef<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" ? window.innerWidth < 640 : false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const isFr = language === "fr";

  // Track window resize and visualViewport for mobile optimizations & virtual keyboard push
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    const handleVisualViewport = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const vv = window.visualViewport;
        setViewportHeight(vv.height);
        const isInputFocused =
          document.activeElement?.tagName === "TEXTAREA" ||
          document.activeElement?.tagName === "INPUT";
        const kh = Math.max(0, window.innerHeight - vv.height);
        if (isInputFocused && kh > 100) {
          setKeyboardHeight(kh);
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth"
              });
            }
          }, 150);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewport);
      window.visualViewport.addEventListener("scroll", handleVisualViewport);
      handleVisualViewport();
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleVisualViewport);
        window.visualViewport.removeEventListener("scroll", handleVisualViewport);
      }
    };
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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
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
    if (!isUserScrolledUp && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
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
        "How can I contact Angesh?",
        "Launch Cisco ISE 802.1X Demo",
        "Show Wazuh SIEM Incident Response",
        "Give me a recruiter overview"
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
        "Comment contacter Angesh ?",
        "Lancer la Démo Cisco ISE 802.1X",
        "Voir la Démo Wazuh SIEM & SOC",
        "Donnez-moi un aperçu recruteur"
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

  // Subtle crystalline Web Audio synthesizer chime for reaction projectile impact
  const playCyberReactionChime = (emoji: string) => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Tactile physical rubber stamp impact thud (low-frequency damped contact thump)
      const rubberThumpOsc = ctx.createOscillator();
      const rubberThumpGain = ctx.createGain();
      rubberThumpOsc.type = "sine";
      rubberThumpOsc.frequency.setValueAtTime(115, now);
      rubberThumpOsc.frequency.exponentialRampToValueAtTime(36, now + 0.055);
      rubberThumpGain.gain.setValueAtTime(0.045, now);
      rubberThumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      rubberThumpOsc.connect(rubberThumpGain);
      rubberThumpGain.connect(ctx.destination);
      rubberThumpOsc.start(now);
      rubberThumpOsc.stop(now + 0.07);

      let baseFreq = 587.33; // D5 (Loved/warm)
      if (emoji === "💡") baseFreq = 659.25; // E5 (Insight/bright)
      if (emoji === "⭐" || emoji === "🔥") baseFreq = 783.99; // G5 (Fire/star)
      if (emoji === "🤝" || emoji === "👍") baseFreq = 523.25; // C5 (Agree)

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.42, now + 0.28);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFreq * 2, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.18, now + 0.22);

      gain.gain.setValueAtTime(0.038, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch {
      // Graceful fallback
    }
  };

  // Called when the arcing micro-orb projectile impacts the user's message bubble
  const handleProjectileImpact = (proj: {
    msgId: string;
    emoji: string;
    defKey: string;
    stateEn: string;
    stateFr: string;
  }) => {
    // Dock the stamped reaction onto the message
    setMessages(prev => prev.map(m => {
      if (m.id === proj.msgId) {
        return {
          ...m,
          isAegisReacting: false,
          reactions: [
            {
              emoji: proj.emoji,
              key: proj.defKey,
              count: 1,
              aegisReacted: true,
              userReacted: false,
              justStamped: true,
            }
          ]
        };
      }
      return m;
    }));

    // Trigger synthetic crystalline chime
    playCyberReactionChime(proj.emoji);

    // Trigger active stamp event for floating banner & micro-sparks
    setAegisStampEvent({
      msgId: proj.msgId,
      emoji: proj.emoji,
      stateEn: proj.stateEn,
      stateFr: proj.stateFr,
    });

    // Remove active projectile
    setActiveProjectile(null);

    // Clear callout after 2.5s
    setTimeout(() => {
      setAegisStampEvent(prev => prev?.msgId === proj.msgId ? null : prev);
    }, 2500);
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

    // Derive initial Aegis reaction state for user prompt (loved, liked, understand, agree, best, fire)
    const initialReaction = getAegisInitialReaction(userText);
    const userMsgId = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Add user message to history with pending AI cognition state (AI will dynamically place the emoji)
    const newUserMsg: MessageItem = {
      id: userMsgId,
      role: "user",
      text: userText,
      timestamp: formattedTime,
      isAegisReacting: true,
      reactions: []
    };

    // Maintain brief conversation history array (up to last 10 turns)
    const recentHistory = conversationHistory.filter(h => h.text && h.text.trim().length > 0).slice(-10);

    setMessages(prev => [...prev, newUserMsg]);
    setIsThinking(true);
    setUserInputText("");

    // Lifelike Behavioral Nuance: Intelligent Nod of Receipt on input dispatch
    avatarRef.current?.triggerNod();

    // Scroll smoothly to ensure new user message is in view
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 50);

    // After brief cognitive analysis pause (~320ms), Aegis fires an arcing glowing micro-orb projectile
    // from the header avatar down across the chat thread to the user question bubble!
    setTimeout(() => {
      const chatAreaEl = chatAreaRef.current;
      if (!chatAreaEl) {
        handleProjectileImpact({
          msgId: userMsgId,
          emoji: initialReaction.emoji,
          defKey: initialReaction.key,
          stateEn: initialReaction.stateEn,
          stateFr: initialReaction.stateFr,
        });
        return;
      }

      const chatRect = chatAreaEl.getBoundingClientRect();

      // Origin: Aegis Avatar in floating header
      const avatarEl = document.getElementById("aegis-header-avatar");
      const avatarRect = avatarEl?.getBoundingClientRect();
      const startX = avatarRect
        ? avatarRect.left + avatarRect.width / 2 - chatRect.left
        : chatRect.width / 2;
      const startY = avatarRect
        ? avatarRect.top + avatarRect.height / 2 - chatRect.top
        : 45;

      // Target: user message beacon or bubble bottom-right dock
      const beaconEl = document.getElementById(`msg-reaction-beacon-${userMsgId}`);
      const bubbleEl = document.getElementById(`msg-bubble-${userMsgId}`);
      const targetEl = beaconEl || bubbleEl;

      let targetX = chatRect.width - 45;
      let targetY = chatRect.height - 100;

      if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2 - chatRect.left;
        targetY = targetRect.top + targetRect.height / 2 - chatRect.top;
      }

      // Trigger avatar launch recoil ring
      setIsAvatarLaunching(true);
      setTimeout(() => setIsAvatarLaunching(false), 450);

      // Launch micro-orb projectile
      setActiveProjectile({
        id: `proj-${Date.now()}`,
        msgId: userMsgId,
        emoji: initialReaction.emoji,
        defKey: initialReaction.key,
        startX,
        startY,
        targetX,
        targetY,
        stateEn: initialReaction.stateEn,
        stateFr: initialReaction.stateFr,
      });
    }, 320);

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
                           userText.toLowerCase().includes("projet");

    const isIseQuery = qLower.includes("cisco") || qLower.includes("ise") || qLower.includes("802.1x") || qLower.includes("nac") || qLower.includes("radius") || qLower.includes("posture");
    const isSiemQuery = qLower.includes("siem") || qLower.includes("wazuh") || qLower.includes("soc") || qLower.includes("incident") || qLower.includes("threat") || qLower.includes("menace") || qLower.includes("alerte");
    const isCodeQuery = qLower.includes("code") || qLower.includes("script") || qLower.includes("python") || qLower.includes("bash") || qLower.includes("automation") || qLower.includes("snippet") || qLower.includes("artéfact") || qLower.includes("artifact");

    let expectedArtifact: "cisco_ise" | "wazuh_siem" | "code_snippet" | "project_cards" | undefined = undefined;
    if (isIseQuery) expectedArtifact = "cisco_ise";
    else if (isSiemQuery) expectedArtifact = "wazuh_siem";
    else if (isCodeQuery) expectedArtifact = "code_snippet";
    else if (isProjectQuery) expectedArtifact = "project_cards";

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
        showWidgets: isProjectQuery,
        artifactType: expectedArtifact,
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

      if (isIseQuery) {
        fallbackReply = isFr
          ? "Voici la démonstration interactive en direct de mon architecture **Cisco ISE 802.1X & NAC**. Vous pouvez tester les profils de connexion, visualiser le flux RADIUS en direct et inspecter l'application des dACLs :"
          : "Here is the live interactive simulation of my **Cisco ISE 802.1X & NAC** architecture. Switch between client authentication profiles, simulate the real-time EAP/RADIUS handshake, and inspect dynamic dACL & VLAN enforcement:";
        expectedArtifact = "cisco_ise";
      } else if (isSiemQuery) {
        fallbackReply = isFr
          ? "Voici la console en direct du **SIEM Wazuh & Réponse Active aux Incidents**. Vous pouvez observer les alertes réelles corrélées au framework MITRE ATT&CK et lancer l'isolement automatisé des hôtes compromis :"
          : "Here is the live interactive **Wazuh SIEM & Active Response Incident Console**. Inspect real-time threats correlated to MITRE ATT&CK tactics and execute automated endpoint containment:";
        expectedArtifact = "wazuh_siem";
      } else if (isCodeQuery) {
        fallbackReply = isFr
          ? "Voici des extraits réels d'automatisation de sécurité (scripts Python d'intégration avec l'API REST Cisco ISE ERS, configuration Catalyst 802.1X et scripts de réponse active Wazuh) :"
          : "Here are real cybersecurity automation code artifacts (Python scripts integrating with Cisco ISE ERS REST API, Cisco Catalyst 802.1X switch port configs, and Wazuh active response bash scripts):";
        expectedArtifact = "code_snippet";
      } else if (queryLower.includes("recruiter") || queryLower.includes("recruteur") || queryLower.includes("overview")) {
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
        expectedArtifact = "project_cards";
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
            artifactType: expectedArtifact,
            contextualChips: fallbackFollowups,
            telemetry: ragTelemetry
          } : m);
        }
        return [...prev, {
          id: fallbackId,
          role: "model",
          text: fallbackReply,
          timestamp: formattedTime,
          showWidgets: isProjectQuery || expectedArtifact === "project_cards",
          artifactType: expectedArtifact,
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
          <div className="fixed inset-0 bg-[#04060B]/95 sm:bg-[#04060B]/90 backdrop-blur-2xl z-[9990] flex items-center justify-center overflow-hidden p-0 sm:p-6 overscroll-none select-none">
            {/* Background Aesthetic Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none" />

            <div className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: isMobile && viewportHeight ? `${viewportHeight}px` : undefined,
                maxHeight: isMobile ? (viewportHeight ? `${viewportHeight}px` : "100dvh") : undefined
              }}
              className="z-10 w-full max-w-4xl h-full sm:h-[680px] md:h-[720px] sm:max-h-[820px] flex flex-col items-center relative sm:my-auto select-auto"
            >
              {/* UNIFIED INTERACTIVE CHAT ENGINE MODULE (No visual separation or overlay overflow) */}
              <div className="relative w-full h-full bg-[#090C15] sm:bg-[#090C15]/95 backdrop-blur-xl rounded-none sm:rounded-[28px] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden border-0 sm:border sm:border-white/10 overscroll-contain">
                
                {/* When Welcome Screen (messages.length === 0): FLOATING TOP-RIGHT CONTROLS */}
                {messages.length === 0 && (
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
                )}

                {/* UNIFIED MESSAGES VIEWPORT CONTAINER */}
                <div ref={chatAreaRef} className="flex-1 flex flex-col min-h-0 relative">
                  
                  {/* ARMED MICRO-ORB EMOJI PROJECTILE OVERLAY (Shooting from Avatar Header to Question Bubble) */}
                  <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                    <AnimatePresence>
                      {activeProjectile && (
                        <motion.div
                          key={activeProjectile.id}
                          initial={{
                            x: activeProjectile.startX - 16,
                            y: activeProjectile.startY - 16,
                            scale: 0.25,
                            opacity: 0,
                          }}
                          animate={{
                            x: [
                              activeProjectile.startX - 16,
                              activeProjectile.startX - 16 + (activeProjectile.targetX - activeProjectile.startX) * 0.42 - 28,
                              activeProjectile.targetX - 16,
                            ],
                            y: [
                              activeProjectile.startY - 16,
                              activeProjectile.startY - 16 + (activeProjectile.targetY - activeProjectile.startY) * 0.3 - 42,
                              activeProjectile.targetY - 16,
                            ],
                            scale: [0.25, 1.35, 1],
                            opacity: [0, 1, 1],
                            rotate: [0, -18, 6],
                          }}
                          transition={{
                            duration: 0.62,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          onAnimationComplete={() => handleProjectileImpact(activeProjectile)}
                          className="absolute pointer-events-none z-50 flex items-center justify-center"
                          style={{ left: 0, top: 0, width: 32, height: 32 }}
                        >
                          {/* Outer Cyber Plasma Glow */}
                          <div className="absolute w-14 h-14 rounded-full bg-gradient-to-r from-purple-500/40 via-cyan-400/35 to-indigo-500/40 blur-md animate-pulse" />
                          
                          {/* Comet Trail Particles */}
                          <div className="absolute -left-2.5 -top-1.5 w-3 h-3 rounded-full bg-cyan-400/60 blur-[1px] animate-aegis-trail" />
                          <div className="absolute -left-5 -top-3 w-2 h-2 rounded-full bg-purple-500/50 blur-[2px] animate-aegis-trail" />

                          {/* Luminous Micro-Orb Core with Emoji inside */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white via-purple-300 to-indigo-700 border-2 border-purple-200/90 shadow-[0_0_18px_rgba(168,85,247,0.95),0_0_28px_rgba(56,189,248,0.7)] flex items-center justify-center select-none animate-aegis-orb-core">
                            <span className="text-sm select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] scale-110">
                              {activeProjectile.emoji}
                            </span>
                          </div>

                          {/* Orbiting Sparkle Star */}
                          <span className="absolute -top-2.5 -right-2 text-[10px] pointer-events-none animate-ping opacity-80">
                            ✨
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* FLOATING TOP BAR FOR ACTIVE CHAT (PART OF CHAT - NO SEPARATING LINE, CHAT SCROLLS AROUND AVATAR) */}
                  {messages.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none w-full px-4 sm:px-8 pt-3 sm:pt-4 pb-8 bg-gradient-to-b from-[#090C15] via-[#090C15]/90 via-60% to-transparent flex items-center justify-between">
                      {/* LEFT: Menu button (Far left edge, plenty of space from avatar) */}
                      <div className="pointer-events-auto">
                        <button
                          onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                            if (!isMenuOpen) {
                              setSavedConversations(loadSavedConversations());
                            }
                          }}
                          aria-label={isFr ? "Menu et historique" : "Menu & History"}
                          title={isFr ? "Menu et historique" : "Menu & History"}
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border shadow-md active:scale-95 ${
                            isMenuOpen
                              ? "bg-purple-600/30 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                              : "bg-[#0E1322]/85 hover:bg-[#171F36] border-white/15 text-gray-300 hover:text-white hover:border-purple-500/40"
                          }`}
                        >
                          {/* Minimalist 2-line '=' hamburger icon matching user image */}
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className={`w-4 h-[2px] rounded-full transition-all duration-200 ${isMenuOpen ? "bg-purple-300 rotate-45 translate-y-[3px]" : "bg-gray-200"}`} />
                            <span className={`w-4 h-[2px] rounded-full transition-all duration-200 ${isMenuOpen ? "bg-purple-300 -rotate-45 -translate-y-[3px]" : "bg-gray-200"}`} />
                          </div>
                        </button>
                      </div>

                      {/* MIDDLE: Avatar & Name Pill in absolute dead center (Part of chat, text scrolls around it) */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-1 sm:top-1.5 pointer-events-auto flex flex-col items-center justify-center">
                        {/* Thinking State 3-Dot Bubble Floating on Top of the Head */}
                        <AnimatePresence>
                          {isThinking && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.8 }}
                              transition={{ duration: 0.22, ease: "easeOut" }}
                              className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                            >
                              <div className="relative flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F1424]/95 border border-purple-400/40 shadow-[0_4px_16px_rgba(0,0,0,0.7),0_0_12px_rgba(168,85,247,0.35)] backdrop-blur-md">
                                <motion.span
                                  className="w-1.5 h-1.5 rounded-full bg-purple-300"
                                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.75, 1.25, 0.75] }}
                                  transition={{ duration: 0.9, repeat: Infinity, delay: 0 }}
                                />
                                <motion.span
                                  className="w-1.5 h-1.5 rounded-full bg-purple-300"
                                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.75, 1.25, 0.75] }}
                                  transition={{ duration: 0.9, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.span
                                  className="w-1.5 h-1.5 rounded-full bg-purple-300"
                                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.75, 1.25, 0.75] }}
                                  transition={{ duration: 0.9, repeat: Infinity, delay: 0.4 }}
                                />
                                {/* Small downward pointer triangle */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0F1424] border-r border-b border-purple-400/40 rotate-45" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Centered Avatar (Only 1 border directly on circle, no extra disc wrapper, no outer border with padding) */}
                        <div id="aegis-header-avatar" className="relative flex items-center justify-center">
                          {/* Launch Recoil Flash Ring when firing micro-orb projectile */}
                          {isAvatarLaunching && (
                            <div className="absolute inset-0 rounded-full border-2 border-purple-400/90 shadow-[0_0_24px_rgba(168,85,247,0.95)] animate-aegis-launch pointer-events-none" />
                          )}
                          <AegisAvatar
                            ref={avatarRef}
                            size="md"
                            pixelSize={isMobile ? 80 : 96}
                            emotion={avatarEmotion}
                            isThinking={isThinking}
                            isStreaming={isStreaming}
                            isRecording={isRecording}
                            isSpeaking={speakingMessageId !== null}
                            isTyping={userInputText.trim().length > 0}
                            wireframeMode={wireframeMode}
                            recruiterMode={recruiterMode}
                            noCircleBorder={false}
                            hideOuterRing={true}
                            hideHalo={true}
                            showStatusBadge={false}
                            showWaveform={false}
                          />
                        </div>

                        {/* Name Pill display directly underneath avatar with status text (matching reference image) */}
                        <div className="relative -mt-2.5 z-10">
                          <div className="px-3.5 py-1 rounded-full bg-[#0E1322]/95 border border-white/15 shadow-[0_4px_18px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center select-none backdrop-blur-md text-center leading-tight min-w-[92px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                isThinking
                                  ? "bg-purple-400 animate-ping"
                                  : speakingMessageId !== null || isStreaming
                                  ? "bg-purple-400 animate-pulse"
                                  : isRecording || userInputText.trim().length > 0
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-emerald-400"
                              }`} />
                              <span className="text-xs font-semibold tracking-tight text-white font-sans">
                                {t.assistantName || "Aegis AI"}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-sans text-gray-400 tracking-wide mt-0.5 font-medium">
                              {isThinking
                                ? (isFr ? "réfléchit..." : "is thinking...")
                                : speakingMessageId !== null || isStreaming
                                ? (isFr ? "en train de parler..." : "is speaking...")
                                : isRecording
                                ? (isFr ? "à l'écoute..." : "is listening...")
                                : userInputText.trim().length > 0
                                ? (isFr ? "attend votre saisie..." : "is listening...")
                                : (isFr ? "en ligne" : "online")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Actions (Far right edge, plenty of space from avatar) */}
                      <div className="pointer-events-auto flex items-center gap-2">
                        <button
                          onClick={handleNewConversation}
                          aria-label={t.newConv}
                          title={t.newConv}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0E1322]/85 hover:bg-[#171F36] border border-white/15 hover:border-purple-500/40 text-gray-300 hover:text-white text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
                        >
                          <Plus size={13} className="text-purple-400" />
                          <span>{t.newConv}</span>
                        </button>

                        <button
                          onClick={() => setIsOpen(false)}
                          aria-label={isFr ? "Fermer l'assistant" : "Close Assistant"}
                          title={isFr ? "Fermer l'assistant" : "Close Assistant"}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0E1322]/85 hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/15 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 backdrop-blur-md"
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* WELL-POPULATED CONTROL & HISTORY MENU DROPDOWN */}
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
                          className={`absolute ${
                            messages.length > 0
                              ? "top-16 sm:top-18 left-3.5 sm:left-6"
                              : "top-14 sm:top-15 right-3.5 sm:right-5"
                          } bg-[#0C0F19]/98 backdrop-blur-2xl rounded-2xl w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)] shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-50 text-left overflow-hidden border border-white/12 shadow-purple-950/40 flex flex-col max-h-[82vh] sm:max-h-[560px]`}
                        >
                          {/* Menu Header with Segmented Tabs */}
                          <div className="p-3 border-b border-white/[0.08] bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-2 px-1">
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-purple-400" />
                                <span className="text-xs font-bold text-white font-sans tracking-wide">Aegis AI Control</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                v2.5
                              </span>
                            </div>

                            {/* Tab Switcher */}
                            <div className="grid grid-cols-2 gap-1 bg-[#070912] p-1 rounded-xl border border-white/[0.06]">
                              <button
                                onClick={() => setMenuActiveTab("history")}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  menuActiveTab === "history"
                                    ? "bg-purple-600/30 text-white border border-purple-500/40 shadow-sm"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                <MessageSquare size={13} />
                                <span>{isFr ? "Historique" : "Chat History"}</span>
                              </button>
                              <button
                                onClick={() => setMenuActiveTab("settings")}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  menuActiveTab === "settings"
                                    ? "bg-purple-600/30 text-white border border-purple-500/40 shadow-sm"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                <Settings size={13} />
                                <span>{isFr ? "Paramètres" : "Settings"}</span>
                              </button>
                            </div>
                          </div>

                          {/* TAB 1: CHAT HISTORY */}
                          {menuActiveTab === "history" && (
                            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10">
                              {/* New Conversation Button */}
                              <button
                                onClick={handleNewConversation}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-98"
                              >
                                <Plus size={14} />
                                <span>{isFr ? "Nouvelle conversation" : "New Conversation"}</span>
                              </button>

                              {/* Current Active Session Card */}
                              {messages.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30">
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      {isFr ? "Session actuelle" : "Current Session"}
                                    </span>
                                    <span className="font-mono text-[10px] text-gray-400">
                                      {messages.length} {isFr ? "messages" : "messages"}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-300 line-clamp-2">
                                    {messages[messages.length - 1]?.text || "Active discussion..."}
                                  </p>
                                </div>
                              )}

                              {/* Saved Previous Sessions */}
                              <div className="pt-1">
                                <div className="flex items-center justify-between text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1.5">
                                  <span>{isFr ? "Sessions enregistrées" : "Saved Conversations"}</span>
                                  <Clock size={11} />
                                </div>

                                {savedConversations.filter(c => c.id !== "active_session").length === 0 ? (
                                  <div className="py-6 px-3 text-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <MessageSquare size={20} className="text-gray-500 mx-auto mb-1.5 opacity-60" />
                                    <p className="text-xs text-gray-400 font-medium">
                                      {isFr ? "Aucune session archivée" : "No archived chats yet"}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {isFr ? "Vos discussions seront sauvegardées ici" : "Your conversations will be auto-saved here"}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
                                    {savedConversations
                                      .filter(c => c.id !== "active_session")
                                      .map((conv) => (
                                        <div
                                          key={conv.id}
                                          onClick={() => handleLoadConversation(conv)}
                                          className="group relative p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-600/15 border border-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                                                {conv.title}
                                              </p>
                                              <p className="text-[10.5px] text-gray-400 line-clamp-1 mt-0.5">
                                                {conv.preview || "Conversation snippet..."}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-500">
                                                <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{conv.messageCount} msg</span>
                                              </div>
                                            </div>

                                            <button
                                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                                              title={isFr ? "Supprimer cette conversation" : "Delete conversation"}
                                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>

                              {/* Clear All History Button */}
                              {savedConversations.length > 0 && (
                                <button
                                  onClick={handleClearAllHistory}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  <span>{isFr ? "Effacer tout l'historique" : "Clear All History"}</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* TAB 2: SETTINGS & TOOLS */}
                          {menuActiveTab === "settings" && (
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                              {/* Voice Output Toggle */}
                              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300">
                                <div className="flex items-center gap-2.5">
                                  {isTtsEnabled ? <Volume2 size={14} className="text-purple-400" /> : <VolumeX size={14} className="text-gray-400" />}
                                  <div>
                                    <div className="text-white font-medium">{isFr ? "Lecture vocale (Aoede)" : "Voice Output (Aoede)"}</div>
                                    <div className="text-[10px] text-gray-400">{isFr ? "Synthèse neuronale naturelle" : "Neural voice synthesis"}</div>
                                  </div>
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

                              {/* Change Language */}
                              <button
                                onClick={() => setLanguage(language === "en" ? "fr" : "en")}
                                className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Globe size={14} className="text-purple-400" />
                                  <div className="text-left">
                                    <div className="text-white">{t.langText}</div>
                                    <div className="text-[10px] text-gray-400">{language === "en" ? "English (US)" : "Français (FR)"}</div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-purple-300 uppercase px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                                  {language.toUpperCase()}
                                </span>
                              </button>

                              {/* Recruiter Mode Toggle */}
                              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300">
                                <div className="flex items-center gap-2.5">
                                  {recruiterMode ? <UserCheck size={14} className="text-emerald-400" /> : <User size={14} className="text-purple-400" />}
                                  <div>
                                    <div className="text-white font-medium">{t.recruiter}</div>
                                    <div className="text-[10px] text-gray-400">{isFr ? "Focus compétences & archi" : "Focus skills & architecture"}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setRecruiterMode(!recruiterMode)}
                                  className={`w-8 h-4.5 rounded-full p-0.5 transition-all cursor-pointer relative flex items-center ${recruiterMode ? "bg-emerald-600" : "bg-gray-700"}`}
                                >
                                  <motion.div
                                    layout
                                    className="w-3.5 h-3.5 bg-white rounded-full"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    animate={{ x: recruiterMode ? 14 : 0 }}
                                  />
                                </button>
                              </div>

                              {/* 3D Wireframe Cyber Mode */}
                              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300">
                                <div className="flex items-center gap-2.5">
                                  <Shield size={14} className={wireframeMode ? "text-cyan-400" : "text-purple-400"} />
                                  <div>
                                    <div className="text-white font-medium">{t.wireframe}</div>
                                    <div className="text-[10px] text-gray-400">{isFr ? "Rendu cybernétique matrix" : "Cybernetic matrix shader"}</div>
                                  </div>
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

                              {/* Export Section */}
                              <div className="pt-1 border-t border-white/[0.06]">
                                <div className="text-[10px] uppercase font-semibold text-gray-400 px-1 mb-1.5">
                                  {isFr ? "Exporter la discussion" : "Export Transcript"}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    onClick={() => exportConversationAsFile(messages as any, "markdown")}
                                    disabled={messages.length === 0}
                                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
                                  >
                                    <Download size={12} className="text-purple-400" />
                                    <span>Markdown (.md)</span>
                                  </button>
                                  <button
                                    onClick={() => exportConversationAsFile(messages as any, "json")}
                                    disabled={messages.length === 0}
                                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
                                  >
                                    <Download size={12} className="text-cyan-400" />
                                    <span>JSON (.json)</span>
                                  </button>
                                </div>
                              </div>

                              {/* Clear Current Chat Button */}
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    setShowClearConfirmModal(true);
                                    setIsMenuOpen(false);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-all cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>{t.clearConv}</span>
                                </button>
                              </div>
                            </div>
                          )}
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
                            {t.chips.map((chip, idx) => {
                              const chipBadge = getPromptEmojiData(chip);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleChipClick(chip)}
                                  onMouseEnter={() => avatarRef.current?.setCuriousTilt(idx % 2 === 0 ? -0.09 : 0.09)}
                                  onMouseLeave={() => avatarRef.current?.setCuriousTilt(0)}
                                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-600/15 border border-white/[0.08] hover:border-purple-500/40 text-left text-xs font-sans text-gray-300 hover:text-white transition-all cursor-pointer group shadow-sm active:scale-95"
                                >
                                  <span className="text-base select-none shrink-0 filter drop-shadow" role="img" aria-label={chipBadge.labelEn}>
                                    {chipBadge.emoji}
                                  </span>
                                  <span className="line-clamp-1 flex-1 font-medium">{chip}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  ) : (
                    // Conversation stream - SCROLLABLE MESSAGES VIEWPORT with Pause-on-User-Scroll
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleMessagesScroll}
                      style={{ WebkitOverflowScrolling: "touch" }}
                      className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 pt-32 sm:pt-36 pb-5 space-y-6 text-left scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent relative overscroll-contain"
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
                          const activeReactions = m.reactions && m.reactions.length > 0
                            ? m.reactions
                            : m.isAegisReacting
                            ? []
                            : [{
                                emoji: getAegisInitialReaction(m.text).emoji,
                                key: getAegisInitialReaction(m.text).key,
                                count: 1,
                                aegisReacted: true,
                                userReacted: false,
                              }];

                          const isStampEventActive = aegisStampEvent?.msgId === m.id;

                          return (
                            <div key={m.id} className="flex flex-col items-end w-full group/msg animate-in fade-in slide-in-from-right-2 duration-300">
                              {/* Relative container holding message bubble and docked reaction pill */}
                              <div className="relative max-w-[85%] sm:max-w-[75%]">
                                {/* User Message Bubble */}
                                <div
                                  id={`msg-bubble-${m.id}`}
                                  className={`bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 border border-purple-400/20 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md text-sm font-sans leading-relaxed break-words relative transition-all ${
                                    isStampEventActive ? "animate-bubble-rubber-stamp" : ""
                                  } ${
                                    activeReactions.length > 0 || m.isAegisReacting ? "pb-3.5 mb-2.5" : ""
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{m.text}</p>
                                </div>

                                {/* Pending AI Reaction Beacon while Aegis is reading question (first ~320ms) */}
                                {m.isAegisReacting && (
                                  <div
                                    id={`msg-reaction-beacon-${m.id}`}
                                    className="absolute -bottom-2.5 right-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0b0f19]/90 border border-purple-500/40 text-[10px] text-purple-200 font-mono shadow-md backdrop-blur-sm animate-aegis-beacon select-none z-10"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                                    <span className="text-[10px] text-purple-300 font-medium tracking-tight">
                                      {isFr ? "Aegis analyse..." : "Aegis analyzing..."}
                                    </span>
                                  </div>
                                )}

                                {/* Emoji Reaction Badges docked directly ON the message bubble */}
                                {activeReactions.length > 0 && !m.isAegisReacting && (
                                  <div
                                    id={`msg-reaction-dock-${m.id}`}
                                    className="absolute -bottom-2.5 right-2 flex items-center flex-wrap gap-1 z-10 select-none"
                                  >
                                    {activeReactions.map((r) => {
                                      const def = REACTION_DEFINITIONS.find((d) => d.emoji === r.emoji);
                                      const stateDesc = isFr ? (def?.stateFr || "Réaction") : (def?.stateEn || "Reaction");
                                      const tooltip = isFr ? `Aegis : ${stateDesc}` : `Aegis: ${stateDesc}`;
                                      const isBeingStamped = isStampEventActive && r.emoji === aegisStampEvent.emoji;

                                      return (
                                        <div key={r.emoji} className="relative">
                                          {/* Impact shockwave & sparkles when stamped */}
                                          {isBeingStamped && (
                                            <>
                                              <div className="absolute inset-0 rounded-full border-2 border-purple-400/80 animate-aegis-shockwave pointer-events-none" />
                                              <span className="absolute -top-1.5 -left-1 text-[9px] pointer-events-none animate-sparkle-1 select-none">✨</span>
                                              <span className="absolute -bottom-1 -right-1 text-[8px] pointer-events-none animate-sparkle-2 select-none">⚡</span>
                                              <span className="absolute -top-2 right-1 text-[9px] pointer-events-none animate-sparkle-3 select-none">✨</span>
                                            </>
                                          )}

                                          {/* Aegis AI reaction indicator badge */}
                                          <div
                                            title={tooltip}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono shadow-md border select-none transition-all ${
                                              isBeingStamped ? "animate-aegis-stamp" : ""
                                            } ${
                                              isBeingStamped
                                                ? "bg-purple-950/95 border-purple-400/80 text-purple-100 shadow-[0_0_14px_rgba(168,85,247,0.6)]"
                                                : "bg-[#0b0f19]/95 border-purple-500/30 text-gray-200"
                                            }`}
                                          >
                                            <span className={`text-xs sm:text-sm filter drop-shadow ${isBeingStamped ? "animate-aegis-rubber-emoji" : ""}`}>
                                              {r.emoji}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 font-mono mt-0.5 mr-1">{m.timestamp}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={m.id} className="flex flex-col items-start w-full">
                            <div className="w-full max-w-[95%] sm:max-w-[88%]">
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

                                {/* Rich Inline Artifact Cards & Interactive Live Demos */}
                                {(m.artifactType === "cisco_ise" || parsed.artifactType === "cisco_ise") && (
                                  <InlineCiscoIseSimulatorCard
                                    isFr={isFr}
                                    onLaunchFullModal={() => {
                                      setIsOpen(false);
                                      triggerAction("open_project", "enterprise-nac-lab");
                                    }}
                                  />
                                )}

                                {(m.artifactType === "wazuh_siem" || parsed.artifactType === "wazuh_siem") && (
                                  <InlineWazuhSiemDemoCard
                                    isFr={isFr}
                                    onLaunchFullModal={() => {
                                      setIsOpen(false);
                                      triggerAction("open_project", "ise-monitoring");
                                    }}
                                  />
                                )}

                                {(m.artifactType === "code_snippet" || parsed.artifactType === "code_snippet") && (
                                  <InlineCodeArtifactCard isFr={isFr} />
                                )}

                                {/* Interactive Card Widgets when requested */}
                                {(m.showWidgets || m.artifactType === "project_cards" || parsed.artifactType === "project_cards") && (
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
                                    {m.contextualChips.map((chip, cIdx) => {
                                      const followupBadge = getPromptEmojiData(chip);
                                      return (
                                        <button
                                          key={cIdx}
                                          onClick={() => handleChipClick(chip)}
                                          onMouseEnter={() => avatarRef.current?.setCuriousTilt(cIdx % 2 === 0 ? -0.08 : 0.08)}
                                          onMouseLeave={() => avatarRef.current?.setCuriousTilt(0)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/40 text-purple-300 hover:text-white text-[11px] font-sans transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                          <span className="text-xs select-none shrink-0 filter drop-shadow" role="img" aria-label={followupBadge.labelEn}>{followupBadge.emoji}</span>
                                          <span>{chip}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Thinking indicators */}
                      {isThinking && (
                        <div className="flex items-center gap-2.5 py-1 px-1 text-xs font-mono text-purple-300 animate-in fade-in duration-200">
                          <span className="text-emerald-400 font-bold">$</span>
                          <span className="text-purple-300 font-medium">{t.thinking}</span>
                          <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-0.5 shadow-[0_0_10px_rgba(168,85,247,0.9)]">█</span>
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
                <div 
                  style={{
                    paddingBottom: isMobile && keyboardHeight > 0 ? "8px" : undefined
                  }}
                  className="px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 bg-[#090C15] shrink-0 z-10"
                >
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
                        onFocus={() => {
                          setTimeout(() => {
                            scrollToBottom("smooth");
                          }, 200);
                        }}
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
