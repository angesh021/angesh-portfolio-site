import React, { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Custom hook to detect if the user has a preference for reduced motion.
 * @returns {boolean} True if the user prefers reduced motion, otherwise false.
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is defined (for server-side rendering safety)
    if (typeof window === 'undefined') {
      return;
    }
    
    const mediaQuery = window.matchMedia(QUERY);
    
    // Set the initial state
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
};