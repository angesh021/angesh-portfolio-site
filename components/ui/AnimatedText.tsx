import React from 'react';
// FIX: Import Variants to correctly type framer-motion variants object.
import { motion, Variants } from 'framer-motion';

/**
 * @interface AnimatedTextProps
 * @property {string} text - The text content to animate.
 * @property {string} [className] - Optional additional CSS classes.
 */
interface AnimatedTextProps {
  text: string;
  className?: string;
}

/**
 * A component that animates text by revealing it word by word.
 * This creates an engaging and dynamic effect for titles and subtitles.
 *
 * @param {AnimatedTextProps} props - The component props.
 * @returns {JSX.Element} A motion-enhanced h2 element.
 */
const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className }) => {
  const words = text.split(" ");

  // Variants for the container to orchestrate the children's animation
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: i * 0.04 },
    }),
  };

  // Variants for each word
  // FIX: Added Variants type to fix type inference issue with 'type' property in transition.
  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h2
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ marginRight: "0.25em" }} // Keep words spaced correctly
        >
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
};

export default AnimatedText;