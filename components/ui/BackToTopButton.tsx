import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const pathLength = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 90,
  });

  useEffect(() => {
    const educationSection = document.getElementById('education');
    
    const handleScroll = () => {
        if (!educationSection) {
            // Fallback: show button after scrolling down 1.5 viewport heights
            setIsVisible(window.scrollY > window.innerHeight * 1.5);
            return;
        }
        // Show button when the top of the education section is above the middle of the viewport
        const triggerPoint = educationSection.offsetTop - (window.innerHeight / 2);
        setIsVisible(window.scrollY > triggerPoint);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className="back-to-top-button flex items-center justify-center"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          aria-label="Go to top of page"
        >
          <svg className="absolute w-full h-full" viewBox="0 0 100 100">
             {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-current text-primary/10"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Progress indicator */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              className="progress-ring__circle stroke-current text-primary"
              strokeWidth="5"
              fill="transparent"
              style={{ pathLength }}
            />
          </svg>
          <ChevronUp size={20} className="relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTopButton;