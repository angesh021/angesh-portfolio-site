import React, { useEffect, useState } from 'react';
import { getContent } from '../../lib/contentService';

// Configurations
const SITE_URL = 'https://www.angeshchanderdip.com';
const AUTHOR_NAME = 'Angesh Chanderdip';
const DEFAULT_TITLE = 'Angesh Chanderdip | Cybersecurity & Endpoint Security Engineer';
const DEFAULT_DESC = 'Explore the interactive cybersecurity portfolio of Angesh Chanderdip. Specializing in Endpoint Security, Network Access Control (Cisco ISE, 802.1X), Automation, and Threat Hunting.';
const DEFAULT_KEYWORDS = 'Angesh Chanderdip, Cybersecurity Engineer, Endpoint Security, Network Access Control, Cisco ISE, 802.1X, Security Automation, Wazuh, SIEM, Blue Team, Security Analyst, General Motors';
const DEFAULT_IMAGE = 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Projects/HomeSocLab/SOCLab-Hero.png'; // Rich hero visual as default

// Slug mappings
const SLUG_TO_ID: Record<string, string> = {
  'home-soc-lab': 'project-home-soc-lab',
  'aura-tic-tac-toe': 'project-aura-ttt',
  'admin-dashboard': 'project-admin-dashboard',
  'enterprise-nac-lab': 'project-enterprise-nac',
  'hse-vaccination-security': 'project-hse-vax',
  'enterprise-network-lab': 'project-network-lab'
};

const ID_TO_SLUG: Record<string, string> = {
  'project-home-soc-lab': 'home-soc-lab',
  'project-aura-ttt': 'aura-tic-tac-toe',
  'project-admin-dashboard': 'admin-dashboard',
  'project-enterprise-nac': 'enterprise-nac-lab',
  'project-hse-vax': 'hse-vaccination-security',
  'project-network-lab': 'enterprise-network-lab'
};

interface SEOProps {
  currentSection?: string;
  selectedProjectId?: string | null;
}

