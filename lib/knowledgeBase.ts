/**
 * @fileoverview
 * Ground Truth Knowledge Base for Angesh Chanderdip's Portfolio & AI Assistant (Aegis).
 * 
 * Dynamically aggregates, parses, and structures information directly from the portfolio
 * website's primary data sources (/content/en/*.json and /content/fr/*.json) and CV details.
 * This guarantees that any updates to the portfolio website or resume automatically sync with
 * the assistant's RAG knowledge base, eliminating hallucinations and ensuring technical accuracy.
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface KnowledgeItem {
  id: string;
  type: 'profile' | 'experience' | 'project' | 'skill' | 'certification' | 'education' | 'recruiter_faq' | 'personal';
  title: string;
  content: string;
  keywords: string[];
  technologies?: string[];
  locale: 'en' | 'fr';
  route?: string;
  sectionId?: string;
  priority?: number;
  isPublic?: boolean;
  projectSlug?: string;
}

export interface WorkExperienceSkill {
  name: string;
  context?: string;
}

export interface ImpactMetric {
  value: number;
  label: string;
  suffix?: string;
  icon?: string;
}

export interface WorkExperienceItem {
  company: string;
  role: string;
  period: string;
  location: string;
  type: string;
  skills: WorkExperienceSkill[];
  impactMetrics?: ImpactMetric[];
  description: string[];
  anecdote?: {
    title: string;
    story: string;
  };
  legacy?: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  status: string;
  keyFeatures: string[];
  architectureUrl?: string;
}

export interface SkillCategory {
  color: string;
  skills: Array<{
    name: string;
    icon: string;
    description: string;
  }>;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
  shortName: string;
  skillsGained: string[];
  benefits: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  location: string;
  grade: string;
  description: string;
  key_areas: string[];
  focus_area: string;
  details: string[];
}

export interface RecruiterFAQItem {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

// ============================================================================
// Helper Functions to Load Raw Ground Truth JSON Files
// ============================================================================

function loadJsonFile<T>(locale: 'en' | 'fr', filename: string): T | null {
  try {
    const filePath = path.join(process.cwd(), 'content', locale, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[KnowledgeBase] Unable to load ${locale}/${filename}:`, err);
  }
  return null;
}

// ============================================================================
// Dynamic Knowledge Base Aggregator
// ============================================================================

/**
 * Returns structured KnowledgeItems generated dynamically from the portfolio's
 * primary content files (/content/en and /content/fr) and CV data.
 */
