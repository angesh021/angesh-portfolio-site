import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useInView, Variants } from 'framer-motion';
import { Briefcase, Calendar, MapPin, X, ArrowUpRight, CheckSquare, Target, Clock, ChevronRight, TrendingUp, Zap, Shield, Server, ExternalLink, UserCheck, Users, GitBranch, Lightbulb, AlertOctagon, Quote, Download } from 'lucide-react';
import Section from '../layout/Section';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import type { Experience, Translations } from '../../types';
import { useTheme } from '../../hooks/useTheme';

// --- NEW: Helper function to generate a unique ID for each experience ---
const generateUniqueId = (experience: Experience): string => {
    // Using company and role should be unique enough for this dataset.
    // Replace spaces and special characters to create a valid ID.
    return `${experience.company}-${experience.role}`.replace(/[^a-zA-Z0-9]/g, '-');
};


// --- V6 Component: Curved Square Logo ---
const CompanyLogo: React.FC<{ logoUrl: string; companyName: string; bgColor?: string; large?: boolean; compact?: boolean }> = ({ logoUrl, companyName, bgColor, large = false, compact = false }) => {
    const [hasError, setHasError] = React.useState(false);

    // Get initials of company name
    const getInitials = (name: string) => {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const isGtechna = companyName.toLowerCase().includes('gtechna');

    if (isGtechna) {
        return (
            <div className={`company-logo ${large ? 'large' : ''} ${compact ? 'compact' : ''} flex items-center justify-center bg-white border border-neutral-200/40 dark:border-neutral-700/50 shadow-sm overflow-hidden select-none`} style={{ backgroundColor: '#ffffff' }}>
                <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]" xmlns="http://www.w3.org/2000/svg">
                    <text 
                        x="42" 
                        y="74" 
                        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                        fontSize="72" 
                        fontWeight="900" 
                        textAnchor="middle"
                        fill="#2c2e30"
                    >g</text>
                    <circle 
                        cx="70" 
                        cy="26" 
                        r="9.5" 
                        fill="#0da2f6" 
                    />
                </svg>
            </div>
        );
    }

    return (
        <div className={`company-logo ${large ? 'large' : ''} ${compact ? 'compact' : ''}`} style={{ backgroundColor: bgColor }}>
            {!hasError && logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt={`${companyName} logo`} 
                    className="logo-img" 
                    onError={() => setHasError(true)}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <span className={`font-sans font-black tracking-tight text-neutral-700 dark:text-[#64ffda] leading-none select-none ${large ? 'text-lg md:text-xl' : compact ? 'text-[9px]' : 'text-sm'}`}>
                    {getInitials(companyName)}
                </span>
            )}
        </div>
    );
};

const gmKeywords = ['modernization', 'global network security', 'Fortune 500', 'Cisco ISE', '802.1X', 'Zero Trust', 'Python', 'PowerShell', 'automation pipelines', '300 security servers', 'operational resilience', '90%', '150+ engineer-hours', '85%', '140+', '200+', 'digital-transformation'];
const beaumontKeywords = ['critical frontline patient support', 'vital signs', 'care plans', 'high-stakes hospital environment', 'compassionate care', 'strong teamwork', 'high-pressure environment'];
const gtechnaKeywords = ['SQL Server', 'PostgreSQL', 'VPN connectivity', 'virtual machines', 'network infrastructure', 'User Acceptance Testing', 'UAT', 'technical advisor', 'bilingual', 'Jira', 'Confluence', 'Windows/Linux', 'Quebec', 'Canada', 'North America'];

const HighlightKeywords: React.FC<{ text: string, keywords: string[] }> = ({ text, keywords }) => {
    if (!keywords || !keywords.length) return <>{text}</>;
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                keywords.some(kw => part.toLowerCase() === kw.toLowerCase()) ? (
                    <strong key={i} className="highlighted-keyword">{part}</strong>
                ) : (
                    part
                )
            )}
        </>
    );
};


// --- Company Brand Typography Customizers ---
const renderCompanyBrandName = (companyName: string) => {
    return (
        <div className="flex flex-col select-none text-left">
            <span className="font-sans font-bold text-base md:text-lg lg:text-xl text-neutral-800 dark:text-white leading-none">
                {companyName}
            </span>
        </div>
    );
};


const getLogoStyles = (company: string) => {
    switch (company) {
        case "GTECHNA":
        case "gtechna":
            return {
                imgClass: "w-8 h-8 md:w-9 md:h-9 object-contain scale-110",
                padding: "p-1"
            };
        case "General Motors":
            return {
                imgClass: "w-8 h-8 md:w-9 md:h-9 object-contain scale-110",
                padding: "p-1.5"
            };
        case "Junior Achievement Ireland":
            // JA logo is horizontal, needs slightly more horizontal space and scaling to fit nicely in square
            return {
                imgClass: "w-10 h-7 md:w-11 md:h-8 object-contain",
                padding: "p-1"
            };
        case "Beaumont Hospital":
            // Beaumont Hospital logo is a blue cross or crest, often narrower
            return {
                imgClass: "w-9 h-9 md:w-10 md:h-10 object-contain",
                padding: "p-1.5"
            };
        case "CareChoice Nursing Home":
            return {
                imgClass: "w-8 h-8 md:w-9 md:h-9 object-contain",
                padding: "p-1.5"
            };
        case "FirstCare Ireland":
            return {
                imgClass: "w-8 h-8 md:w-9 md:h-9 object-contain",
                padding: "p-1.5"
            };
        default:
            return {
                imgClass: "w-9 h-9 object-contain",
                padding: "p-1.5"
            };
    }
};