export const SEOEngine: React.FC<SEOProps> = ({ currentSection, selectedProjectId }) => {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [hash, setHash] = useState(window.location.hash);

  // Synchronize route changes
  useEffect(() => {
    const handleUrlChange = () => {
      setPathname(window.location.pathname);
      setHash(window.location.hash);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    // 1. Identify context (homepage, sub-page, or active project)
    let pageType = 'home'; // home, section, project
    let pageSlug = '';
    let pageTitle = DEFAULT_TITLE;
    let pageDesc = DEFAULT_DESC;
    let pageKeywords = DEFAULT_KEYWORDS;
    let pageImage = DEFAULT_IMAGE;
    let canonicalUrl = SITE_URL;

    // Check if we have an active project in the URL path or passed as state
    let activeProjectId = selectedProjectId || null;
    const projectPathMatch = pathname.match(/^\/projects\/([^/]+)/);
    
    if (projectPathMatch) {
      const slug = projectPathMatch[1];
      activeProjectId = SLUG_TO_ID[slug] || slug;
      pageType = 'project';
      pageSlug = slug;
    } else if (pathname.startsWith('/about')) {
      pageType = 'section';
      pageSlug = 'about';
    } else if (pathname.startsWith('/experience')) {
      pageType = 'section';
      pageSlug = 'experience';
    } else if (pathname.startsWith('/projects')) {
      pageType = 'section';
      pageSlug = 'projects';
    } else if (pathname.startsWith('/education')) {
      pageType = 'section';
      pageSlug = 'education';
    } else if (pathname.startsWith('/contact')) {
      pageType = 'section';
      pageSlug = 'contact';
    } else if (hash) {
      // Handle hash fallback for index mapping
      const sectionName = hash.replace('#', '');
      if (['about', 'experience', 'projects', 'education', 'contact'].includes(sectionName)) {
        pageType = 'section';
        pageSlug = sectionName;
      }
    } else if (currentSection && currentSection !== 'hero') {
      pageType = 'section';
      pageSlug = currentSection;
    }

    // Initialize projects and content for dynamic metadata and schema building
    const projects = getContent<any[]>('projects', 'en') || [];
    const experience = getContent<any[]>('experience', 'en') || [];
    const education = getContent<any[]>('education', 'en') || [];

    // Helper to find meta tags or create them if missing
    const updateMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // Helper to update canonical link tag
    const updateCanonicalTag = (url: string) => {
      let el = document.querySelector('link[rel="canonical"]');
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', url);
    };

    // 2. Compute Metadata details based on identified page context
    if (pageType === 'project' && activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId || ID_TO_SLUG[p.id] === activeProjectId);
      if (project) {
        const slug = ID_TO_SLUG[project.id] || project.id;
        pageTitle = `${project.title} | Cyber Project by ${AUTHOR_NAME}`;
        pageDesc = project.description || project.longDescription?.slice(0, 155) || pageDesc;
        pageKeywords = `${project.tags?.join(', ') || ''}, ${DEFAULT_KEYWORDS}`;
        pageImage = project.galleryUrls?.[0] || project.architectureUrl || DEFAULT_IMAGE;
        canonicalUrl = `${SITE_URL}/projects/${slug}`;
      }
    } else if (pageType === 'section') {
      const formattedSlug = pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1);
      pageTitle = `${formattedSlug} | ${AUTHOR_NAME} - Cybersecurity Expert`;
      canonicalUrl = `${SITE_URL}/${pageSlug}`;

      if (pageSlug === 'about') {
        pageDesc = `Learn about Angesh Chanderdip's mission in Cybersecurity, Network Access Control systems, device posture validation, and zero-trust security controls.`;
      } else if (pageSlug === 'experience') {
        pageDesc = `Explore Angesh Chanderdip's professional background, featuring endpoint protection and defensive systems engineering at General Motors.`;
      } else if (pageSlug === 'projects') {
        pageDesc = `A showcase of key cybersecurity, SIEM threat hunting, Cisco ISE NAC labs, and secure application development projects built by Angesh Chanderdip.`;
      } else if (pageSlug === 'education') {
        pageDesc = `Academic background, degrees from University College Dublin, and professional cybersecurity and technology certifications earned by Angesh Chanderdip.`;
      } else if (pageSlug === 'contact') {
        pageDesc = `Get in touch with Angesh Chanderdip via secure messaging relays for security engineering consulting, career opportunities, or technical inquiries.`;
      }
    }

    // 3. Inject standard meta tags to DOM
    document.title = pageTitle;
    updateCanonicalTag(canonicalUrl);
    updateMetaTag('name', 'description', pageDesc);
    updateMetaTag('name', 'keywords', pageKeywords);
    updateMetaTag('name', 'robots', 'index, follow');
    updateMetaTag('name', 'author', AUTHOR_NAME);

    // 4. Inject Open Graph Meta tags for rich social/AI embeds
    updateMetaTag('property', 'og:title', pageTitle);
    updateMetaTag('property', 'og:description', pageDesc);
    updateMetaTag('property', 'og:image', pageImage);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:type', pageType === 'project' ? 'article' : 'website');
    updateMetaTag('property', 'og:site_name', `${AUTHOR_NAME} Portfolio`);

    // 5. Inject Twitter Card Meta tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', pageTitle);
    updateMetaTag('name', 'twitter:description', pageDesc);
    updateMetaTag('name', 'twitter:image', pageImage);

    // 6. Generate Schema.org JSON-LD Structured Data
    // Remove old dynamic JSON-LD scripts to prevent duplication
    const oldScripts = document.querySelectorAll('script[data-dynamic-seo]');
    oldScripts.forEach(s => s.remove());

    const schemas: any[] = [];

    // Always include the fundamental WebSite schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': `${AUTHOR_NAME} Portfolio`,
      'url': SITE_URL,
      'description': DEFAULT_DESC,
      'author': {
        '@type': 'Person',
        'name': AUTHOR_NAME
      }
    });

    // Always include Person schema representing the engineer
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': AUTHOR_NAME,
      'jobTitle': 'Endpoint Security & Network Access Control Engineer',
      'worksFor': {
        '@type': 'Organization',
        'name': 'General Motors'
      },
      'alumniOf': [
        {
          '@type': 'EducationalOrganization',
          'name': 'University College Dublin'
        },
        {
          '@type': 'EducationalOrganization',
          'name': 'Technological University Dublin'
        }
      ],
      'knowsAbout': [
        'Cybersecurity',
        'Network Security',
        'Endpoint Security',
        'Cisco ISE',
        '802.1X',
        'Zero Trust',
        'Python',
        'PowerShell',
        'Wazuh SIEM',
        'Sysmon EDR',
        'Incident Response'
      ],
      'url': SITE_URL,
      'sameAs': [
        'https://www.linkedin.com/in/angesh-chanderdip/',
        'https://github.com/angesh021'
      ],
      'image': DEFAULT_IMAGE
    });

    // Add Breadcrumb schema based on location
    const breadcrumbItems = [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL }
    ];

    if (pageType === 'section') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1),
        'item': `${SITE_URL}/${pageSlug}`
      });
    } else if (pageType === 'project' && activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId || ID_TO_SLUG[p.id] === activeProjectId);
      if (project) {
        const slug = ID_TO_SLUG[project.id] || project.id;
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': 2,
          'name': 'Projects',
          'item': `${SITE_URL}/projects`
        });
        breadcrumbItems.push({
          '@type': 'ListItem',
          'position': 3,
          'name': project.title,
          'item': `${SITE_URL}/projects/${slug}`
        });
      }
    }

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbItems
    });

    // If viewing projects section or a project, inject CreativeWork or list schemas
    if (pageType === 'project' && activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId || ID_TO_SLUG[p.id] === activeProjectId);
      if (project) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          'name': project.title,
          'headline': project.title,
          'description': project.description || project.longDescription,
          'creator': {
            '@type': 'Person',
            'name': AUTHOR_NAME
          },
          'publisher': {
            '@type': 'Person',
            'name': AUTHOR_NAME
          },
          'keywords': project.tags?.join(', '),
          'thumbnailUrl': project.galleryUrls?.[0] || project.architectureUrl || DEFAULT_IMAGE,
          'url': `${SITE_URL}/projects/${ID_TO_SLUG[project.id] || project.id}`
        });
      }
    } else if (pageSlug === 'projects') {
      // Add a list of projects to structured data when on the projects page
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Cybersecurity & Security Automation Projects',
        'description': 'A compiled list of advanced network access, endpoint defense, and threat intelligence labs designed by Angesh Chanderdip.',
        'itemListElement': projects.map((proj, idx) => ({
          '@type': 'ListItem',
          'position': idx + 1,
          'url': `${SITE_URL}/projects/${ID_TO_SLUG[proj.id] || proj.id}`,
          'name': proj.title
        }))
      });
    }

    // If viewing experience, inject organization schemas
    if (pageSlug === 'experience' && experience.length > 0) {
      experience.forEach((exp, idx) => {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'WorkAction',
          'name': `${exp.role} at ${exp.company}`,
          'agent': {
            '@type': 'Person',
            'name': AUTHOR_NAME
          },
          'startTime': exp.period?.split(' - ')[0],
          'endTime': exp.period?.split(' - ')[1] || 'Present',
          'location': {
            '@type': 'Place',
            'name': exp.location || 'Remote'
          }
        });
      });
    }

    // Inject all structured data objects into the DOM
    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-dynamic-seo', 'true');
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    });

  }, [pathname, hash, currentSection, selectedProjectId]);

  return null; // Side-effect only component
};