export function getKnowledgeBase(locale: 'en' | 'fr' = 'en'): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];

  // --------------------------------------------------------------------------
  // 1. Profile & Hero Section
  // --------------------------------------------------------------------------
  const personal = loadJsonFile<any>(locale, 'personal.json');
  const isEn = locale === 'en';

  items.push({
    id: `${locale}-profile-hero`,
    type: 'profile',
    title: isEn ? "Angesh Chanderdip - Professional Profile & Summary" : "Angesh Chanderdip - Profil Professionnel",
    content: isEn
      ? "Name: Angesh Chanderdip.\n" +
        "Current Title: Cybersecurity Engineer / Endpoint Security & Network Access Control Specialist.\n" +
        "Location: Quebec, Canada (previously Dublin, Ireland).\n" +
        "Email: angesh021@gmail.com\n" +
        "LinkedIn: https://www.linkedin.com/in/angesh-chanderdip/\n" +
        "GitHub: https://github.com/angesh021\n" +
        "Resume Download: /AngeshChanderdip_Resume.pdf\n" +
        "Specialization: Network Access Control (NAC), Cisco ISE, 802.1X (PEAP/EAP-TLS), RADIUS/TACACS+, Active Directory, SIEM Threat Detection (Wazuh, Sysmon, Suricata), Security Automation (Python, PowerShell, Bash), Endpoint Security, and IT Infrastructure.\n" +
        "Summary: Passionate, results-driven Cybersecurity Engineer with hands-on experience in Fortune 500 automotive environments (General Motors) and enterprise software support (GTECHNA). Holds an M.Sc. in Cybersecurity from University College Dublin, a B.Sc. in Computer Science from TU Dublin, CompTIA Security+, Blue Team Level 1 (BTL1), and Cisco certifications."
      : "Nom: Angesh Chanderdip.\n" +
        "Titre actuel: Ingénieur en Cybersécurité / Spécialiste du contrôle d'accès réseau (NAC) et de la sécurité des points d'accès.\n" +
        "Localisation: Québec, Canada (auparavant Dublin, Irlande).\n" +
        "Email: angesh021@gmail.com\n" +
        "LinkedIn: https://www.linkedin.com/in/angesh-chanderdip/\n" +
        "GitHub: https://github.com/angesh021\n" +
        "Téléchargement du CV: /AngeshChanderdip_Resume.pdf\n" +
        "Spécialisation: Contrôle d'accès réseau (NAC), Cisco ISE, 802.1X, Active Directory, SIEM Wazuh, détection de menaces, automatisation Python/PowerShell/Bash.\n" +
        "Résumé: Ingénieur en cybersécurité diplômé d'un Master à l'University College Dublin, fort d'une expérience marquante chez General Motors et GTECHNA, certifié BTL1, CompTIA Security+ et CCNA.",
    keywords: ["angesh", "chanderdip", "profile", "bio", "summary", "contact", "email", "linkedin", "github", "cybersecurity", "engineer"],
    technologies: ["Cisco ISE", "802.1X", "Active Directory", "Wazuh SIEM", "Python", "PowerShell"],
    locale,
    route: "/#hero",
    sectionId: "hero",
    priority: 10,
    isPublic: true
  });

  // --------------------------------------------------------------------------
  // 2. Work History & Professional Experience
  // --------------------------------------------------------------------------
  const experiences = loadJsonFile<WorkExperienceItem[]>(locale, 'experience.json') || [];
  experiences.forEach((exp, idx) => {
    const techList = exp.skills.map(s => s.name);
    const bullets = (exp.description || []).join("\n- ");
    const impact = (exp.impactMetrics || []).map(m => `${m.label}: ${m.value}${m.suffix || ''}`).join(", ");
    const anecdoteText = exp.anecdote ? `\nNotable Experience (${exp.anecdote.title}): ${exp.anecdote.story}` : "";
    const legacyText = exp.legacy ? `\nLegacy Impact: ${exp.legacy.join("; ")}` : "";

    items.push({
      id: `${locale}-experience-${idx}`,
      type: 'experience',
      title: `${exp.role} at ${exp.company} (${exp.period})`,
      content: `Role: ${exp.role}\n` +
               `Company: ${exp.company}\n` +
               `Period: ${exp.period}\n` +
               `Location: ${exp.location}\n` +
               `Key Technologies & Skills: ${techList.join(", ")}\n` +
               `Impact Metrics: ${impact || "N/A"}\n` +
               `Responsibilities & Achievements:\n- ${bullets}` +
               `${anecdoteText}` +
               `${legacyText}`,
      keywords: [
        exp.company.toLowerCase(),
        exp.role.toLowerCase(),
        "experience",
        "work history",
        "career",
        "job",
        ...techList.map(t => t.toLowerCase())
      ],
      technologies: techList,
      locale,
      route: "/#experience",
      sectionId: "experience",
      priority: 9,
      isPublic: true
    });
  });

  // --------------------------------------------------------------------------
  // 3. Project Summaries & Lab Architectures
  // --------------------------------------------------------------------------
  const projects = loadJsonFile<ProjectItem[]>(locale, 'projects.json') || [];
  projects.forEach((proj) => {
    const slugMap: Record<string, string> = {
      "project-home-soc-lab": "home-soc-lab",
      "project-aura-ttt": "aura-tic-tac-toe",
      "project-admin-dashboard": "admin-dashboard",
      "project-enterprise-nac": "enterprise-nac-lab",
      "project-hse-vax": "hse-vaccination-security",
      "project-network-lab": "enterprise-network-lab"
    };

    const projectSlug = slugMap[proj.id] || proj.id.replace("project-", "");
    const features = (proj.keyFeatures || []).join("\n- ");

    items.push({
      id: `${locale}-${proj.id}`,
      type: 'project',
      title: proj.title,
      content: `Project Name: ${proj.title}\n` +
               `Status: ${proj.status}\n` +
               `Summary: ${proj.description}\n` +
               `Detailed Overview: ${proj.longDescription}\n` +
               `Technologies / Stack: ${proj.tags.join(", ")}\n` +
               `Key Features:\n- ${features}\n` +
               `GitHub Repository: ${proj.githubUrl || "N/A"}\n` +
               `Live Demo: ${proj.liveDemoUrl || "N/A"}`,
      keywords: [
        proj.title.toLowerCase(),
        projectSlug,
        "project",
        "lab",
        "architecture",
        ...proj.tags.map(t => t.toLowerCase())
      ],
      technologies: proj.tags,
      locale,
      route: "/#projects",
      sectionId: "projects",
      priority: 9,
      isPublic: true,
      projectSlug
    });
  });

  // --------------------------------------------------------------------------
  // 4. Categorized Technical Skills
  // --------------------------------------------------------------------------
  const skillsData = loadJsonFile<{ categories: Record<string, SkillCategory> }>(locale, 'skills.json');
  if (skillsData && skillsData.categories) {
    Object.entries(skillsData.categories).forEach(([categoryName, cat]) => {
      const skillDetails = cat.skills.map(s => `• ${s.name}: ${s.description}`).join("\n");
      const skillNames = cat.skills.map(s => s.name);

      items.push({
        id: `${locale}-skill-cat-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type: 'skill',
        title: `Technical Skills - ${categoryName}`,
        content: `Category: ${categoryName}\n` +
                 `Skills & Competencies:\n${skillDetails}`,
        keywords: [
          categoryName.toLowerCase(),
          "skills",
          "competencies",
          "expertise",
          "tools",
          ...skillNames.map(s => s.toLowerCase())
        ],
        technologies: skillNames,
        locale,
        route: "/#about",
        sectionId: "about",
        priority: 8,
        isPublic: true
      });
    });
  }

  // --------------------------------------------------------------------------
  // 5. Certifications & Credentials
  // --------------------------------------------------------------------------
  const certs = loadJsonFile<CertificationItem[]>(locale, 'certifications.json') || [];
  certs.forEach((cert) => {
    const gains = (cert.skillsGained || []).join(", ");
    const benefits = (cert.benefits || []).join("\n- ");

    items.push({
      id: `${locale}-cert-${cert.id}`,
      type: 'certification',
      title: `${cert.name} (${cert.shortName}) - Issued by ${cert.issuer}`,
      content: `Certification Name: ${cert.name} (${cert.shortName})\n` +
               `Issuer: ${cert.issuer}\n` +
               `Date: ${cert.date}\n` +
               `Verification / Badge URL: ${cert.credentialUrl}\n` +
               `Skills Gained: ${gains}\n` +
               `Key Benefits:\n- ${benefits}`,
      keywords: [
        cert.name.toLowerCase(),
        cert.shortName.toLowerCase(),
        cert.issuer.toLowerCase(),
        "certification",
        "credential",
        "badge",
        "security certification"
      ],
      technologies: cert.skillsGained,
      locale,
      route: "/#education",
      sectionId: "education",
      priority: 8,
      isPublic: true
    });
  });

  // --------------------------------------------------------------------------
  // 6. Education & Academic Background
  // --------------------------------------------------------------------------
  const education = loadJsonFile<EducationItem[]>(locale, 'education.json') || [];
  education.forEach((edu, idx) => {
    const areas = (edu.key_areas || []).join(", ");
    const details = (edu.details || []).join("\n- ");

    items.push({
      id: `${locale}-education-${idx}`,
      type: 'education',
      title: `${edu.degree} - ${edu.institution} (${edu.period})`,
      content: `Degree: ${edu.degree}\n` +
               `Institution: ${edu.institution}\n` +
               `Period: ${edu.period}\n` +
               `Location: ${edu.location}\n` +
               `Grade / Result: ${edu.grade}\n` +
               `Focus Area: ${edu.focus_area}\n` +
               `Key Subject Areas: ${areas}\n` +
               `Description: ${edu.description}\n` +
               `Highlights & Coursework:\n- ${details}`,
      keywords: [
        edu.degree.toLowerCase(),
        edu.institution.toLowerCase(),
        "education",
        "degree",
        "university",
        "college",
        "academic background"
      ],
      locale,
      route: "/#education",
      sectionId: "education",
      priority: 8,
      isPublic: true
    });
  });

  // --------------------------------------------------------------------------
  // 7. Recruiter FAQ & Hiring Info
  // --------------------------------------------------------------------------
  const faqs = loadJsonFile<RecruiterFAQItem[]>(locale, 'recruiter-faq.json') || [];
  faqs.forEach((faq, idx) => {
    items.push({
      id: `${locale}-recruiter-faq-${idx}`,
      type: 'recruiter_faq',
      title: `Recruiter QA: ${faq.question}`,
      content: `Question: ${faq.question}\nAnswer: ${faq.answer}`,
      keywords: [
        "recruiter",
        "faq",
        "hiring",
        ...(faq.keywords || []).map(k => k.toLowerCase())
      ],
      locale,
      route: "/#contact",
      sectionId: "contact",
      priority: 9,
      isPublic: true
    });
  });

  // --------------------------------------------------------------------------
  // 8. Future Directives & Planned Certifications
  // --------------------------------------------------------------------------
  if (personal && personal.futureDirectives) {
    personal.futureDirectives.forEach((fd: any) => {
      items.push({
        id: `${locale}-future-plan-${fd.id}`,
        type: 'personal',
        title: `Planned Certification: ${fd.title} (${fd.status})`,
        content: `Certification: ${fd.title}\nStatus: ${fd.status}\nKey Competencies: ${(fd.keyCompetencies || []).join(", ")}`,
        keywords: [fd.title.toLowerCase(), "future plan", "planned certification", "learning roadmap"],
        locale,
        route: "/#education",
        sectionId: "education",
        priority: 7,
        isPublic: true
      });
    });
  }

  return items;
}

// ============================================================================
// Sync Knowledge Base File
// ============================================================================

/**
 * Builds and synchronizes the combined Knowledge Base directly to `content/assistant-knowledge.json`
 * ensuring disk fallback and backward compatibility stay 100% updated.
 */
export function syncKnowledgeBaseFile(): void {
  try {
    const enItems = getKnowledgeBase('en');
    const frItems = getKnowledgeBase('fr');
    const allItems = [...enItems, ...frItems];

    const targetPath = path.join(process.cwd(), 'content', 'assistant-knowledge.json');
    fs.writeFileSync(targetPath, JSON.stringify(allItems, null, 2), 'utf-8');
    console.log(`[KnowledgeBase] Successfully synced ${allItems.length} ground-truth entries to assistant-knowledge.json`);
  } catch (err) {
    console.error("[KnowledgeBase] Failed to sync assistant-knowledge.json:", err);
  }
}

// Structured Exports for Direct Usage
export const GET_GROUND_TRUTH_KNOWLEDGE = (locale: 'en' | 'fr' = 'en') => getKnowledgeBase(locale);
