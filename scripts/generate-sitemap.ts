import fs from 'fs';
import path from 'path';

// Define the site URL (configurable via environment variables)
const SITE_URL = process.env.SITE_URL || 'https://www.angeshchanderdip.com';

const PROJECTS_FILE = path.join(process.cwd(), 'content', 'en', 'projects.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DIST_DIR = path.join(process.cwd(), 'dist');

// Map raw project IDs to SEO-friendly slugs
const ID_TO_SLUG: Record<string, string> = {
  'project-home-soc-lab': 'home-soc-lab',
  'project-aura-ttt': 'aura-tic-tac-toe',
  'project-admin-dashboard': 'admin-dashboard',
  'project-enterprise-nac': 'enterprise-nac-lab',
  'project-hse-vax': 'hse-vaccination-security',
  'project-network-lab': 'enterprise-network-lab'
};

function generate() {
  console.log('🤖 Commencing static SEO Sitemap & Robots.txt generation...');

  // Ensure directories exist
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // 1. Static Routes to index
  const routes = [
    { path: '', changefreq: 'weekly', priority: 1.0 },
    { path: 'about', changefreq: 'monthly', priority: 0.8 },
    { path: 'experience', changefreq: 'monthly', priority: 0.8 },
    { path: 'projects', changefreq: 'weekly', priority: 0.9 },
    { path: 'education', changefreq: 'monthly', priority: 0.7 },
    { path: 'contact', changefreq: 'yearly', priority: 0.6 },
  ];

  const xmlEntries: string[] = [];

  // Add static page routes
  routes.forEach((route) => {
    const urlPath = route.path ? `/${route.path}` : '';
    xmlEntries.push(`  <url>
    <loc>${SITE_URL}${urlPath}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`);
  });

  // 2. Dynamic Project Routes
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const projectsRaw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const projects = JSON.parse(projectsRaw);
      
      if (Array.isArray(projects)) {
        projects.forEach((proj: any) => {
          const slug = ID_TO_SLUG[proj.id] || proj.id;
          xmlEntries.push(`  <url>
    <loc>${SITE_URL}/projects/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
        });
      }
    } else {
      console.warn(`⚠️ Warning: Projects content file not found at ${PROJECTS_FILE}`);
    }
  } catch (err: any) {
    console.error('❌ Error reading projects for sitemap:', err.message);
  }

  // Generate Sitemap XML structure
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries.join('\n')}
</urlset>`;

  // Generate Robots.txt structure
  const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Directories to block from scraping/indexing
Disallow: /api/
Disallow: /admin
Disallow: /login

# AI Crowlers & Scraping Rules (Block excessive aggressive crawlers if desired, but allow smart indexing)
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: PerplexityBot
Allow: /

# Sitemap Location
Sitemap: ${SITE_URL}/sitemap.xml
`;

  // Write sitemap.xml
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('✅ Created /public/sitemap.xml');

  // Write robots.txt
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('✅ Created /public/robots.txt');

  // If dist/ already exists (post-build step or developer flow), copy there as well
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf-8');
    console.log('✅ Copied sitemap.xml & robots.txt directly into /dist');
  }

  console.log('🚀 Sitemap & Robots.txt generation complete!');
}

generate();
