import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Import Variants from framer-motion to correctly type animation variants.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
    GraduationCap, MapPin, Calendar, ChevronDown, ChevronLeft, 
    ChevronRight, X, Minus, Square, Award, Medal, ShieldCheck, 
    Loader, FileText, ListChecks, Focus, BookOpen, Ribbon
} from 'lucide-react';
import Section from '../layout/Section';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import type { EducationItem, Certification, Translations } from '../../types';
import FutureDirectivesRoadmap from '../ui/FutureDirectivesRoadmap';
import { useTheme } from '../../hooks/useTheme';

// --- New Credential Viewer Modal (Handles Images & PDFs) ---
const CredentialViewerModal: React.FC<{
  credentialUrl: string;
  certificateName: string;
  badgeImageUrl?: string;
  onClose: () => void;
}> = ({ credentialUrl, certificateName, badgeImageUrl, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isPdf = credentialUrl.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="pdf-modal-container" aria-modal="true" role="dialog">
      <motion.div
        className="pdf-modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={modalRef}
        className="pdf-modal-panel"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdf-modal-header">
          <h2 className="pdf-modal-title">
            {badgeImageUrl && (
              <img
                src={badgeImageUrl}
                alt={`${certificateName} badge`}
                className="h-6 w-auto mr-3 rounded-sm object-contain"
              />
            )}
            <FileText size={16} />
            <span>{certificateName}</span>
          </h2>
          <button onClick={onClose} className="pdf-modal-close-btn" aria-label="Close PDF viewer">
            <X size={20} />
          </button>
        </div>
        <div className="pdf-modal-content">
          {isPdf ? (
            <iframe src={credentialUrl} title={certificateName} width="100%" height="100%" />
          ) : (
            <img src={credentialUrl} alt={certificateName} />
          )}
        </div>
      </motion.div>
    </div>
  );
};


// --- Reusable Content Components ---

const EducationTimeline: React.FC<{ education: EducationItem[] }> = ({ education }) => {
    if (!Array.isArray(education) || education.length === 0) {
        return (
            <div className="text-center p-8 font-mono text-dark-text-secondary">
                NO ACADEMIC RECORDS AVAILABLE
            </div>
        );
    }
    return (
        <div className="timeline">
            {education.map((item, index) => (
                <EducationTimelineCard
                    key={item.institution}
                    item={item}
                    side={index % 2 === 0 ? 'left' : 'right'}
                />
            ))}
        </div>
    );
};

// --- New Certification Components ---

const CertificationBadge: React.FC<{ cert: Certification }> = ({ cert }) => {
    return (
        <div className="holographic-badge-v3">
            {cert.badgeImageUrl ? (
                <img 
                    src={cert.badgeImageUrl} 
                    alt={`${cert.name} badge`} 
                    className={`holographic-badge-v3-image-content ${cert.needsBackgroundInDarkMode ? 'dark-mode-badge-bg' : ''}`}
                />
            ) : (
                <div className="holographic-badge-v3-text-content">
                    {cert.shortName}
                </div>
            )}
        </div>
    );
};

