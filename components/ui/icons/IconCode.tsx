import React from 'react';
import { motion } from 'framer-motion';

// FIX: Change props type to `any` to resolve type conflict between React.SVGProps and Framer Motion's SVGMotionProps.
const IconCode: React.FC<any> = (props) => (
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
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </motion.svg>
);

export default IconCode;