const getCardBackdropUrls = (companyName: string, role: string) => {
    const c = companyName.toLowerCase();
    const r = role.toLowerCase();
    
    let fallback = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop";
    let primary = "/assets/workexperience/default-background.png";

    if (c.includes('gtechna')) {
        primary = "/assets/workexperience/gtechna-background.png";
        fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/gtechna-background.png";
    } else if (c.includes('general motors') || c.includes('gm')) {
        primary = "/assets/workexperience/GM-background.png";
        fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/GM-background.png";
    } else if (c.includes('beaumont')) {
        primary = "/assets/workexperience/Beaumont-background.png";
        fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/Beaumont-background.png";
    } else if (c.includes('carechoice')) {
        primary = "/assets/workexperience/CareChioice-background.png";
        fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/CareChioice-background.png";
    } else if (c.includes('firstcare')) {
        primary = "/assets/workexperience/FirstCare-background.png";
        fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/FirstCare-background.png";
    } else if (c.includes('junior achievement')) {
        if (r.includes('stem')) {
            primary = "/assets/workexperience/JAI1-background.png";
            fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/JAI1-background.png";
        } else {
            primary = "/assets/workexperience/JAI2-background.png";
            fallback = "https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/WorkExperience/JAI2-background.png";
        }
    }

    return { primary, fallback };
};


