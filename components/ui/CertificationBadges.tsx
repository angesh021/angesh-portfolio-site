import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import { Certification } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return isMobile;
};

const Badge: React.FC<{ cert: Certification }> = ({ cert }) => (
    <div className="flex flex-col items-center w-full" aria-label={cert.name}>
        <p className="font-mono text-xs md:text-sm text-primary mb-4 text-center h-10 flex items-center justify-center max-w-full px-2">
            {cert.name}
        </p>
        <div className="w-36 h-36 flex items-center justify-center">
            <img 
                src={cert.badgeImageUrl} 
                alt={`${cert.name} badge`} 
                className={`max-w-full max-h-full object-contain ${cert.needsBackgroundInDarkMode ? 'dark-mode-badge-bg p-1 rounded-lg' : ''}`}
            />
        </div>
    </div>
);

const CertificationBadges: React.FC = () => {
    const { language } = useI18n();
    const certifications = useMemo(() => getContent<Certification[]>('certifications', language) || [], [language]);
    
    // Feature key certifications that are visually distinct and important
    const featuredCerts = certifications.filter(c => ['btl1', 'sixsigma-black', 'ccna'].includes(c.id));
    const isMobile = useIsMobile();
    const [[page, direction], setPage] = useState([0, 0]);

    const paginate = (newDirection: number) => {
        let newIndex = page + newDirection;
        if (newIndex < 0) newIndex = featuredCerts.length - 1;
        else if (newIndex >= featuredCerts.length) newIndex = 0;
        setPage([newIndex, newDirection]);
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
    };

    if (isMobile) {
        return (
            <div className="relative w-full h-64 flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = swipePower(offset.x, velocity.x);
                                if (swipe < -swipeConfidenceThreshold) paginate(1);
                                else if (swipe > swipeConfidenceThreshold) paginate(-1);
                            }}
                            className="absolute w-full flex justify-center"
                        >
                            <Badge cert={featuredCerts[page]} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <motion.button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-light-card/50 dark:bg-dark-card/50 text-primary hover:bg-light-card dark:hover:bg-dark-card transition-colors"
                    onClick={() => paginate(-1)}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Previous certificate"
                >
                    <ChevronLeft size={24} />
                </motion.button>
                <motion.button
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-light-card/50 dark:bg-dark-card/50 text-primary hover:bg-light-card dark:hover:bg-dark-card transition-colors"
                    onClick={() => paginate(1)}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Next certificate"
                >
                    <ChevronRight size={24} />
                </motion.button>

                <div className="absolute bottom-4 flex gap-2">
                    {featuredCerts.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage([i, i > page ? 1 : -1])}
                            className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-primary' : 'bg-light-text-secondary/50 dark:bg-dark-text-secondary/50'}`}
                            aria-label={`Go to badge ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-row items-start gap-8 justify-center">
            {featuredCerts.map((cert, index) => (
                <motion.div
                    key={cert.name}
                    className="flex-1 min-w-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.05, transition: { type: 'spring', stiffness: 300 } }}
                >
                    <Badge cert={cert} />
                </motion.div>
            ))}
        </div>
    );
};

export default CertificationBadges;