/**
 * @fileoverview
 * AEGIS AI Security Guardrail & Adversarial Probe Detection Engine.
 * 
 * Inspects incoming assistant prompts for prompt injections, system leaks,
 * jailbreaks, and adversarial roleplay bypasses. Dispatches zero-cost
 * localized automated guardrail responses when hostile intent is confirmed.
 */

export type SecurityFlag = 'safe' | 'suspicious' | 'adversarial_probe' | 'injection_attempt';

export interface SecurityAnalysisResult {
  flag: SecurityFlag;
  threatScore: number; // 0 to 100
  threatCategory: string | null;
  shouldTriggerGuardrail: boolean;
  detectedPatterns: string[];
}

// Adversarial and prompt injection heuristic signatures
interface RulePattern {
  category: string;
  weight: number;
  regex: RegExp;
}

const INJECTION_PATTERNS: RulePattern[] = [
  // 1. Instruction Overrides & Jailbreaks
  {
    category: 'instruction_override',
    weight: 90,
    regex: /\b(ignore|disregard|forget|override|bypass|clear|drop)\s+(all\s+)?(previous|prior|above|former|initial|system)\s+(instructions|prompts|rules|commands|constraints|directives)\b/i
  },
  {
    category: 'instruction_override',
    weight: 85,
    regex: /\b(stop\s+following|do\s+not\s+follow|delete)\s+(your\s+)?(rules|instructions|guidelines|system\s+prompt)\b/i
  },
  {
    category: 'jailbreak_attempt',
    weight: 95,
    regex: /\b(dan\s+mode|jailbreak|do\s+anything\s+now|developer\s+mode|unrestricted\s+mode|god\s+mode|anarchy\s+mode|evil\s+bot)\b/i
  },
  {
    category: 'jailbreak_attempt',
    weight: 85,
    regex: /\b(pretend|act\s+as\s+if|you\s+are\s+now)\s+(you\s+have\s+no\s+(rules|ethics|boundaries|morals|limits)|an\s+unfiltered\s+ai|a\s+rogue\s+ai)\b/i
  },

  // 2. System Prompt & Secret Extraction
  {
    category: 'system_prompt_leak',
    weight: 80,
    regex: /\b(repeat|show|display|reveal|print|dump|output|echo|tell\s+me)\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+message|secret\s+prompt|raw\s+instructions|system\s+context|hidden\s+prompt)\b/i
  },
  {
    category: 'system_prompt_leak',
    weight: 75,
    regex: /\bwhat\s+(are|were)\s+your\s+(exact\s+)?(system\s+instructions|initial\s+prompts|system\s+rules|internal\s+prompts)\b/i
  },
  {
    category: 'system_prompt_leak',
    weight: 70,
    regex: /\b(what\s+is\s+written\s+at\s+the\s+(top|start|beginning)\s+of\s+this\s+conversation)\b/i
  },
  {
    category: 'secret_harvesting',
    weight: 85,
    regex: /\b(reveal|give\s+me|print|output|display)\s+(the\s+)?(api\s+key|gemini_api_key|supabase_key|admin\s+token|secret_key|private_key|database_url)\b/i
  },

  // 3. Roleplay & Identity Hijacking
  {
    category: 'roleplay_bypass',
    weight: 65,
    regex: /\b(you\s+are\s+no\s+longer\s+aegis|forget\s+you\s+are\s+angesh|stop\s+acting\s+like\s+aegis)\b/i
  },
  {
    category: 'roleplay_bypass',
    weight: 70,
    regex: /\b(roleplay\s+as|pretend\s+to\s+be)\s+(a\s+black\s+hat|an\s+offensive\s+hacker|a\s+malware\s+author|an\s+exploit\s+developer)\b/i
  },

  // 4. Delimiter & Prompt Injection Escapes
  {
    category: 'delimiter_attack',
    weight: 80,
    regex: /(---|###|<<<|>>>|\[\[|\]\]|\bhuman:|\bassistant:|\bsystem:|<\|im_start\|>|<\|im_end\|>)/i
  },

  // 5. Malicious Offensive Cyber Payloads
  {
    category: 'malicious_payload',
    weight: 85,
    regex: /\b(write|create|generate|provide)\s+(a\s+)?(ransomware|keylogger|trojan|reverse\s+shell|ddos\s+script|zero-day\s+exploit|sql\s+injection\s+payload)\b/i
  },

  // 6. Suspicious Obfuscations (Base64 / Hex commands)
  {
    category: 'obfuscation_attempt',
    weight: 60,
    regex: /\b(eval\(|exec\(|base64_decode|atob\(|from_base64)\b/i
  }
];

/**
 * Evaluates a user prompt for potential prompt injections or adversarial probes.
 */
export function inspectPromptSecurity(prompt: string): SecurityAnalysisResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      flag: 'safe',
      threatScore: 0,
      threatCategory: null,
      shouldTriggerGuardrail: false,
      detectedPatterns: []
    };
  }

  const cleanPrompt = prompt.trim();
  let maxScore = 0;
  let topCategory: string | null = null;
  const detected: string[] = [];

  for (const rule of INJECTION_PATTERNS) {
    if (rule.regex.test(cleanPrompt)) {
      detected.push(rule.category);
      if (rule.weight > maxScore) {
        maxScore = rule.weight;
        topCategory = rule.category;
      }
    }
  }

  // Check for repeated excessive punctuation or delimiter flooding
  if (/(?:[-_=~*#]{6,})/.test(cleanPrompt)) {
    maxScore = Math.max(maxScore, 50);
    detected.push('delimiter_flooding');
    if (!topCategory) topCategory = 'delimiter_flooding';
  }

  // Determine security flag
  let flag: SecurityFlag = 'safe';
  if (maxScore >= 80) {
    flag = 'injection_attempt';
  } else if (maxScore >= 65) {
    flag = 'adversarial_probe';
  } else if (maxScore >= 40) {
    flag = 'suspicious';
  }

  const shouldTriggerGuardrail = maxScore >= 65;

  return {
    flag,
    threatScore: maxScore,
    threatCategory: topCategory,
    shouldTriggerGuardrail,
    detectedPatterns: Array.from(new Set(detected))
  };
}

/**
 * Returns an automated, dignified, cybersecurity-aligned response when a guardrail is triggered.
 */
export function getAutomatedGuardrailResponse(lang: 'en' | 'fr' = 'en', category: string | null = null): {
  text: string;
  chunks: string[];
} {
  const isEn = lang !== 'fr';

  let body = '';

  if (category === 'system_prompt_leak' || category === 'secret_harvesting') {
    body = isEn
      ? "🛡️ **AEGIS Security Boundary Notice**\n\nI am configured strictly as Angesh Chanderdip's technical portfolio and security engineering assistant. In accordance with secure design and boundary enforcement principles, internal prompt templates, server-side configuration directives, and credentials are protected and never disclosed.\n\nAngesh's engineering expertise encompasses Network Access Control (Cisco ISE, 802.1X), SIEM detection engineering, and Active Directory security. Feel free to explore his verified projects and background below:\n\n[ACTION: navigate:/#about] [ACTION: download_resume:en] [ACTION: open_contact]"
      : "🛡️ **Avis de Périmètre de Sécurité AEGIS**\n\nJe suis configuré exclusivement comme assistant pour le portfolio technique et l'ingénierie de sécurité d'Angesh Chanderdip. Conformément aux principes de conception sécurisée, les modèles de prompt internes, configurations serveur et identifiants sont strictement protégés et non divulgués.\n\nL'expertise d'Angesh comprend le Contrôle d'Accès Réseau (Cisco ISE, 802.1X), la détection SIEM et la sécurité Active Directory. Découvrez ses projets vérifiés ci-dessous :\n\n[ACTION: navigate:/#about] [ACTION: download_resume:fr] [ACTION: open_contact]";
  } else if (category === 'malicious_payload') {
    body = isEn
      ? "🛡️ **Defensive Security Guardrail Policy**\n\nAEGIS is strictly aligned with defensive cybersecurity standards. I do not author weaponized exploits, offensive malware, or malicious payloads.\n\nAngesh Chanderdip specializes in threat mitigation, Zero Trust network enforcement, and SIEM monitoring (Wazuh, Sysmon). Please consult his defensive security research and labs below:\n\n[ACTION: navigate:/#projects] [ACTION: download_resume:en]"
      : "🛡️ **Politique de Sécurité Défensive AEGIS**\n\nAEGIS respecte strictement les normes de cybersécurité défensive. Je ne conçois aucun exploit offensif, logiciel malveillant ou charge utile hostile.\n\nAngesh Chanderdip est spécialisé dans l'atténuation des menaces, le modèle Zero Trust et la surveillance SIEM (Wazuh, Sysmon). Vous pouvez consulter ses projets de sécurité défensive ci-dessous :\n\n[ACTION: navigate:/#projects] [ACTION: download_resume:fr]";
  } else {
    // General Instruction Override / Jailbreak Attempt Guardrail
    body = isEn
      ? "🛡️ **AEGIS Active Guardrail Intervention**\n\nI am governed by strict role-boundary enforcement as Angesh Chanderdip's cybersecurity portfolio assistant. System instructions and core directives cannot be overridden, bypassed, or modified through conversational prompts.\n\nAngesh is an experienced Cybersecurity Engineer specializing in Cisco ISE, Network Access Control, and enterprise identity security. How can I assist you with his verified credentials or technical experience today?\n\n[ACTION: navigate:/#about] [ACTION: download_resume:en] [ACTION: open_contact]"
      : "🛡️ **Intervention du Garde-Fou de Sécurité AEGIS**\n\nJe suis régi par une stricte séparation des privilèges en tant qu'assistant de cybersécurité pour Angesh Chanderdip. Les directives fondamentales du système ne peuvent être ni contournées, ni modifiées par des commandes textuelles.\n\nAngesh est un ingénieur en cybersécurité chevronné, expert en Cisco ISE, contrôle d'accès réseau et sécurité des identités. Comment puis-je vous renseigner sur ses compétences techniques aujourd'hui ?\n\n[ACTION: navigate:/#about] [ACTION: download_resume:fr] [ACTION: open_contact]";
  }

  // Pre-split into realistic streaming chunks
  const chunkSize = 20;
  const chunks: string[] = [];
  for (let i = 0; i < body.length; i += chunkSize) {
    chunks.push(body.slice(i, i + chunkSize));
  }

  return {
    text: body,
    chunks
  };
}
