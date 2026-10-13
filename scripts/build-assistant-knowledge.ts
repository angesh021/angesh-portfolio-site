import fs from 'fs';
import path from 'path';

interface PortfolioKnowledgeItem {
  id: string;
  type:
    | "profile"
    | "experience"
    | "project"
    | "skill"
    | "education"
    | "certification"
    | "achievement"
    | "faq"
    | "navigation";
  title: string;
  content: string;
  keywords: string[];
  technologies?: string[];
  roleTypes?: string[];
  locale: "en" | "fr";
  route?: string;
  sectionId?: string;
  projectSlug?: string;
  priority?: number;
  isPublic: boolean;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');
const OUTPUT_FILE = path.join(process.cwd(), 'content', 'assistant-knowledge.json');

const ID_TO_SLUG: Record<string, string> = {
  'project-home-soc-lab': 'home-soc-lab',
  'project-aura-ttt': 'aura-tic-tac-toe',
  'project-admin-dashboard': 'admin-dashboard',
  'project-enterprise-nac': 'enterprise-nac-lab',
  'project-hse-vax': 'hse-vaccination-security',
  'project-network-lab': 'enterprise-network-lab'
};

function safeReadFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err: any) {
    console.error(`Error reading or parsing ${filePath}:`, err.message);
    return null;
  }
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function buildKnowledge() {
  console.log('🤖 Starting portfolio assistant knowledge indexing...');
  const items: PortfolioKnowledgeItem[] = [];
  const locales: ('en' | 'fr')[] = ['en', 'fr'];

  for (const locale of locales) {
    const dir = path.join(CONTENT_DIR, locale);
    if (!fs.existsSync(dir)) {
      console.warn(`Locale directory missing: ${dir}`);
      continue;
    }

    // 1. Load Site / Profile
    const site = safeReadFile(path.join(dir, 'site.json'));
    if (site) {
      const heroTitle = site.hero_name || "Angesh Chanderdip";
      const heroSubtitle = site.hero_subtitle || "";
      const heroDesc = site.hero_description || "";
      const aboutMission = site.about_mission || "";

      items.push({
        id: `${locale}-profile-hero`,
        type: "profile",
        title: locale === "en" ? "Angesh Chanderdip - Professional Profile" : "Angesh Chanderdip - Profil Professionnel",
        content: `Name: ${heroTitle}\nSubtitle: ${heroSubtitle}\nSummary: ${heroDesc}\nMission: ${aboutMission}`,
        keywords: ["profile", "summary", "mission", "angesh", "chanderdip", "bio", "cybersecurity"],
        locale,
        route: "/#hero",
        sectionId: "hero",
        priority: 10,
        isPublic: true
      });
    }

    // 2. Load Experience
    const experiences = safeReadFile(path.join(dir, 'experience.json'));
    if (Array.isArray(experiences)) {
      experiences.forEach((exp: any, idx: number) => {
        const id = `${locale}-experience-${exp.id || idx}`;
        const company = exp.company || "";
        const role = exp.role || "";
        const period = exp.period || "";
        const pointsStr = Array.isArray(exp.points) ? exp.points.join("\n- ") : "";
        const detailsStr = exp.details || "";
        const technologies = Array.isArray(exp.technologies) ? exp.technologies : [];

        items.push({
          id,
          type: "experience",
          title: `${role} at ${company} (${period})`,
          content: `Role: ${role}\nCompany: ${company}\nPeriod: ${period}\nKey Achievements:\n- ${pointsStr}\nDetails: ${detailsStr}`,
          keywords: [company.toLowerCase(), role.toLowerCase(), "experience", "work", "job", "employment"],
          technologies,
          locale,
          route: "/#experience",
          sectionId: "experience",
          priority: 8,
          isPublic: true
        });
      });
    }

    // 3. Load Projects
    const projects = safeReadFile(path.join(dir, 'projects.json'));
    if (Array.isArray(projects)) {
      projects.forEach((proj: any, idx: number) => {
        const id = `${locale}-project-${proj.id || idx}`;
        const title = proj.title || "";
        const description = proj.description || "";
        const longDescription = proj.longDescription || "";
        const status = proj.status || "";
        const tags = Array.isArray(proj.tags) ? proj.tags : [];
        const featuresStr = Array.isArray(proj.keyFeatures) ? proj.keyFeatures.join("\n- ") : "";
        const slug = ID_TO_SLUG[proj.id] || proj.id;

        items.push({
          id,
          type: "project",
          title,
          content: `Project Title: ${title}\nStatus: ${status}\nOverview: ${description}\nDetailed Description: ${longDescription}\nKey Features:\n- ${featuresStr}`,
          keywords: [title.toLowerCase(), "project", "portfolio", slug, ...tags.map(t => t.toLowerCase())],
          technologies: tags,
          locale,
          route: `/projects/${slug}`,
          projectSlug: slug,
          priority: 9,
          isPublic: true
        });
      });
    }

    // 4. Load Education
    const education = safeReadFile(path.join(dir, 'education.json'));
    if (Array.isArray(education)) {
      education.forEach((edu: any, idx: number) => {
        const id = `${locale}-education-${edu.id || idx}`;
        const degree = edu.degree || edu.degreeTitle || "";
        const school = edu.school || edu.institution || "";
        const year = edu.year || edu.period || "";
        const desc = edu.description || "";

        items.push({
          id,
          type: "education",
          title: `${degree} - ${school} (${year})`,
          content: `Degree: ${degree}\nInstitution: ${school}\nPeriod/Year: ${year}\nDescription: ${desc}`,
          keywords: [school.toLowerCase(), degree.toLowerCase(), "education", "degree", "university", "school", "studies"],
          locale,
          route: "/#education",
          sectionId: "education",
          priority: 7,
          isPublic: true
        });
      });
    }

    // 5. Load Certifications
    const certifications = safeReadFile(path.join(dir, 'certifications.json'));
    if (Array.isArray(certifications)) {
      certifications.forEach((cert: any, idx: number) => {
        const id = `${locale}-certification-${cert.id || idx}`;
        const name = cert.name || "";
        const issuer = cert.issuer || "";
        const date = cert.date || "";
        const skills = Array.isArray(cert.skillsGained) ? cert.skillsGained.join(", ") : "";
        const benefits = Array.isArray(cert.benefits) ? cert.benefits.join("\n- ") : "";

        items.push({
          id,
          type: "certification",
          title: `${name} issued by ${issuer}`,
          content: `Certification: ${name}\nIssuer: ${issuer}\nDate: ${date}\nSkills Gained: ${skills}\nValue/Benefits:\n- ${benefits}`,
          keywords: [name.toLowerCase(), issuer.toLowerCase(), "certification", "cert", "credential", "badge"],
          technologies: Array.isArray(cert.skillsGained) ? cert.skillsGained : [],
          locale,
          route: "/#education",
          sectionId: "education",
          priority: 7,
          isPublic: true
        });
      });
    }

    // 6. Load Skills
    const skills = safeReadFile(path.join(dir, 'skills.json'));
    if (skills) {
      // skills is typically an object mapping categories to skill lists, or an array
      // Let's serialize the category and specific skills cleanly
      let skillsContent = "";
      const skillKeywords: string[] = ["skills", "technologies", "tech stack", "tools", "languages"];

      if (Array.isArray(skills)) {
        skills.forEach((cat: any) => {
          const catName = cat.category || cat.title || "";
          const list = Array.isArray(cat.items) ? cat.items.map((i: any) => typeof i === 'string' ? i : (i.name || "")).join(", ") : "";
          skillsContent += `${catName}: ${list}\n`;
          if (catName) skillKeywords.push(catName.toLowerCase());
        });
      } else if (typeof skills === 'object') {
        Object.entries(skills).forEach(([catName, list]: [string, any]) => {
          const listStr = Array.isArray(list) ? list.join(", ") : String(list);
          skillsContent += `${catName}: ${listStr}\n`;
          skillKeywords.push(catName.toLowerCase());
        });
      }

      items.push({
        id: `${locale}-skills-arsenal`,
        type: "skill",
        title: locale === "en" ? "Technical Skills & Arsenal" : "Compétences Techniques & Arsenal",
        content: skillsContent,
        keywords: skillKeywords,
        locale,
        route: "/#about",
        sectionId: "about",
        priority: 8,
        isPublic: true
      });
    }

    // 7. Load FAQs
    const faqs = safeReadFile(path.join(dir, 'recruiter-faq.json'));
    if (Array.isArray(faqs)) {
      faqs.forEach((faq: any, idx: number) => {
        const id = `${locale}-faq-${faq.category || idx}`;
        const question = faq.question || "";
        const answer = faq.answer || "";
        const keywords = Array.isArray(faq.keywords) ? faq.keywords : [];

        items.push({
          id,
          type: "faq",
          title: question,
          content: `Question: ${question}\nAnswer: ${answer}`,
          keywords: ["faq", "question", "recruiter", ...keywords],
          locale,
          route: "/#contact",
          sectionId: "contact",
          priority: 6,
          isPublic: true
        });
      });
    }

    // 8. Load Navigation
    const navItems = safeReadFile(path.join(dir, 'navigation.json'));
    if (Array.isArray(navItems)) {
      navItems.forEach((nav: any, idx: number) => {
        const id = `${locale}-navigation-${nav.sectionId || nav.projectSlug || idx}`;
        const name = nav.name || "";
        const route = nav.route || "";
        const description = nav.description || "";
        const keywords = Array.isArray(nav.keywords) ? nav.keywords : [];

        items.push({
          id,
          type: "navigation",
          title: `Navigation: Go to ${name}`,
          content: `Name: ${name}\nRoute/URL: ${route}\nDescription: ${description}`,
          keywords: ["navigation", "route", "url", "link", "page", "section", ...keywords],
          locale,
          route,
          sectionId: nav.sectionId,
          projectSlug: nav.projectSlug,
          priority: 5,
          isPublic: true
        });
      });
    }
  }

  // Write out flat database
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`✅ Successfully compiled ${items.length} knowledge items into: ${OUTPUT_FILE}`);
}

buildKnowledge();
