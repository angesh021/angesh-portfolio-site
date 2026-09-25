import React from 'react';

/**
 * Represents a professional experience or job.
 */
export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string[];
  logoUrl: string;
  logoBg?: string;
  skills: {
    name: string;
    context: string;
  }[];
  impactMetrics?: {
    value: number;
    label: string;
    icon: 'server' | 'zap' | 'shield' | 'trending-up';
    suffix?: string;
  }[];
  dailyLog?: {
    time: string;
    task: string;
    type: 'info' | 'warn' | 'critical';
  }[];
  companyUrl?: string;
  collaboration?: {
    icon: 'lead' | 'peer' | 'stakeholder' | 'report';
    role: string;
    name: string;
  }[];
  themeColor?: string;
  anecdote?: {
    title: string;
    story: string;
    icon: 'lightbulb' | 'alert-octagon';
  };
  legacy?: string[];
  type?: 'work' | 'volunteer';
}

/**
 * Represents a project in the portfolio.
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  githubUrl: string;
  liveDemoUrl?: string;
  videoPreviewUrl: string;
  status: 'Completed' | 'In Development' | 'Archived';
  keyFeatures: string[];
  architectureUrl?: string;
  galleryUrls?: string[];
}

/**
 * Represents an educational qualification.
 */
export interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  location: string;
  grade?: string;
  description: string;
  key_areas: string[];
  focus_area: string;
  details: string[];
}

/**
 * Represents a certification.
 */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
  shortName: string;
  badgeImageUrl?: string;
  descriptionKey: string;
  skillsGained: string[];
  benefits: string[];
  needsBackgroundInDarkMode?: boolean;
  pdfUrl?: string;
}

/**
 * Represents a future learning/certification goal.
 */
export interface FutureDirective {
  id: string;
  badgeImageUrl: string;
  title: string;
  descriptionKey: string;
  status: 'Planned' | 'In Progress' | 'Researching';
  keyCompetencies: string[];
  needsBackgroundInDarkMode?: boolean;
}

/**
 * Represents a single technical skill with its metadata.
 */
export interface Skill {
  name:string;
  icon: React.FC<any>;
  description: string;
}

/**
 * Represents a category of skills.
 */
export interface SkillCategory {
  color: string;
  skills: Skill[];
}

/**
 * Defines the structure for translation strings.
 */
export interface Translations {
  [key: string]: {
    en: string;
    fr: string;
  };
}

/**
 * Defines the structure for CV / Resume metadata.
 */
export interface CvMetadata {
  language: 'en' | 'fr';
  blobUrl: string;
  pathname: string;
  sha256: string;
  fileSize: number;
  uploadedAt: string;
}
