
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getContent, getAvailableLanguages } from '../lib/contentService';
import { AnalyticsTracker } from '../lib/analyticsTracker';

type Language = string;

interface I18nContextType {
  language: Language;
  availableLanguages: string[];
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AnalyticsTracker.trackEngagementEvent('language_switch', lang);
  }, []);

  const availableLanguages = useMemo(() => getAvailableLanguages(), []);

  const t = useCallback((key: string): string => {
    // Get language site content
    const langContent = getContent('site', language);
    if (langContent && langContent[key]) {
      return langContent[key];
    }
    
    // Fallback to English site content
    const enContent = getContent('site', 'en');
    if (enContent && enContent[key]) {
      return enContent[key];
    }
    
    return String(key);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t, availableLanguages }), [language, setLanguage, t, availableLanguages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
