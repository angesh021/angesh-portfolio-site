import React from 'react';
import { motion } from 'framer-motion';

// FIX: Change props type to `any` to resolve type conflict between React.SVGProps and Framer Motion's SVGMotionProps.
const IconShield: React.FC<any> = (props) => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </motion.svg>
);

export default IconShield;