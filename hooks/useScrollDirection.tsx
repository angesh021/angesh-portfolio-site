import { useState, useEffect } from 'react';

/**
 * Custom hook to detect the direction of scroll.
 * @returns {'up' | 'down'} The current scroll direction.
 */
export const useScrollDirection = (): 'up' | 'down' => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    const threshold = 5;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener('scroll', updateScrollDirection);

    return () => {
      window.removeEventListener('scroll', updateScrollDirection);
    };
  }, []);

  return scrollDirection;
};