import React from 'react';
import { motion } from 'framer-motion';

// FIX: Change props type to `any` to resolve type conflict between React.SVGProps and Framer Motion's SVGMotionProps.
const IconCloud: React.FC<any> = (props) => (
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
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </motion.svg>
);

export default IconCloud;