const ProfessionalCertifications: React.FC<{
  certifications: Certification[];
  onVerifyClick: (cert: Certification) => void;
}> = ({ certifications, onVerifyClick }) => {
    const { t } = useI18n();
    const [[page, direction], setPage] = useState([0, 0]);
    const [isVerifying, setIsVerifying] = useState(false);
    const verificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Guard if certifications is empty or not an array to prevent TypeError when activeCert is accessed
    if (!Array.isArray(certifications) || certifications.length === 0) {
        return (
            <div className="text-center p-8 font-mono text-dark-text-secondary max-w-md mx-auto">
                {t('no_certifications') || '// NO CERTIFICATIONS AVAILABLE'}
            </div>
        );
    }

    const activeCert = certifications[page];

    const paginate = (newDirection: number) => {
        let newIndex = page + newDirection;
        if (newIndex < 0) {
            newIndex = certifications.length - 1;
        } else if (newIndex >= certifications.length) {
            newIndex = 0;
        }

        if (verificationTimer.current) clearTimeout(verificationTimer.current);

        setIsVerifying(true);
        setPage([newIndex, newDirection]);

        verificationTimer.current = setTimeout(() => {
            setIsVerifying(false);
        }, 600); // Duration matches the scan animation
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        const rect = carouselRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        carouselRef.current.style.setProperty('--mouse-x', `${x}px`);
        carouselRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    const slideVariants = {
        center: { x: '0%', scale: 1, opacity: 1, zIndex: 2, filter: 'blur(0px)' },
        prev: { x: '-90%', scale: 0.8, opacity: 0.5, zIndex: 1, filter: 'blur(1px)' },
        next: { x: '90%', scale: 0.8, opacity: 0.5, zIndex: 1, filter: 'blur(1px)' },
        offscreenLeft: { x: '-150%', scale: 0.5, opacity: 0, zIndex: 0 },
        offscreenRight: { x: '150%', scale: 0.5, opacity: 0, zIndex: 0 },
    };
    
    // FIX: Add Variants type to fix type inference issues with transition properties.
    const panelContentVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    };

    // FIX: Add Variants type to fix type inference issues with transition properties.
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20, filter: 'blur(5px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 100, damping: 20 } },
    };

    const getPositionState = (index: number, currentPage: number, numItems: number) => {
        if (index === currentPage) return 'center';
        
        const prevPage = (currentPage - 1 + numItems) % numItems;
        if (index === prevPage) return 'prev';

        const nextPage = (currentPage + 1) % numItems;
        if (index === nextPage) return 'next';
        
        const distToRight = (index - currentPage + numItems) % numItems;
        const distToLeft = (currentPage - index + numItems) % numItems;
        
        return distToRight < distToLeft ? 'offscreenRight' : 'offscreenLeft';
    }

    return (
        <div className="relative h-full flex flex-col items-center justify-center">
            <div
                ref={carouselRef}
                onMouseMove={handleMouseMove}
                className="cert-carousel-container-v2"
            >
                <div className="cert-carousel-stage">
                    {certifications.map((cert, index) => {
                        const position = getPositionState(index, page, certifications.length);
                        return (
                            <motion.div
                                key={cert.id}
                                variants={slideVariants}
                                initial={false}
                                animate={position}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`cert-carousel-slide-v2 ${position !== 'center' ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (position === 'next') paginate(1);
                                    else if (position === 'prev') paginate(-1);
                                }}
                                tabIndex={position !== 'center' ? 0 : -1}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (position === 'next') paginate(1);
                                        else if (position === 'prev') paginate(-1);
                                    }
                                }}
                                aria-label={`View ${cert.name} certificate`}
                            >
                                <CertificationBadge cert={cert} />
                            </motion.div>
                        );
                    })}

                    <motion.button whileTap={{ scale: 0.9 }} className="cert-carousel-nav-btn left" onClick={() => paginate(-1)} aria-label="Previous certificate">
                        <ChevronLeft />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} className="cert-carousel-nav-btn right" onClick={() => paginate(1)} aria-label="Next certificate">
                        <ChevronRight />
                    </motion.button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={page}
                    className={`cert-details-panel ${isVerifying ? 'is-verifying' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    {isVerifying ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="cert-scanline" />
                            <p className="font-mono text-primary animate-pulse">{t('verify_integrity') || 'VERIFYING DATA INTEGRITY...'}</p>
                        </div>
                    ) : (
                        <div className="cert-details-content-wrapper">
                            <motion.div
                                variants={panelContentVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.div variants={itemVariants} className="cert-details-header">
                                    <div className="cert-details-title-wrapper">
                                        <h3 className="cert-details-title">[ {activeCert.name} ]</h3>
                                        <div className="cert-details-meta">
                                            <span className="flex items-center">
                                                <span className="font-bold mr-2">{t('cert_issuer') || 'ISSUER:'}</span>
                                                <span>{activeCert.issuer}</span>
                                            </span>
                                            <span className="mx-4 text-dark-text-secondary/50" aria-hidden="true">|</span>
                                            <span className="flex items-center">
                                                <span className="font-bold mr-2">{t('cert_date') || 'DATE:'}</span>
                                                <span>{activeCert.date}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <motion.a
                                        href={activeCert.credentialUrl}
                                        target={!activeCert.pdfUrl ? '_blank' : undefined}
                                        rel="noopener noreferrer"
                                        className="verify-btn-container"
                                        onClick={(e) => {
                                          if (activeCert.pdfUrl) {
                                            e.preventDefault();
                                            onVerifyClick(activeCert);
                                          }
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95, y: 2 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <span className="verify-btn-text">
                                            <ShieldCheck size={16} />
                                            {t('verify_credential') || 'VERIFY CREDENTIAL'}
                                        </span>
                                        <span className="verify-btn-glitch" aria-hidden="true">{t('verify_credential') || 'VERIFY CREDENTIAL'}</span>
                                    </motion.a>
                                </motion.div>
                                
                                <div>
                                    <motion.h4 variants={itemVariants} className="cert-details-section-title">{t('cert_description') || '// DESCRIPTION'}</motion.h4>
                                    <motion.p variants={itemVariants} className="cert-details-description">{t(activeCert.descriptionKey)}</motion.p>
                                    
                                    <motion.h4 variants={itemVariants} className="cert-details-section-title">{t('cert_skills') || '// SKILLS GAINED'}</motion.h4>
                                    <motion.div
                                        variants={panelContentVariants}
                                        className="cert-details-skills-list"
                                    >
                                        {activeCert.skillsGained.map(skill => (
                                            <motion.span key={skill} variants={itemVariants} className="cert-details-skill-tag">{skill}</motion.span>
                                        ))}
                                    </motion.div>

                                    <motion.h4 variants={itemVariants} className="cert-details-section-title">{t('cert_benefits') || '// PROFESSIONAL BENEFITS'}</motion.h4>
                                    <motion.ul
                                        variants={panelContentVariants}
                                        className="cert-details-benefits-list"
                                    >
                                        {activeCert.benefits.map(benefit => (
                                            <motion.li key={benefit} variants={itemVariants} className="cert-details-benefit-item">{benefit}</motion.li>
                                        ))}
                                    </motion.ul>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};


// --- Main Layout Components ---

const getGradeIcon = (grade?: string) => {
    if (!grade) return null;
    const lowerGrade = grade.toLowerCase();
    if (lowerGrade.includes('distinction')) {
        return { Icon: Award, color: '#ffd700', label: 'Distinction' };
    }
    if (lowerGrade.includes('merit')) {
        return { Icon: Medal, color: '#c0c0c0', label: 'Merit' };
    }
    if (lowerGrade.includes('progress')) {
        return { Icon: Loader, color: '#00aeff', label: 'In Progress' };
    }
    if (lowerGrade.includes('honours')) {
        return { Icon: Ribbon, color: '#64ffda', label: 'Honours' };
    }
    // Updated condition to catch pass or other completed grades
    if (lowerGrade.includes('second class') || lowerGrade.includes('first class') || lowerGrade.includes('pass')) {
        return { Icon: ShieldCheck, color: '#64ffda', label: 'Completed' };
    }
    return null;
};

const WesMifiBadge: React.FC = () => {
    const { t } = useI18n();

    return (
        <motion.div 
            variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
            }}
            className="mb-8 relative flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6 p-4 rounded-2xl bg-white/40 dark:bg-[#10141d]/40 border border-neutral-200/60 dark:border-[#1e222b]/40 shadow-sm backdrop-blur-md overflow-hidden group/wes transition-all duration-300 hover:shadow-md hover:bg-white/60 dark:hover:bg-[#10141d]/60"
        >
            <div className="flex-1 flex flex-col justify-center text-center sm:text-left pr-0 sm:pr-4 sm:border-r border-neutral-200/60 dark:border-[#1e222b]/40">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <ShieldCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
                    <span className="text-neutral-700 dark:text-[#b4ae9c] text-[10px] font-mono tracking-widest uppercase font-black">
                        {t('edu_wes_mifi_title') || 'CANADIAN EQUIVALENCY VERIFICATION'}
                    </span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 font-medium">
                    {t('edu_wes_mifi_evaluation')}
                </p>
            </div>

            <div className="flex flex-row items-center justify-center gap-6 sm:gap-8 shrink-0">
                {/* WES Credly Embedded Badge */}
                <a 
                    href="https://www.credly.com/badges/576679ed-a1e1-4289-b4f5-0762cae3e9aa/public_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                    <div className="w-12 h-12 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <img 
                            src="https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/badges/wes.png" 
                            alt="WES Verified Credential" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain select-none drop-shadow-sm"
                        />
                    </div>
                </a>

                {/* MIFI Logo Seal */}
                <div className="flex flex-col items-center gap-2 cursor-default group">
                    <div className="w-12 h-12 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                        <img 
                            src="https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/badges/Logo_MIFI.png" 
                            alt="MIFI Quebec Logo" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain select-none drop-shadow-sm filter pointer-events-none"
                        />
                    </div>
                </div>
            </div>
            
            {/* Ambient glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 translate-x-[-150%] skew-x-[-30deg] group-hover/wes:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
        </motion.div>
    );
};

const EducationTimelineCard: React.FC<{ item: EducationItem; side: 'left' | 'right' }> = ({ item, side }) => {
    const { t } = useI18n();
    const { degree, institution, period, location, grade, description, key_areas, focus_area, details } = item;
    const [isExpanded, setIsExpanded] = useState(false);
    const [logMessage, setLogMessage] = useState('');
    const [isAccessing, setIsAccessing] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const gradeInfo = getGradeIcon(grade);
    const detailsId = `details-${institution.replace(/\s+/g, '-')}`;

    // FIX: Add Variants type to fix type inference issues with transition properties.
    const contentVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
    };
    // FIX: Add Variants type to fix type inference issues with transition properties.
    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleToggleDetails = () => {
        if (isAccessing) return;

        if (isExpanded) {
            setIsExpanded(false);
            return;
        }

        setIsAccessing(true);
        setLogMessage(''); // Reset
        
        const fullMessage = t('edu_accessing_records') || '> Accessing records... syllabus_data.log... GRANTED';
        let i = 0;
        
        const type = () => {
            if (i < fullMessage.length) {
                setLogMessage(prev => prev + fullMessage.charAt(i));
                i++;
                timeoutRef.current = setTimeout(type, 30);
            } else {
                // Typing is done, wait before expanding
                timeoutRef.current = setTimeout(() => {
                    setIsExpanded(true);
                    // Clear message after expansion animation starts
                    timeoutRef.current = setTimeout(() => {
                        setLogMessage('');
                        setIsAccessing(false);
                    }, 500);
                }, 200);
            }
        };
        
        type();
    };


    return (
        <motion.div
            className={`timeline-item ${side}`}
            initial={{ opacity: 0, x: side === 'left' ? -100 : 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.div
                className="timeline-node-icon"
                initial={{ scale: 0, rotate: -90 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
            >
                <GraduationCap size={24} />
            </motion.div>
            <motion.div
                className="timeline-connector"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.6, 0.05, -0.01, 0.9], delay: 0.4 }}
            />
            
            <motion.div 
                className="timeline-content"
                variants={contentVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-dark-text">{degree}</h3>
                            <p className="text-primary font-semibold">{institution}</p>
                        </div>
                        {gradeInfo && (
                            <div className="grade-badge" style={{ color: gradeInfo.color }} aria-label={`Grade: ${gradeInfo.label}`}>
                                <gradeInfo.Icon size={28} className="grade-badge-icon" style={{ animationName: gradeInfo.label.includes('Progress') ? 'none' : 'stamp-in', filter: `drop-shadow(0 0 8px ${gradeInfo.color}80)` }} />
                                <span>{gradeInfo.label}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-dark-text-secondary my-3">
                    <div className="flex items-center gap-2"><Calendar size={14} /><span>{period}</span></div>
                    <div className="flex items-center gap-2"><MapPin size={14} /><span>{location}</span></div>
                </motion.div>
                
                <WesMifiBadge />
                
                {/* New Content Sections */}
                <motion.div variants={itemVariants}>
                    <h4 className="timeline-card-section-title"><FileText size={14} />{t('edu_description') || 'Description'}</h4>
                    <p className="text-sm text-dark-text-secondary">{description || ''}</p>
                </motion.div>
                
                {Array.isArray(key_areas) && key_areas.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <h4 className="timeline-card-section-title"><ListChecks size={14} />{t('edu_key_areas') || 'Key Areas'}</h4>
                        <div className="flex flex-wrap gap-2">
                            {key_areas.map(area => <span key={area} className="key-area-badge">{area}</span>)}
                        </div>
                    </motion.div>
                )}

                {focus_area && (
                    <motion.div variants={itemVariants}>
                        <h4 className="timeline-card-section-title"><Focus size={14} />{t('edu_focus_area') || 'Focus Area'}</h4>
                        <p className="text-sm font-semibold text-dark-text">{focus_area}</p>
                    </motion.div>
                )}

                <div className="timeline-access-log">
                    {logMessage}
                    {isAccessing && logMessage.length < 47 && (
                        <span className="inline-block w-2 h-3 bg-primary ml-1 animate-pulse" />
                    )}
                </div>
                
                {/* Collapsible Details */}
                <AnimatePresence initial={false}>
                    {isExpanded && Array.isArray(details) && details.length > 0 && (
                        <motion.div
                            id={detailsId}
                            key="content"
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            variants={{
                                open: { opacity: 1, height: "auto" },
                                collapsed: { opacity: 0, height: 0 }
                            }}
                            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                            className="overflow-hidden"
                        >
                            <ul className="space-y-2 text-sm list-none pl-0 mt-4">
                                {details.map((detail, i) => (
                                    <li key={i} className="timeline-description-item text-dark-text-secondary">
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                                <motion.button
                    onClick={handleToggleDetails}
                    className="details-toggle-v2 mt-4"
                    variants={itemVariants}
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    disabled={isAccessing}
                >
                    <BookOpen size={16} />
                    <span>{isExpanded ? (t('hide_syllabus') || 'Hide Full Syllabus') : (t('view_syllabus') || 'View Full Syllabus')}</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown size={16} />
                    </motion.div>
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

/**
 * The Education section component.
 * It presents educational background, certifications, and future directives in an integrated "hub" layout.
 */
const EducationSection: React.FC = () => {
  const { t, language } = useI18n();
  const education = React.useMemo(() => getContent<EducationItem[]>('education', language) || [], [language]);
  const certifications = React.useMemo(() => getContent<Certification[]>('certifications', language) || [], [language]);
  const [viewingCredential, setViewingCredential] = useState<{ url: string; name: string; badgeImageUrl?: string; } | null>(null);

  const handleVerifyClick = (cert: Certification) => {
    if (cert.pdfUrl) {
      setViewingCredential({ url: cert.pdfUrl, name: cert.name, badgeImageUrl: cert.badgeImageUrl });
    }
  };

  return (
    <>
      <Section id="education" title={t('education_title')}>
          <div className="flex flex-col items-center gap-16">
              {/* 1. Academic Records */}
              <motion.div 
                  className="w-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                   <h3 className="data-panel-header text-center mb-0">{t('section_academic_records') || '// ACADEMIC_RECORDS'}</h3>
                  <EducationTimeline education={education} />
              </motion.div>

              {/* 2. Certification Badges */}
              <motion.div 
                  className="w-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                  <h3 className="data-panel-header text-center">{t('section_professional_certs') || '// PROFESSIONAL_CERTIFICATIONS'}</h3>
                  <ProfessionalCertifications certifications={certifications} onVerifyClick={handleVerifyClick} />
              </motion.div>

              {/* 3. Future Plans */}
              <motion.div 
                  className="w-full max-w-5xl"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                  <h3 className="data-panel-header text-center">{t('section_future_directives') || '// STRATEGIC_ROADMAP'}</h3>
                  <p className="text-center text-dark-text-secondary mb-12 max-w-2xl mx-auto text-sm">{t('future_plans_description')}</p>
                  <FutureDirectivesRoadmap />
              </motion.div>
          </div>
      </Section>
      <AnimatePresence>
        {viewingCredential && (
          <CredentialViewerModal
            credentialUrl={viewingCredential.url}
            certificateName={viewingCredential.name}
            badgeImageUrl={viewingCredential.badgeImageUrl}
            onClose={() => setViewingCredential(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EducationSection;