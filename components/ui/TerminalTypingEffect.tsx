import React from 'react';
// FIX: Import Variants to correctly type framer-motion variants object.
import { motion, Variants } from 'framer-motion';

interface TerminalTypingEffectProps {
  text: string;
  className?: string;
}

/**
 * A component that simulates a terminal typing effect for a given string.
 * Each character is revealed sequentially.
 *
 * @param {TerminalTypingEffectProps} props - The component props.
 * @returns {JSX.Element} A container with animated text spans.
 */
const TerminalTypingEffect: React.FC<TerminalTypingEffectProps> = ({ text, className }) => {
  const textChars = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: i * 0.04 },
    }),
  };

  // FIX: Add Variants type to fix type inference issue with 'type' property in transition.
  const child: Variants = {
    hidden: { opacity: 0, y: '5px' },
    visible: {
      opacity: 1,
      y: '0px',
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {textChars.map((char, index) => (
        <motion.span key={index} variants={child} style={{ display: 'inline-block' }}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
      <motion.span
        className="inline-block w-2 h-4 bg-primary ml-1"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
};

export default TerminalTypingEffect;