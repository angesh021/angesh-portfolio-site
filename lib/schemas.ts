import { z } from 'zod';

export const TranslationStringSchema = z.object({
  en: z.string(),
  fr: z.string()
});

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string(),
  description: z.array(z.string()),
  logoUrl: z.string(),
  logoBg: z.string().optional(),
  skills: z.array(z.object({
    name: z.string(),
    context: z.string()
  })),
  impactMetrics: z.array(z.object({
    value: z.number(),
    label: z.string(),
    icon: z.enum(['server', 'zap', 'shield', 'trending-up']),
    suffix: z.string().optional()
  })).optional(),
  dailyLog: z.array(z.object({
    time: z.string(),
    task: z.string(),
    type: z.enum(['info', 'warn', 'critical'])
  })).optional(),
  companyUrl: z.string().optional(),
  collaboration: z.array(z.object({
    icon: z.enum(['lead', 'peer', 'stakeholder', 'report']),
    role: z.string(),
    name: z.string()
  })).optional(),
  themeColor: z.string().optional(),
  anecdote: z.object({
    title: z.string(),
    story: z.string(),
    icon: z.enum(['lightbulb', 'alert-octagon'])
  }).optional(),
  legacy: z.array(z.string()).optional(),
  type: z.enum(['work', 'volunteer']).optional()
});

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string(),
  tags: z.array(z.string()),
  githubUrl: z.string(),
  liveDemoUrl: z.string().optional(),
  videoPreviewUrl: z.string(),
  status: z.enum(['Completed', 'In Development', 'Archived']),
  keyFeatures: z.array(z.string()),
  architectureUrl: z.string().optional()
});

export const EducationItemSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  period: z.string(),
  location: z.string(),
  grade: z.string().optional(),
  description: z.string(),
  key_areas: z.array(z.string()),
  focus_area: z.string(),
  details: z.array(z.string())
});

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  credentialUrl: z.string(),
  shortName: z.string(),
  badgeImageUrl: z.string().optional(),
  descriptionKey: z.string(),
  skillsGained: z.array(z.string()),
  benefits: z.array(z.string()),
  needsBackgroundInDarkMode: z.boolean().optional(),
  pdfUrl: z.string().optional()
});

export const ContentSchemaMap = {
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationItemSchema),
  certifications: z.array(CertificationSchema),
  // Additional dynamic mapping endpoints could be validated here
};
