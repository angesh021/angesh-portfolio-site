import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import type { Translations, FutureDirective } from '../../types';
import { Layers, CheckCircle, Clock, Search } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// --- Helper Functions & Components ---
const getStatusInfo = (status: 'Planned' | 'In Progress' | 'Researching') => {
    switch (status) {
        case 'In Progress':
            return { icon: Clock, color: '#ffc300', label: 'In Progress' }; // Yellow
        case 'Planned':
            return { icon: CheckCircle, color: '#00aeff', label: 'Planned' }; // Blue
        case 'Researching':
            return { icon: Search, color: '#da70d6', label: 'Researching' }; // Orchid
        default:
            return { icon: CheckCircle, color: '#8892b0', label: 'Status Unknown' };
    }
};

// --- Main Holo-Projector Component ---
const FutureDirectivesRoadmap: React.FC = () => {
    const { t, language } = useI18n();
    const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
    const futureDirectives = personalData.futureDirectives || [];
    
    const { uniformTheme, accentColor } = useTheme();
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeDirective = useMemo(() => futureDirectives.find((d: FutureDirective) => d.id === activeId), [activeId, futureDirectives]);
    const statusInfo = activeDirective ? getStatusInfo(activeDirective.status) : null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };
    
    const textContainerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.01, delayChildren: 0.4 } },
    };

    const textCharVariants = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 },
    };

    const displayStatusColor = uniformTheme && statusInfo ? accentColor : statusInfo?.color;

    return (
        <motion.div
            className="holo-projector-roadmap"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            {/* Main Projector Area */}
            <div className="holo-projector-main">
                <div className="holo-projector-base" />
                <AnimatePresence>
                    {activeDirective && statusInfo ? (
                        <motion.div
                            key={activeDirective.id}
                            layoutId={`directive-card-${activeDirective.id}`}
                            className="holo-projector-projection"
                            onClick={() => setActiveId(null)}
                            aria-label={`De-select ${activeDirective.title}`}
                        >
                            <motion.img 
                                src={activeDirective.badgeImageUrl}
                                alt={`${activeDirective.title} badge`}
                                className={`holo-projector-icon ${activeDirective.needsBackgroundInDarkMode ? 'dark-mode-badge-bg' : ''}`}
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: 0.3 } }}
                            />
                            <motion.div
                                className="holo-status-badge"
                                style={{ ['--status-color' as any]: displayStatusColor }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
                            >
                                {activeDirective.status === 'Planned' && (t('status_planned') || 'Planned')}
                                {activeDirective.status === 'In Progress' && (t('status_in_progress') || 'In Progress')}
                                {activeDirective.status === 'Researching' && (t('status_researching') || 'Researching')}
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div className="holo-projector-placeholder">
                             <Layers size={48} className="icon" />
                             <p className="text">{t('edu_select_directive') || 'Select a Directive'}</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Projected Info */}
            <div className="holo-projector-info">
                <AnimatePresence mode="wait">
                    {activeDirective ? (
                         <motion.div
                            key={`info-${activeDirective.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="text-center"
                        >
                            <h3 className="holo-info-panel-title">{activeDirective.title}</h3>
                            <motion.p 
                                className="holo-info-panel-desc"
                                variants={textContainerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {t(activeDirective.descriptionKey).split('').map((char, index) => (
                                    <motion.span key={index} variants={textCharVariants}>
                                        {char}
                                    </motion.span>
                                ))}
                            </motion.p>
                            
                            <motion.h4
                                className="holo-info-panel-competencies-title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, transition: { delay: 1 } }}
                            >
                                {t('future_plans_competencies_title')}
                            </motion.h4>
                            <motion.div 
                                className="holo-info-panel-competencies-list"
                                initial="hidden"
                                animate="visible"
                                variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 1.2 } } }}
                            >
                                {activeDirective.keyCompetencies.map(comp => (
                                    <motion.span
                                        key={comp}
                                        className="competency-tag"
                                        variants={{
                                            hidden: { opacity: 0, y: 10 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        {comp}
                                    </motion.span>
                                ))}
                            </motion.div>

                        </motion.div>
                    ) : (
                        <motion.div
                            key="info-placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                </AnimatePresence>
            </div>


            {/* Data Cubes Dock */}
            <div className="holo-data-cubes-dock">
                {futureDirectives.map(directive => (
                    <div key={directive.id} className="holo-data-cube-wrapper">
                        {activeId !== directive.id && (
                             <motion.button
                                layoutId={`directive-card-${directive.id}`}
                                onClick={() => setActiveId(directive.id)}
                                className="holo-data-cube"
                                aria-label={`Select ${directive.title}`}
                            >
                                <motion.div className="holo-data-cube-icon">
                                    <img 
                                        src={directive.badgeImageUrl}
                                        alt={`${directive.title} badge`}
                                        className={`w-full h-full object-contain ${directive.needsBackgroundInDarkMode ? 'dark-mode-badge-bg' : ''}`}
                                    />
                                </motion.div>
                            </motion.button>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default FutureDirectivesRoadmap;
