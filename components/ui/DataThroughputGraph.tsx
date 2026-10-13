import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const DataThroughputGraph: React.FC<{ color?: string, isScanning?: boolean }> = ({ color = '#64ffda', isScanning = false }) => {
    const pathLength = useMotionValue(0);
    const opacity = useTransform(pathLength, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const duration = isScanning ? 1.5 : 3;

    return (
        <div className="data-throughput-graph mt-4">
            <svg viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background grid lines */}
                <path d="M 0 5 H 100 M 0 10 H 100 M 0 15 H 100" stroke={color} strokeOpacity="0.1" strokeWidth="0.5" />
                
                {/* Animated graph line */}
                <motion.path
                    key={isScanning ? 'scanning' : 'idle'} // Remount component on scan state change to restart animation
                    d="M 0 10 C 10 2, 20 18, 30 10 C 40 2, 50 18, 60 10 C 70 2, 80 18, 90 10 C 95 5, 98 8, 100 10"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{
                        pathLength,
                        opacity,
                    }}
                    animate={{ pathLength: [0, 1, 0] }}
                    transition={{
                        duration,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                />
            </svg>
        </div>
    );
};

export default DataThroughputGraph;