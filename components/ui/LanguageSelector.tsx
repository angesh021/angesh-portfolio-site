
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useStreak } from '../../hooks/useStreak';
import { motion } from 'framer-motion';

/**
 * A component that provides buttons to switch the application's language.
 * Highlights the currently active language.
 *
 * @returns {JSX.Element} A set of buttons for language selection.
 */
const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useI18n();
  const { addPoints } = useStreak();

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    if (language !== lang) {
      setLanguage(lang);
      addPoints(5, 'change_language');
    }
  };

  /**
   * A helper function to create a language button.
   * @param {'en' | 'fr'} lang - The language for this button.
   * @param {string} label - The text label for the button.
   * @returns {JSX.Element} A motion.button element.
   */
  const langButton = (lang: 'en' | 'fr', label: string) => (
    <motion.button
      onClick={() => handleLanguageChange(lang)}
      className={`px-3 py-1 text-sm rounded-md font-mono ${
        language === lang
          ? 'text-primary'
          : 'text-dark-text-secondary hover:text-primary'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {label}
    </motion.button>
  );

  return (
    <div className="flex items-center space-x-1 p-1 rounded-lg bg-gray-200 dark:bg-dark-card">
      {langButton('en', 'EN')}
      <div className="w-px h-4 bg-gray-400 dark:bg-dark-text-secondary"></div>
      {langButton('fr', 'FR')}
    </div>
  );
};

export default LanguageSelector;
