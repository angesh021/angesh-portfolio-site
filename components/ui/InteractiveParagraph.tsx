import React from 'react';
// FIX: Import Variants to correctly type framer-motion variants object.
import { motion, Variants } from 'framer-motion';

interface InteractiveParagraphProps {
  text: string;
  keywords: string[];
  className?: string;
}

// Variants for the main paragraph container to orchestrate children animations
const paragraphVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02, // Stagger reveals each word quickly
    },
  },
};

// Variants for each individual word
// FIX: Add Variants type to fix type inference issue with 'type' property in transition.
const wordVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10,
    },
  },
};

/**
 * A component that animates a paragraph with a "data stream" reveal effect
 * and highlights specified keywords on hover.
 */
const InteractiveParagraph: React.FC<InteractiveParagraphProps> = ({ text, keywords, className }) => {
  // Split by spaces but keep them in the array for correct sentence structure
  const wordsAndSpaces = text.split(/(\s+)/); 

  return (
    <motion.p
      className={className}
      variants={paragraphVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {wordsAndSpaces.map((segment, index) => {
        // Check if the current segment (word) is a keyword
        const isKeyword = keywords.some(kw => 
          segment.toLowerCase().includes(kw.toLowerCase())
        );

        if (isKeyword) {
          return (
            // Animated container for the keyword
            <motion.span key={index} variants={wordVariants}>
              <motion.span
                className="keyword"
                style={{ color: 'inherit', textShadow: 'none' }} // Set initial state
                whileHover={{
                  color: '#64ffda', // primary color
                  textShadow: '0 0 8px rgba(100, 255, 218, 0.7)',
                  cursor: 'pointer', // Clearly indicate interactivity
                }}
              >
                {segment}
              </motion.span>
            </motion.span>
          );
        }

        // It's a regular word or space
        return (
          <motion.span key={index} variants={wordVariants}>
            {segment}
          </motion.span>
        );
      })}
    </motion.p>
  );
};

export default InteractiveParagraph;