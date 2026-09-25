
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

/**
 * A button component that allows the user to toggle between light and dark themes.
 * It displays a sun or moon icon based on the current theme.
 *
 * @returns {JSX.Element} A button for toggling the theme.
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-full text-light-text-secondary hover:bg-light-bg-alt dark:text-dark-text-secondary dark:hover:bg-dark-card transition-colors"
      aria-label="Toggle theme"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5 text-primary" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;