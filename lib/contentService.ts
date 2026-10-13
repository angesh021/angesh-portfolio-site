/**
 * @fileoverview
 * Loads and manages multilingual content dynamically.
 */

import { ContentSchemaMap } from './schemas';

const rawContent = import.meta.glob('../content/**/*.json', { eager: true });

type ContentData = Record<string, any>;
type LocaleCache = Record<string, ContentData>;
type I18nCache = Record<string, LocaleCache>;

// Normalize glob paths to a structured object:
// { "en": { "site": { ... }, "experience": { ... } }, "fr": { ... } }
const buildContentCache = (): I18nCache => {
  const cache: I18nCache = {};
  
  for (const path in rawContent) {
    // path looks like: ../content/en/site.json
    const parts = path.split('/');
    const fileName = parts.pop(); // site.json
    const language = parts.pop(); // en, fr, etc.
    
    if (!language || !fileName) continue;
    
    const category = fileName.replace('.json', '');
    
    if (!cache[language]) {
      cache[language] = {};
    }
    
    // The imported JSON module is typically { default: { ... } } or just the object
    const module = rawContent[path] as any;
    const data = module.default || module;
    
    // Optional schema validation using Zod
    if (category in ContentSchemaMap) {
      const result = (ContentSchemaMap as any)[category].safeParse(data);
      if (!result.success) {
        console.warn(`[I18N Validation] Failed to validate ${language}/${category}.json:`, result.error.issues);
      }
    }
    
    cache[language][category] = data;
  }
  
  return cache;
};

const contentCache = buildContentCache();

/**
 * Gets content for a specific category and language.
 * Falls back to English ('en') if the language or content is missing.
 */
export function getContent<T = any>(category: string, lang: string): T {
  // Check if requested language has the category
  if (contentCache[lang] && contentCache[lang][category]) {
    return contentCache[lang][category] as T;
  }
  
  // Fallback to English
  if (contentCache['en'] && contentCache['en'][category]) {
    return contentCache['en'][category] as T;
  }
  
  // Return empty object/array if not found at all
  console.warn(`Content for category '${category}' completely missing.`);
  const isArrayCategory = ['education', 'certifications', 'projects', 'experience', 'skills'].includes(category);
  return (isArrayCategory ? [] : {}) as any;
}

/**
 * Returns available languages based on configured folders (e.g. ['en', 'fr']).
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(contentCache);
}

