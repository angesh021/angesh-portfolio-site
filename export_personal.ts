import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Compile ts down or just assume tsx
import { socialLinks, contactInfo, resumeHashes, futureDirectives, changelogData } from './lib/data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const personalData = {
  socialLinks,
  contactInfo,
  resumeHashes,
  futureDirectives,
  changelogData
};

const personalDataFr = JSON.parse(JSON.stringify(personalData));
// We can do minor translations if wanted, or leave it identical.

fs.writeFileSync(path.join(__dirname, 'content/en/personal.json'), JSON.stringify(personalData, null, 2));
fs.writeFileSync(path.join(__dirname, 'content/fr/personal.json'), JSON.stringify(personalDataFr, null, 2));
console.log('Exported personal data natively.');
