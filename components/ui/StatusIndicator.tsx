import React from 'react';
import { motion } from 'framer-motion';

/**
 * A component that displays a blinking status indicator with text.
 * It's used in the hero section to indicate availability for work opportunities.
 *
 * @returns {JSX.Element} The StatusIndicator component.
 */
const StatusIndicator: React.FC = () => {
    return (
        <motion.div 
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative flex items-center justify-center w-4 h-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <p className="font-mono text-sm text-primary tracking-widest">
                STATUS: OPEN TO NEW OPPORTUNITIES
            </p>
        </motion.div>
    );
};

export default StatusIndicator;
