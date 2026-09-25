import React from 'react';
import { motion } from 'framer-motion';

// FIX: Change props type to `any` to resolve type conflict between React.SVGProps and Framer Motion's SVGMotionProps.
const IconTerminal: React.FC<any> = (props) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </motion.svg>
);

export default IconTerminal;