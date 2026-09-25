import React from 'react';
import { motion } from 'framer-motion';

// FIX: Change props type to `any` to resolve type conflict between React.SVGProps and Framer Motion's SVGMotionProps.
const IconSearch: React.FC<any> = (props) => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </motion.svg>
);

export default IconSearch;