import React from 'react';
import { motion } from 'framer-motion';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  overflowVisible?: boolean;
}

/**
 * A reusable component for creating content sections with a consistent style.
 * It includes a styled, animated title that glitches on hover.
 *
 * @param {SectionProps} props - The component props.
 * @returns {JSX.Element} A styled section element.
 */
const Section: React.FC<SectionProps> = ({ id, title, children, overflowVisible = false }) => {
  const fullTitle = `# ${title}`;

  return (
    <section
      id={id}
      className="px-6 md:px-10 xl:px-16 py-20 md:py-24 xl:py-28 scroll-mt-24 md:scroll-mt-28"
    >
      <motion.div
        className={`max-w-7xl mx-auto ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="flex items-center mb-12">
          <h2 
            className="glitch-effect text-2xl md:text-3xl font-bold text-dark-text"
            data-text={fullTitle}
          >
            <span className="text-[#1b9ca6] dark:text-[#64ffda] font-mono mr-2">#</span>
            {title}
          </h2>
          <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700 ml-6"></div>
        </div>
        {children}
      </motion.div>
    </section>
  );
};

export default Section;