// --- Refined Experience Card Component Custom-Styled ---
const ExperienceCard: React.FC<{ experience: Experience, onClick: () => void, layoutId: string, indexStr: string }> = ({ experience, onClick, layoutId, indexStr }) => {
    const { imgClass, padding } = getLogoStyles(experience.company);
    const backdropUrl = getCardBackdropUrls(experience.company, experience.role);
    const briefDesc = experience.description[0];
    const { uniformTheme, accentColor } = useTheme();
    const brandColor = uniformTheme ? accentColor : (experience.themeColor || '#1b9ca6');

    const metrics = experience.impactMetrics || [];
    const displayMetrics = [...metrics];
    if (displayMetrics.length === 2) {
        displayMetrics.push({
            value: 100,
            suffix: '%',
            label: 'Person-Centered ADLs Support',
            icon: 'shield'
        });
    }

    const isFullWidth = experience.company.toLowerCase().includes('firstcare');

    if (isFullWidth) {
        // Wide horizontal card for 5th experience (FirstCare Ireland)
        return (
            <motion.div
                layoutId={layoutId}
                whileHover={{ y: -4, scale: 1.005 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={onClick}
                className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#10141d] border border-neutral-200 dark:border-[#1e222b] hover:border-[#1b9ca6] dark:hover:border-[#64ffda] shadow-sm hover:shadow-xl transition-all duration-305 cursor-pointer text-left h-full flex flex-col md:flex-row"
                style={{ contentVisibility: 'auto' } as React.CSSProperties}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
                aria-label={`View details for ${experience.company}`}
            >
                {/* Floating Index */}
                <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur text-[10px] font-mono font-bold tracking-widest text-[#1b9ca6] dark:text-[#64ffda]">
                    {indexStr}
                </div>

                {/* Left Part: Text details & Metrics - displayed-last on mobile, displayed-first on tablet & desktop */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between order-last md:order-first relative z-10 bg-white dark:bg-[#10141d]">
                    <div>
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-neutral-200 dark:border-neutral-800 flex-shrink-0 overflow-hidden shadow-sm ${padding}`}>
                                <img 
                                    src={experience.logoUrl} 
                                    alt={`${experience.company} logo`} 
                                    className={`${imgClass}`} 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div>
                                <h3 className="font-sans font-bold text-xl text-neutral-900 dark:text-white leading-tight">
                                    {experience.company}
                                </h3>
                                <p className="text-[11px] font-mono text-[#1b9ca6] dark:text-[#64ffda] font-semibold mt-0.5 leading-none mb-2">
                                    {experience.role}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-neutral-450 dark:text-neutral-500 font-medium font-sans">
                                    <span className="flex items-center gap-1 bg-neutral-150/50 dark:bg-neutral-800/85 px-1.5 py-0.5 rounded leading-none">
                                        <Calendar size={11} className="text-neutral-400 dark:text-neutral-500" />
                                        <span className="text-neutral-600 dark:text-neutral-300 font-medium">{experience.period}</span>
                                    </span>
                                    <span className="flex items-center gap-1 bg-neutral-100/40 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800 px-1.5 py-0.5 rounded leading-none text-[#1b9ca6] dark:text-[#64ffda] font-mono font-black">
                                        <Clock size={11} />
                                        <span>{calculateServiceLength(experience.period)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                            {briefDesc}
                        </p>
                    </div>

                    {/* Metrics bottom row */}
                    <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/60 grid grid-cols-3 gap-4">
                        {displayMetrics.map((met, i) => (
                            <div key={i} className="text-left">
                                <div className="flex items-center gap-2 mb-1.5 font-mono">
                                    <div className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                                        {met.icon === 'zap' && <Zap size={14} className="text-amber-500" />}
                                        {met.icon === 'shield' && <Shield size={14} className="text-emerald-500" />}
                                        {met.icon === 'server' && <Server size={14} className="text-blue-500" />}
                                        {met.icon === 'trending-up' && <TrendingUp size={14} className="text-purple-500" />}
                                    </div>
                                    <span className="text-base md:text-lg font-black text-neutral-900 dark:text-white leading-none">
                                        {met.value}{met.suffix || ''}
                                    </span>
                                </div>
                                <p className="font-sans text-[9px] text-neutral-500 dark:text-neutral-400 tracking-tight leading-snug">
                                    {met.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-[40%] min-h-[220px] relative overflow-hidden flex-shrink-0 order-first md:order-last -mb-px md:mb-0 md:-ml-px">
                    <img 
                        src={backdropUrl.primary} 
                        onError={(e) => { if (e.currentTarget.src !== backdropUrl.fallback) e.currentTarget.src = backdropUrl.fallback; }}
                        alt={`${experience.company} office`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-white/50 to-transparent dark:from-[#10141d] dark:via-[#10141d]/50 dark:to-transparent" />
                </div>
            </motion.div>
        );
    }

    // Standard card layout (Card 01-04)
    return (
        <motion.div
            layoutId={layoutId}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={onClick}
            className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#10141d] border border-neutral-200 dark:border-[#1e222b] hover:border-[#1b9ca6] dark:hover:border-[#64ffda] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer text-left h-full"
            style={{ contentVisibility: 'auto' } as React.CSSProperties}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
            aria-label={`View details for ${experience.company}`}
        >
            {/* Absolute Index Number Badge */}
            <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur text-[10px] font-mono font-bold tracking-widest text-[#1b9ca6] dark:text-[#64ffda]">
                {indexStr}
            </div>

            {/* Banner image on top */}
            <div className="h-[180px] w-full relative overflow-hidden flex-shrink-0 -mb-px">
                <img 
                    src={backdropUrl.primary} 
                    onError={(e) => { if (e.currentTarget.src !== backdropUrl.fallback) e.currentTarget.src = backdropUrl.fallback; }}
                    alt={`${experience.company} background`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/20 via-neutral-950/40 to-white dark:to-[#10141d]" />
                
                {/* Floating Logo Container */}
                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-neutral-200/45 dark:border-neutral-700/40 overflow-hidden shadow-md flex-shrink-0 ${padding}`}>
                        <img 
                            src={experience.logoUrl} 
                            alt={`${experience.company} logo`} 
                            className={`${imgClass}`} 
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="p-6 flex-grow flex flex-col justify-between relative z-10 bg-white dark:bg-[#10141d] rounded-b-3xl">
                <div>
                    <div>
                        <h3 className="font-sans font-bold text-lg text-neutral-900 dark:text-white leading-tight">
                            {experience.company}
                        </h3>
                        <p className="text-[11px] font-mono text-[#1b9ca6] dark:text-[#64ffda] font-semibold mt-0.5 leading-none mb-2">
                            {experience.role}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-neutral-450 dark:text-neutral-500 font-medium font-sans">
                            <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/85 px-1.5 py-0.5 rounded leading-none">
                                <Calendar size={11} className="text-neutral-400 dark:text-neutral-500" />
                                <span className="text-neutral-600 dark:text-neutral-300 font-medium">{experience.period}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800 px-1.5 py-0.5 rounded leading-none text-[#1b9ca6] dark:text-[#64ffda] font-mono font-black">
                                <Clock size={11} />
                                <span>{calculateServiceLength(experience.period)}</span>
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 line-clamp-3 leading-relaxed">
                        {briefDesc}
                    </p>
                </div>

                {/* Metrics Bottom Row */}
                <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800/60 grid grid-cols-3 gap-3">
                    {displayMetrics.map((met, i) => (
                        <div key={i} className="text-left">
                            <div className="flex items-center gap-1.5 mb-1 font-mono">
                                <div className="text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                                    {met.icon === 'zap' && <Zap size={12} className="text-amber-500" />}
                                    {met.icon === 'shield' && <Shield size={12} className="text-emerald-500" />}
                                    {met.icon === 'server' && <Server size={12} className="text-blue-500" />}
                                    {met.icon === 'trending-up' && <TrendingUp size={12} className="text-purple-500" />}
                                </div>
                                <span className="text-sm md:text-base font-black text-neutral-900 dark:text-white leading-none">
                                    {met.value}{met.suffix || ''}
                                </span>
                            </div>
                            <p className="font-sans text-[9px] text-neutral-500 dark:text-neutral-400 tracking-tight leading-tight line-clamp-2">
                                {met.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};


// --- New Feature Sub-Components ---
const AnimatedCounter: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
    const spring = useSpring(0, { mass: 0.8, stiffness: 100, damping: 15 });

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [isInView, value, spring]);

    useEffect(() => {
        const unsubscribe = spring.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
            }
        });
        return () => unsubscribe();
    }, [suffix, spring]);

    return <span ref={ref}>0{suffix}</span>;
};

const iconMap = {
    server: <Server size={24} />,
    zap: <Zap size={24} />,
    shield: <Shield size={24} />,
    'trending-up': <TrendingUp size={24} />,
};

const ImpactDashboard: React.FC<{ metrics?: Experience['impactMetrics'] }> = ({ metrics }) => {
    if (!metrics || metrics.length === 0) return null;
    
    const containerVariants = {
      visible: { transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            className="impact-dashboard"
            variants={containerVariants}
        >
            {metrics.map((metric, index) => (
                <motion.div key={index} className="impact-metric-card" variants={itemVariants}>
                    <div className={`impact-metric-icon metric-icon-${metric.icon}`}>{iconMap[metric.icon]}</div>
                    <div className="impact-metric-value">
                        <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                    </div>
                    <p className="impact-metric-label">{metric.label}</p>
                </motion.div>
            ))}
        </motion.div>
    );
};

const OperationalSnapshot: React.FC<{ log?: Experience['dailyLog'] }> = ({ log }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!log || log.length === 0) return null;

    return (
        <div className="operational-snapshot-container">
            <button onClick={() => setIsOpen(!isOpen)} className="snapshot-toggle-btn">
                <Clock size={16} />
                <span>Operational Snapshot</span>
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                    <ChevronRight size={16} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="operational-snapshot-panel"
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {log.map((entry, index) => (
                            <motion.div
                                key={index}
                                className={`log-entry ${entry.type}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className="log-time">{entry.time}</span>
                                <span className="log-task">{entry.task}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const calculateServiceLength = (period: string): string => {
    const [startStr, endStr] = period.split(' - ');
    const [startMonth, startYear] = startStr.split('/').map(Number);
    
    let endMonth, endYear;
    const lowerEnd = endStr.toLowerCase();
    if (lowerEnd === 'present' || lowerEnd === 'présent' || lowerEnd === 'en cours' || lowerEnd.includes('2026') || lowerEnd.includes('2025')) { // Handle current/future dates as "present"
        const today = new Date();
        endMonth = today.getMonth() + 1;
        endYear = today.getFullYear();
    } else {
        [endMonth, endYear] = endStr.split('/').map(Number);
    }

    if (!startMonth || !startYear || !endMonth || !endYear) {
        return '';
    }

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    
    if (totalMonths <= 0) return '';
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    let result = '';
    if (years > 0) {
        result += `${years} yr${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (result) result += ' ';
        result += `${months} mo${months > 1 ? 's' : ''}`;
    }
    
    return result ? `(${result})` : '';
};

// --- V6 Component: Experience Dossier (Modal) ---
const ExperienceDossier: React.FC<{ 
    experience: Experience, 
    onClose: () => void, 
    layoutId: string,
    clickOrigin: { x: number, y: number, width: number, height: number } | null
}> = ({ experience, onClose, layoutId, clickOrigin }) => {
    const { imgClass, padding } = getLogoStyles(experience.company);
    const backdropUrl = getCardBackdropUrls(experience.company, experience.role);
    const { uniformTheme, accentColor } = useTheme();
    const primaryObjective = experience.description[0];
    const otherAchievements = experience.description.slice(1);
    const keywords = experience.company === 'General Motors' 
        ? gmKeywords 
        : (experience.company.toLowerCase().includes('gtechna') 
            ? gtechnaKeywords 
            : (experience.company.toLowerCase().includes('beaumont') ? beaumontKeywords : []));

    const anecdoteIconMap: Record<string, React.ReactNode> = {
        lightbulb: <Lightbulb size={20} />,
        'alert-octagon': <AlertOctagon size={20} />,
    };
    
    const sentinelRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isHeaderStuck, setIsHeaderStuck] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        triggerElementRef.current = document.activeElement as HTMLElement;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'Tab') {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        
        modalNode.addEventListener('keydown', handleKeyDown);
        
        const scrollContainer = scrollContainerRef.current;
        const sentinel = sentinelRef.current;
        if (!scrollContainer || !sentinel) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                triggerElementRef.current?.focus();
            };
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsHeaderStuck(!entry.isIntersecting),
            { root: scrollContainer, threshold: 0 }
        );
        observer.observe(sentinel);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            modalNode.removeEventListener('keydown', handleKeyDown);
            observer.disconnect();
            triggerElementRef.current?.focus();
        };
    }, [onClose]);

    const dx = clickOrigin ? clickOrigin.x - window.innerWidth / 2 : 0;
    const dy = clickOrigin ? clickOrigin.y - window.innerHeight / 2 : 0;
    const startScale = clickOrigin ? Math.min(clickOrigin.width / 600, 0.4) : 0.2;

    const overlayVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.35, ease: 'easeOut' }
        },
        exit: { 
            opacity: 0,
            transition: { duration: 0.3, ease: 'easeIn', delay: 0.05 }
        }
    };

    const backdropVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.25 } }
    };

    const modalVariants: Variants = {
        hidden: { 
            opacity: 0, 
            scale: startScale, 
            x: dx, 
            y: dy 
        },
        visible: { 
            opacity: 1, 
            scale: 1, 
            x: 0, 
            y: 0, 
            transition: { 
                type: 'spring', 
                stiffness: 280, 
                damping: 24,
                mass: 0.8
            } 
        },
        exit: { 
            opacity: 0, 
            scale: startScale, 
            x: dx, 
            y: dy, 
            transition: { 
                type: 'spring', 
                stiffness: 300, 
                damping: 28,
                opacity: { duration: 0.2 }
            } 
        }
    };

    const contentVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 15 } },
    };

    return (
        <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop Blur Overlay */}
            <motion.div
                variants={backdropVariants}
                className="fixed inset-0 bg-neutral-950/80 dark:bg-neutral-950/85 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Body Chassis */}
            <motion.div
                ref={modalRef}
                variants={modalVariants}
                className="relative w-full max-w-4xl bg-white dark:bg-[#10141d] border border-neutral-200 dark:border-[#1e222b] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden z-10 text-neutral-900 dark:text-white"
            >
                {/* Floating Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-40 w-9 h-9 rounded-full flex items-center justify-center bg-white/70 dark:bg-neutral-900/80 text-neutral-500 hover:text-white dark:hover:text-black hover:bg-[#1b9ca6] dark:hover:bg-[#64ffda] border border-neutral-200/50 dark:border-neutral-800 transition-all duration-300 transform hover:scale-105" 
                    aria-label="Close dossier"
                >
                    <X size={18} />
                </button>

                {/* Scrolled Floating Header overlay */}
                <AnimatePresence>
                    {isHeaderStuck && (
                        <motion.div
                            className="absolute top-4 left-4 md:left-6 z-30 flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/90 dark:bg-[#10141d]/90 backdrop-blur-md border border-neutral-200 dark:border-[#1e222b] shadow-lg pointer-events-auto max-w-[calc(100%-4rem)]"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <div className={`w-8 h-8 rounded-lg bg-white border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0 ${padding}`}>
                                <img src={experience.logoUrl} alt={experience.company} className={imgClass} referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold font-sans text-neutral-900 dark:text-white truncate max-w-[120px] md:max-w-[220px]">
                                    {experience.role}
                                </h4>
                                <p className="text-[9px] font-mono font-medium text-[#1b9ca6] dark:text-[#64ffda] leading-none mt-0.5 uppercase tracking-wider truncate">
                                    {experience.company}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Primary scroll area of modal */}
                <div 
                    ref={scrollContainerRef} 
                    className="overflow-y-auto w-full h-full flex flex-col"
                >
                    {/* Sentinel for Scroll Intersection Detection */}
                    <div ref={sentinelRef} className="h-0 w-full" />

                    {/* Cover Hero Banner Header */}
                    <div className="relative h-44 md:h-52 w-full overflow-hidden flex-shrink-0 bg-neutral-900 -mb-px">
                    <img 
                        src={backdropUrl.primary} 
                        onError={(e) => { if (e.currentTarget.src !== backdropUrl.fallback) e.currentTarget.src = backdropUrl.fallback; }}
                        alt={`${experience.company} header background`} 
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                    />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-neutral-950/20 dark:from-[#10141d] dark:via-[#10141d]/40 dark:to-transparent" />
                        
                        {/* Company Logo Floating Title Bar */}
                        <div className="absolute bottom-6 left-6 md:left-8 flex items-end gap-4 z-10">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-white border border-neutral-200/50 dark:border-neutral-800 shadow-md flex-shrink-0 overflow-hidden ${padding}`}>
                                <img 
                                    src={experience.logoUrl} 
                                    alt={`${experience.company} logo`} 
                                    className={imgClass} 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="mb-0.5 text-left">
                                <span className="text-[10px] md:text-xs font-mono font-extrabold tracking-widest text-[#1a7a85] dark:text-[#64ffda] uppercase leading-none block mb-1">
                                    {experience.role}
                                </span>
                                <h3 className="font-sans font-black text-xl md:text-2xl text-neutral-900 dark:text-white leading-tight">
                                    {experience.company}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Contents Section */}
                    <motion.div
                        className="p-6 md:p-8 flex-grow flex flex-col gap-6 relative z-10 bg-white dark:bg-[#10141d]"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                    >
                        {/* Summary metadata headers line */}
                        <motion.div 
                            variants={itemVariants}
                            className="flex flex-wrap gap-4 items-center justify-between pb-5 border-b border-neutral-100 dark:border-neutral-800/60"
                        >
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={13} className="text-neutral-450 dark:text-neutral-500" />
                                    <span>{experience.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-neutral-450 dark:text-neutral-500" />
                                    <span>{experience.period}</span>
                                    <span className="font-mono text-[9px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[#1b9ca6] dark:text-[#64ffda] font-bold">
                                        {calculateServiceLength(experience.period)}
                                    </span>
                                </div>
                            </div>

                            {experience.companyUrl && (
                                <a 
                                    href={experience.companyUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1b9ca6] dark:text-[#64ffda] hover:underline"
                                >
                                    <span>Visit Website</span>
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </motion.div>

                        {/* Interactive Main Dynamic Grid (Bento Style Layout) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* LEFT SIDE BLOCK: Objective and Accomplishments */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Role Objective Card */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="p-5 md:p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/35 border border-neutral-150/50 dark:border-[#1e222b] shadow-sm text-left"
                                >
                                    <div className="flex items-center gap-2 mb-3 text-[#1b9ca6] dark:text-[#64ffda]">
                                        <Target size={15} />
                                        <span className="font-mono text-[10px] font-black uppercase tracking-widest">Role Objective</span>
                                    </div>
                                    <p className="font-sans text-xs md:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-semibold">
                                        <HighlightKeywords text={primaryObjective} keywords={keywords} />
                                    </p>
                                </motion.div>

                                {/* Key Accomplishments Card */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="p-5 md:p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/35 border border-neutral-150/50 dark:border-[#1e222b] shadow-sm text-left"
                                >
                                    <div className="flex items-center gap-2 mb-4 text-neutral-800 dark:text-white">
                                        <CheckSquare size={15} className="text-[#1b9ca6] dark:text-[#64ffda]" />
                                        <h4 className="font-sans font-bold text-sm uppercase tracking-tight">Key Achievements</h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {otherAchievements.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2.5">
                                                <div className="p-0.5 mt-0.5 rounded bg-[#1b9ca6]/10 dark:bg-[#64ffda]/10 text-[#1b9ca6] dark:text-[#64ffda] flex-shrink-0">
                                                    <ChevronRight size={13} />
                                                </div>
                                                <span className="font-sans text-xs md:text-sm text-neutral-600 dark:text-neutral-350 leading-relaxed">
                                                    <HighlightKeywords text={item} keywords={keywords} />
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </div>

                            {/* RIGHT SIDE BLOCK: Metrics, Snapshot, and Skills */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Quantitative Impact metrics inside modal */}
                                {experience.impactMetrics && experience.impactMetrics.length > 0 && (
                                    <motion.div 
                                        variants={itemVariants}
                                        className="p-5 md:p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/35 border border-neutral-150/50 dark:border-[#1e222b] shadow-sm text-left"
                                    >
                                        <h4 className="font-mono text-[10px] font-black uppercase tracking-widest text-[#1b9ca6] dark:text-[#64ffda] mb-4">
                                            Performance Impact
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3.5">
                                            {experience.impactMetrics.map((met, i) => (
                                                <div key={i} className="flex items-center gap-3.5 bg-white dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-150/45 dark:border-neutral-800/80">
                                                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/85 text-neutral-600 dark:text-neutral-300">
                                                        {met.icon === 'zap' && <Zap size={14} className="text-amber-500" />}
                                                        {met.icon === 'shield' && <Shield size={14} className="text-emerald-500" />}
                                                        {met.icon === 'server' && <Server size={14} className="text-blue-500" />}
                                                        {met.icon === 'trending-up' && <TrendingUp size={14} className="text-purple-500" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-base md:text-lg font-black text-neutral-900 dark:text-white leading-none font-mono">
                                                            {met.value}{met.suffix || ''}
                                                        </div>
                                                        <p className="font-sans text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal">
                                                            {met.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Skills / Stack Card */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="p-5 md:p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/35 border border-[#1e222b] dark:border-[#1e222b] shadow-sm text-left"
                                >
                                    <h4 className="font-mono text-[10px] font-black uppercase tracking-widest text-[#1b9ca6] dark:text-[#64ffda] mb-4">
                                        Core Toolkits
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                                        {experience.skills.map(skill => (
                                            <div key={skill.name} className="relative group/skill cursor-help">
                                                <span className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900/60 text-[10px] md:text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-[#1b9ca6] dark:hover:border-[#64ffda] transition-all">
                                                    {skill.name}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 rounded-lg bg-neutral-900/95 dark:bg-neutral-950 text-white text-[9px] leading-snug font-sans pointer-events-none opacity-0 group-hover/skill:opacity-100 transition-opacity z-20 shadow-xl border border-neutral-800">
                                                    {skill.context}
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900/95" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Accordion Operational snapshot */}
                                {experience.dailyLog && experience.dailyLog.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <OperationalSnapshot log={experience.dailyLog} />
                                    </motion.div>
                                )}

                                {/* Dynamic Anecdote log */}
                                {experience.anecdote && (
                                    <motion.div 
                                        className="p-5 md:p-6 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/35 border border-neutral-150/50 dark:border-[#1e222b] shadow-sm text-left"
                                        variants={itemVariants}
                                    >
                                        <h4 className="font-sans font-bold text-xs uppercase tracking-tight text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                            {anecdoteIconMap[experience.anecdote.icon] || <Lightbulb size={16} />}
                                            <span>{experience.anecdote.title}</span>
                                        </h4>
                                        <p className="font-sans text-xs italic text-neutral-550 dark:text-neutral-400 leading-relaxed font-semibold">
                                            "{experience.anecdote.story}"
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Overriding Bottom Legacy Banner */}
                        {experience.legacy && experience.legacy.length > 0 && (
                            <motion.div 
                                variants={itemVariants}
                                className="p-6 rounded-2xl bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900/40 dark:to-neutral-900/60 border-l-4 border-[#1b9ca6] dark:border-[#64ffda] text-left"
                            >
                                <div className="flex items-center gap-2 text-neutral-450 dark:text-neutral-500 mb-2 font-mono">
                                    <Quote size={14} className="text-[#1b9ca6] dark:text-[#64ffda]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Enduring Legacy Impact</span>
                                </div>
                                <p className="font-sans text-xs md:text-sm italic text-neutral-600 dark:text-neutral-355 font-medium leading-relaxed">
                                    "{experience.legacy[0]}"
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Section Component ---
const ExperienceSection: React.FC = () => {
    const { t, language } = useI18n();
    const experiences = React.useMemo(() => getContent<Experience[]>('experience', language) || [], [language]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [clickOrigin, setClickOrigin] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleCardClick = (id: string) => {
        const cardRef = document.getElementById(`card-container-${id}`);
        if (cardRef) {
            const rect = cardRef.getBoundingClientRect();
            setClickOrigin({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height
            });
        } else {
            setClickOrigin(null);
        }
        setSelectedId(id);
    };

    // Filter experiences into professional and volunteer
    const professionalExperiences = experiences.filter(exp => exp.type === 'work');
    const volunteerExperiences = experiences.filter(exp => exp.type === 'volunteer');

    const selectedExperience = experiences.find(exp => generateUniqueId(exp) === selectedId);

    useEffect(() => {
        if (selectedId) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            // Delay restoring scrollbar to allow the modal close animation/spring to settle smoothly
            const timer = setTimeout(() => {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }, 350);
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [selectedId]);

    // Initialize first professional experience as active
    useEffect(() => {
        if (professionalExperiences.length > 0 && !activeId) {
            setActiveId(generateUniqueId(professionalExperiences[0]));
        }
    }, [professionalExperiences, activeId]);

    // Scroll spy tracker to sync card in viewport with sidebar timeline state
    useEffect(() => {
        if (experiences.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-30% 0px -40% 0px', // detects cards in middle range of viewport
            threshold: 0
        };

        const handleIntersection = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('card-container-', '');
                    setActiveId(id);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);

        experiences.forEach(exp => {
            const el = document.getElementById(`card-container-${generateUniqueId(exp)}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [experiences]);

    const handleTimelineClick = (uniqueId: string) => {
        setActiveId(uniqueId);
        const element = document.getElementById(`card-container-${uniqueId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <>
            <Section id="experience" title={t('experience_title')}>
                <div className="space-y-16">
                    
                    {/* TWO-COLUMN LAYOUT MATCHING SAMPLE UI */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                        
                        {/* LEFT COLUMN: STICKY PANEL TIMELINE LIST */}
                        <div className="lg:col-span-4 lg:sticky lg:top-28 text-left h-auto space-y-8 select-none">
                            <div>
                                <div className="text-[10px] font-mono tracking-widest uppercase text-[#1b9ca6] dark:text-[#64ffda] font-black mb-3">
                                    {language === 'fr' ? 'DÉTAILS DU PARCOURS' : 'EXPERIENCE'}
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase leading-[1.08] mb-4">
                                    {language === 'fr' ? 'Bâtir des systèmes sécurisés qui ont un impact réel.' : 'Building secure systems that drive real impact.'}
                                </h3>
                                <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                                    {language === 'fr' 
                                      ? 'Plus de 5 ans d’expérience en cybersécurité, systèmes d’entreprise et support logiciel à l’échelle internationale.' 
                                      : 'Over 5 years of experience in cybersecurity, enterprise systems, and software support across global organizations.'}
                                </p>
                            </div>

                            {/* Dotted Vertical Timeline List */}
                            {professionalExperiences.length > 0 && (
                                <div className="hidden sm:block relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200/50 dark:before:bg-neutral-800/60 before:border-r-2 before:border-dashed before:border-neutral-200/60 dark:before:border-[#1F2225]">
                                    {professionalExperiences.map((exp, index) => {
                                        const uniqueId = generateUniqueId(exp);
                                        const indexStr = String(index + 1).padStart(2, '0');
                                        const isActive = activeId === uniqueId;

                                        return (
                                            <button
                                                key={uniqueId}
                                                onClick={() => handleTimelineClick(uniqueId)}
                                                className="flex items-start text-left w-full group relative focus:outline-none py-1"
                                                aria-label={`Scroll to ${exp.company}`}
                                            >
                                                {/* Timeline Node Icon Circle */}
                                                <div className="absolute left-[-20px] top-[10px] flex items-center justify-center">
                                                    {isActive ? (
                                                        <span className="relative flex h-[10px] w-[10px]">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1b9ca6] dark:bg-[#64ffda] opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-[#1b9ca6] dark:bg-[#64ffda]"></span>
                                                        </span>
                                                    ) : (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#1b9ca6] dark:group-hover:bg-[#64ffda] transition-colors"></span>
                                                    )}
                                                </div>

                                                <div className="pl-4">
                                                    <span className={`font-mono text-[10px] font-extrabold leading-none tracking-widest block transition-colors duration-200 ${isActive ? 'text-[#1b9ca6] dark:text-[#64ffda]' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                                                        {indexStr}
                                                    </span>
                                                    <span className={`font-sans font-bold text-sm tracking-tight block mt-1 transition-colors duration-200 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-750 dark:group-hover:text-neutral-200'}`}>
                                                        {exp.company}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 block leading-none mt-1">
                                                        {exp.role} • {exp.period}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Dotted Vertical Timeline List for Volunteer Experiences */}
                            {volunteerExperiences.length > 0 && (
                                <div className="space-y-4 pt-2 hidden sm:block">
                                    <h4 className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 dark:text-neutral-500 font-bold pl-6">
                                        {language === 'fr' ? 'Bénévolat' : 'Volunteer & Community'}
                                    </h4>
                                    <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200/50 dark:before:bg-neutral-800/60 before:border-r-2 before:border-dashed before:border-neutral-200/60 dark:before:border-[#1F2225]">
                                        {volunteerExperiences.map((exp, index) => {
                                            const uniqueId = generateUniqueId(exp);
                                            const overallIndex = professionalExperiences.length + index + 1;
                                            const indexStr = String(overallIndex).padStart(2, '0');
                                            const isActive = activeId === uniqueId;

                                            return (
                                                <button
                                                    key={uniqueId}
                                                    onClick={() => handleTimelineClick(uniqueId)}
                                                    className="flex items-start text-left w-full group relative focus:outline-none py-1"
                                                    aria-label={`Scroll to ${exp.company}`}
                                                >
                                                    {/* Timeline Node Icon Circle */}
                                                    <div className="absolute left-[-20px] top-[10px] flex items-center justify-center">
                                                        {isActive ? (
                                                            <span className="relative flex h-[10px] w-[10px]">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1b9ca6] dark:bg-[#64ffda] opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-[10px] w-[10px] bg-[#1b9ca6] dark:bg-[#64ffda]"></span>
                                                            </span>
                                                        ) : (
                                                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-[#1b9ca6] dark:group-hover:bg-[#64ffda] transition-colors"></span>
                                                        )}
                                                    </div>

                                                    <div className="pl-4">
                                                        <span className={`font-mono text-[10px] font-extrabold leading-none tracking-widest block transition-colors duration-200 ${isActive ? 'text-[#1b9ca6] dark:text-[#64ffda]' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'}`}>
                                                            {indexStr}
                                                        </span>
                                                        <span className={`font-sans font-bold text-sm tracking-tight block mt-1 transition-colors duration-200 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-750 dark:group-hover:text-neutral-200'}`}>
                                                            {exp.company}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 block leading-none mt-1">
                                                            {exp.role} • {exp.period}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Want the full story CV Download Box */}
                            <div className="p-4 bg-neutral-50/50 dark:bg-[#10141d]/40 border border-neutral-200 dark:border-[#1e222b] rounded-2xl flex items-center justify-between text-left group gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:bg-[#1b9ca6]/10 dark:group-hover:bg-[#64ffda]/10 group-hover:text-[#1b9ca6] dark:group-hover:text-[#64ffda] transition-all duration-300">
                                        <Download size={18} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-sans font-bold text-xs text-neutral-800 dark:text-white leading-tight">
                                            {language === 'fr' ? 'CV Complet Dispo ?' : 'Want the full story?'}
                                        </h4>
                                        <p className="font-sans text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                                            {language === 'fr' ? 'Téléchargez mon dossier CV.' : 'Download my resume for details.'}
                                        </p>
                                    </div>
                                </div>
                                <a 
                                    href={language === 'fr' ? 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_CV.pdf' : 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_Resume.pdf'}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-450 hover:bg-[#1b9ca6] hover:text-white dark:hover:bg-[#64ffda] dark:hover:text-black transition-all duration-305 transform group-hover:translate-x-1"
                                >
                                    <ArrowUpRight size={14} />
                                </a>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PREMIUM BENTO CARD GRID (2x2 + 1 Horizontal Layout) */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {professionalExperiences.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {professionalExperiences.map((exp, index) => {
                                        const uniqueId = generateUniqueId(exp);
                                        const indexStr = String(index + 1).padStart(2, '0');
                                        const isFullWidthRow = exp.company.toLowerCase().includes('firstcare');

                                        return (
                                            <div
                                                key={uniqueId}
                                                id={`card-container-${uniqueId}`}
                                                className={`scroll-mt-28 ${isFullWidthRow ? 'md:col-span-2' : ''}`}
                                            >
                                                <ExperienceCard
                                                    layoutId={uniqueId}
                                                    experience={exp}
                                                    indexStr={indexStr}
                                                    onClick={() => handleCardClick(uniqueId)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* VOLUNTEER & LEADERSHIP ROW BELOW WORK CARDS */}
                            {volunteerExperiences.length > 0 && (
                                <div className="pt-12 border-t border-neutral-250 dark:border-neutral-800/60 mt-8">
                                    <div className="max-w-xl text-left mb-6">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">
                                            {t('experience_volunteer_title') || "Volunteer & Community"}
                                        </h3>
                                        <p className="mt-1 text-xs font-mono text-neutral-400 dark:text-neutral-500 tracking-wider">
                                            // COMMUNITY_ENGAGEMENT_STEM_EDUCATION
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {volunteerExperiences.map((exp, index) => {
                                            const uniqueId = generateUniqueId(exp);
                                            const overallIndex = professionalExperiences.length + index + 1;
                                            const indexStr = String(overallIndex).padStart(2, '0');

                                            return (
                                                <div
                                                    key={uniqueId}
                                                    id={`card-container-${uniqueId}`}
                                                    className="scroll-mt-28"
                                                >
                                                    <ExperienceCard
                                                        layoutId={uniqueId}
                                                        experience={exp}
                                                        indexStr={indexStr}
                                                        onClick={() => handleCardClick(uniqueId)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </div>
            </Section>

            <AnimatePresence>
                {selectedId && selectedExperience && (
                    <ExperienceDossier
                        key="dossier"
                        layoutId={selectedId}
                        experience={selectedExperience}
                        onClose={() => setSelectedId(null)}
                        clickOrigin={clickOrigin}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ExperienceSection;
