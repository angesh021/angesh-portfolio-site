import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentEnDir = path.join(__dirname, 'content', 'en');
const contentFrDir = path.join(__dirname, 'content', 'fr');

const en_personal = {
  contactInfo: {
    email: 'angesh021@gmail.com',
    linkedin: 'https://www.linkedin.com/in/angesh-chanderdip/',
    github: 'https://github.com/angesh021',
    resumeUrl: '/AngeshChanderdip_Resume.pdf'
  },
  socialLinks: [
    { name: 'GitHub', url: 'https://github.com/angesh021', icon: 'Github' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/angesh-chanderdip/', icon: 'Linkedin' },
    { name: 'Email', url: 'mailto:angesh021@gmail.com', icon: 'Mail' }
  ],
  resumeHashes: [
    { algorithm: 'SHA-256', hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
    { algorithm: 'MD5', hash: 'e4d909c290d0fb1ca068ffaddf22cbd0' }
  ],
  futureDirectives: [
    {
      id: 'isc2-cc',
      title: '(ISC)² Certified in Cybersecurity (CC)',
      descriptionKey: 'future_plans_isc2cc',
      status: 'In Progress',
      badgeImageUrl: 'https://images.credly.com/size/680x680/images/611bd3fc-f91c-4bba-950c-e2f5bfe26ab5/image.png',
      keyCompetencies: ['Access Controls', 'Network Security', 'Security Operations', 'Incident Response']
    },
    {
      id: 'ccna',
      title: 'Cisco Certified Network Associate (CCNA)',
      descriptionKey: 'future_plans_ccna',
      status: 'Planned',
      badgeImageUrl: 'https://images.credly.com/size/680x680/images/f32b13ed-d6dd-41ed-adba-ce36e6baee0e/image.png',
      keyCompetencies: ['Network Fundamentals', 'IP Connectivity', 'Security Fundamentals', 'Automation'],
      needsBackgroundInDarkMode: true
    },
    {
      id: 'az-500',
      title: 'Microsoft Certified: Azure Security Engineer Associate (AZ-500)',
      descriptionKey: 'future_plans_az500',
      status: 'Planned',
      badgeImageUrl: 'https://images.credly.com/size/680x680/images/d687afc7-fcdc-44ab-b56d-f4dc3e8a4fe0/image.png',
      keyCompetencies: ['Manage Identity & Access', 'Implement Platform Protection', 'Secure Data & Apps', 'Security Operations']
    },
    {
      id: 'az-204',
      title: 'Microsoft Certified: Azure Developer Associate (AZ-204)',
      descriptionKey: 'future_plans_az204',
      status: 'Planned',
      badgeImageUrl: 'https://images.credly.com/size/680x680/images/99ba9fdf-fc11-40be-afa5-0aff45961ea3/image.png',
      keyCompetencies: ['Azure Compute Solutions', 'Azure Storage', 'Azure Security', 'Monitor & Optimize']
    }
  ],
  changelogData: [
    { version: 'v1.0.0', date: '2023-11-20', label: 'INITIAL_RELEASE', changes: ['System core successfully bootstrapped and online.', 'Primary neural pathways (UI components) stabilized.', 'Initial memory banks (projects and experience data) loaded.', 'Establish connection module instantiated.'] },
    { version: 'v1.1.0', date: '2023-12-05', label: 'UPDATE', changes: ['Enhanced responsive matrices across all display viewports.', 'Optimized visual rendering algorithms for Project cards.', 'Added localized data points to the experience timeline.'] },
    { version: 'v1.2.0', date: '2024-01-15', label: 'FEATURE', changes: ['Integrated advanced real-time system monitoring interfaces.', 'Deployed the Terminal Emulator for technical skill demonstration.', 'Upgraded security protocols on transmission forms.'] },
    { version: 'v1.4.0', date: '2024-04-10', label: 'SYSTEM_UPGRADE', changes: ['Implemented systemic content separation logic for multi-language support.', 'Upgraded translation engine to v2.0 for dynamic runtime toggling.', 'Refactored timeline data structures for greater extensibility.'] }
  ]
};

const fr_personal = JSON.parse(JSON.stringify(en_personal));

// Minor French translations for changelog as a bonus
fr_personal.changelogData[0].changes = ["Noyau système démarré et en ligne avec succès.", "Voies neuronales primaires (composants UI) stabilisées.", "Banques de mémoire initiales (données de projets et d'expérience) chargées.", "Module d'établissement de connexion instancié."];

const fileWrites = [
  { path: path.join(contentEnDir, 'personal.json'), data: en_personal },
  { path: path.join(contentFrDir, 'personal.json'), data: fr_personal }
];

for(const file of fileWrites) {
    fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2));
}

console.log('Personal data written');
