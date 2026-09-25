import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Download, 
    X, 
    ChevronDown, 
    Copy, 
    Check, 
    Eye, 
    Trash2, 
    Sparkles, 
    FileText, 
    Info, 
    ExternalLink, 
    RefreshCw,
    ShieldCheck,
    Search,
    MapPin,
    Briefcase,
    Award,
    BookOpen,
    Filter,
    ArrowRight
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { useStreak } from '../../hooks/useStreak';
import { getContent } from '../../lib/contentService';
import { AnalyticsTracker } from '../../lib/analyticsTracker';

// --- Helper Hook for screen size detection ---
const useWindowSize = () => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
};

// --- Sparkle Particle Component for Success Celebration ---
const SparkleConfetti: React.FC = () => {
    const particles = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const distance = Math.random() * 35 + 25;
            return {
                id: i,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                size: Math.random() * 5 + 3,
                color: i % 3 === 0 ? '#ffc300' : i % 3 === 1 ? '#10b981' : '#3b82f6',
                duration: Math.random() * 0.6 + 0.4
            };
        });
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        boxShadow: `0 0 6px ${p.color}`
                    }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                        x: p.x, 
                        y: p.y, 
                        scale: [0, 1.2, 0], 
                        opacity: [1, 0.9, 0] 
                    }}
                    transition={{
                        duration: p.duration,
                        ease: "easeOut"
                    }}
                />
            ))}
        </div>
    );
};

// --- Main ResumeDownloader Component ---
const ResumeDownloader: React.FC = () => {
    const { language, t } = useI18n();
    const { addPoints } = useStreak();
    const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
    const resumeHashes = personalData.resumeHashes || { en: '', fr: '' };
    
    // Core states
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadLanguage, setDownloadLanguage] = useState<'en' | 'fr'>('en');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [downloadCompleted, setDownloadCompleted] = useState(false);
    const [copiedHashKey, setCopiedHashKey] = useState<'en' | 'fr' | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [showHashDetails, setShowHashDetails] = useState(true); // Default to true!
    
    // Preview / Visualiser states
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewLanguage, setPreviewLanguage] = useState<'en' | 'fr'>('en');
    const [previewTab, setPreviewTab] = useState<'pdf' | 'text'>('pdf');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSkillFilter, setActiveSkillFilter] = useState<string | null>(null);
    const [copiedMarkdown, setCopiedMarkdown] = useState(false);
    const autoResetTimerRef = useRef<any>(null);
    const lastDownloadTimestampRef = useRef<number>(0);

    // Dynamic Speed & ETA Simulation state
    const [downloadSpeed, setDownloadSpeed] = useState('1.1 MB/s');
    const [eta, setEta] = useState('1s');

    const { uniformTheme, isAccentLight } = useTheme();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const progressTimerRef = useRef<any>(null);

    const { width } = useWindowSize();
    const isTabletOrSmaller = width < 1200;

    // --- Interactive Dossier Search & Filtering Logic ---
    const filteredExperience = useMemo(() => {
        const data = getContent('experience', previewLanguage) || [];
        const query = searchQuery.toLowerCase().trim();
        return data.filter((exp: any) => {
            // Check active skill filter first
            if (activeSkillFilter) {
                const hasSkill = exp.skills?.some((s: any) => s.name.toLowerCase() === activeSkillFilter.toLowerCase());
                if (!hasSkill) return false;
            }
            
            if (!query) return true;
            
            const matchRole = exp.role?.toLowerCase().includes(query);
            const matchCompany = exp.company?.toLowerCase().includes(query);
            const matchLocation = exp.location?.toLowerCase().includes(query);
            const matchSkills = exp.skills?.some((s: any) => s.name.toLowerCase().includes(query));
            const matchBullets = exp.bullets?.some((b: string) => b.toLowerCase().includes(query));
            
            return matchRole || matchCompany || matchLocation || matchSkills || matchBullets;
        });
    }, [previewLanguage, searchQuery, activeSkillFilter]);

    const filteredCertifications = useMemo(() => {
        const data = getContent('certifications', previewLanguage) || [];
        const query = searchQuery.toLowerCase().trim();
        return data.filter((cert: any) => {
            // Check active skill filter first
            if (activeSkillFilter) {
                const hasSkill = cert.skillsGained?.some((s: string) => s.toLowerCase() === activeSkillFilter.toLowerCase());
                if (!hasSkill) return false;
            }
            
            if (!query) return true;
            
            const matchName = cert.name?.toLowerCase().includes(query);
            const matchIssuer = cert.issuer?.toLowerCase().includes(query);
            const matchSkills = cert.skillsGained?.some((s: string) => s.toLowerCase().includes(query));
            
            return matchName || matchIssuer || matchSkills;
        });
    }, [previewLanguage, searchQuery, activeSkillFilter]);

    const filteredEducation = useMemo(() => {
        const data = getContent('education', previewLanguage)?.timeline || [];
        const query = searchQuery.toLowerCase().trim();
        return data.filter((edu: any) => {
            if (activeSkillFilter) {
                // Return true if any description/degree has words matching active skill
                return edu.degree?.toLowerCase().includes(activeSkillFilter.toLowerCase());
            }
            if (!query) return true;
            
            const matchDegree = edu.degree?.toLowerCase().includes(query);
            const matchSchool = edu.school?.toLowerCase().includes(query);
            const matchYear = edu.year?.toLowerCase().includes(query);
            
            return matchDegree || matchSchool || matchYear;
        });
    }, [previewLanguage, searchQuery, activeSkillFilter]);

    const filteredSkillsCategories = useMemo(() => {
        const data = getContent('skills', previewLanguage)?.categories || {};
        const query = searchQuery.toLowerCase().trim();
        if (!query && !activeSkillFilter) return data;
        
        const filtered: Record<string, any> = {};
        Object.entries(data).forEach(([catName, catData]: [string, any]) => {
            const matchedSkills = catData.skills?.filter((sk: any) => {
                if (activeSkillFilter) {
                    return sk.name.toLowerCase() === activeSkillFilter.toLowerCase();
                }
                return sk.name.toLowerCase().includes(query);
            }) || [];
            
            if (matchedSkills.length > 0 || catName.toLowerCase().includes(query)) {
                filtered[catName] = {
                    ...catData,
                    skills: matchedSkills.length > 0 ? matchedSkills : catData.skills
                };
            }
        });
        return filtered;
    }, [previewLanguage, searchQuery, activeSkillFilter]);

    const totalCertsCount = useMemo(() => {
        return getContent('certifications', previewLanguage)?.length || 0;
    }, [previewLanguage]);

    const totalUniqueSkillsCount = useMemo(() => {
        const data = getContent('skills', previewLanguage)?.categories || {};
        let count = 0;
        Object.values(data).forEach((cat: any) => {
            count += cat.skills?.length || 0;
        });
        return count;
    }, [previewLanguage]);

    const handleCopyMarkdown = useCallback(() => {
        const experienceData = getContent('experience', previewLanguage) || [];
        const skillsData = getContent('skills', previewLanguage) || {};
        const educationData = getContent('education', previewLanguage) || {};
        const certificationsData = getContent('certifications', previewLanguage) || [];

        let md = `# ANGESH CHANDERDIP\n`;
        md += `**Email:** angesh021@gmail.com | **GitHub:** github.com/angesh021 | **LinkedIn:** linkedin.com/in/angesh-chanderdip\n\n`;
        
        md += `## PROFILE SUMMARY\n`;
        md += previewLanguage === 'fr'
            ? `Professionnel dévoué de la cybersécurité et du cloud avec une solide expérience dans la configuration de réseaux sécurisés, la maintenance de bases de données (SQL Server, PostgreSQL), et l'automatisation des processus opérationnels.\n\n`
            : `Dedicated Cybersecurity & Cloud professional with a strong track record of configuring secure enterprise networks, maintaining database infrastructure (SQL Server, PostgreSQL), and automating operational workflows.\n\n`;

        md += `## PROFESSIONAL EXPERIENCE\n\n`;
        experienceData.forEach((exp: any) => {
            md += `### ${exp.role}\n`;
            md += `**${exp.company}** | ${exp.location} | ${exp.period}\n\n`;
            if (exp.bullets) {
                exp.bullets.forEach((bullet: string) => {
                    md += `- ${bullet}\n`;
                });
                md += `\n`;
            }
            if (exp.skills && exp.skills.length > 0) {
                const skillNames = exp.skills.map((s: any) => s.name).join(', ');
                md += `*Core Skills:* ${skillNames}\n\n`;
            }
        });

        md += `## TECHNICAL SKILLS\n\n`;
        if (skillsData.categories) {
            Object.entries(skillsData.categories).forEach(([category, data]: [string, any]) => {
                const skillNames = data.skills?.map((s: any) => s.name).join(', ');
                md += `- **${category}:** ${skillNames}\n`;
            });
            md += `\n`;
        }

        md += `## CERTIFICATIONS\n\n`;
        certificationsData.forEach((cert: any) => {
            md += `- **${cert.name}** - ${cert.issuer} (${cert.date})\n`;
        });
        md += `\n`;

        md += `## EDUCATION\n\n`;
        if (educationData.timeline) {
            educationData.timeline.forEach((edu: any) => {
                md += `- **${edu.degree}** - ${edu.school} (${edu.year})\n`;
            });
        }

        navigator.clipboard.writeText(md);
        setCopiedMarkdown(true);
        setTimeout(() => setCopiedMarkdown(false), 2000);
    }, [previewLanguage]);

    const handleExportJSON = useCallback(() => {
        const experienceData = getContent('experience', previewLanguage) || [];
        const skillsData = getContent('skills', previewLanguage) || {};
        const educationData = getContent('education', previewLanguage) || {};
        const certificationsData = getContent('certifications', previewLanguage) || [];
        
        const fullResume = {
            personal: {
                name: "Angesh Chanderdip",
                title: previewLanguage === 'fr' ? "Spécialiste du Support Applicatif & Ingénieur Sécurité" : "Application Support Specialist & Security Engineer",
                email: "angesh021@gmail.com",
                github: "github.com/angesh021",
                linkedin: "linkedin.com/in/angesh-chanderdip"
            },
            experience: experienceData,
            skills: skillsData,
            certifications: certificationsData,
            education: educationData
        };

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullResume, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `Angesh_Chanderdip_Resume_${previewLanguage}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }, [previewLanguage]);

    // Close menu or popover on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                if (isPopoverOpen) {
                    setIsPopoverOpen(false);
                    setDownloadCompleted(false); // Reset completed status when popover closes
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isPopoverOpen]);

    const resumeUrls = useMemo(() => ({
        en: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_Resume.pdf',
        fr: 'https://fjxdt6rethcy2zfp.public.blob.vercel-storage.com/Resume/AngeshChanderdip_CV.pdf',
    }), []);

    const triggerFileDownload = useCallback((lang: 'en' | 'fr') => {
        const filename = lang === 'en' ? 'AngeshChanderdip_Resume.pdf' : 'AngeshChanderdip_CV.pdf';
        const downloadUrl = `/api/download-resume?lang=${lang}`;
    
        try {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(downloadUrl, '_blank');
        }
    }, []);

    // Simulated progress tracker with physics deceleration (starts fast, slows near finish)
    useEffect(() => {
        if (isDownloading) {
            setProgress(0);
            setDownloadCompleted(false);
            
            let currentProgress = 0;
            const updateInterval = 50; // update progress every 50ms
            
            progressTimerRef.current = setInterval(() => {
                let increment = 0;
                let speedNum = 0.9;
                
                // Mimic true download curves & physics speed variation
                if (currentProgress < 45) {
                    increment = Math.random() * 6 + 5; // Fast burst start
                    speedNum = Math.random() * 1.4 + 1.2; // 1.2 - 2.6 MB/s
                } else if (currentProgress < 85) {
                    increment = Math.random() * 3.5 + 2; // Medium phase
                    speedNum = Math.random() * 0.8 + 0.9; // 0.9 - 1.7 MB/s
                } else if (currentProgress < 98) {
                    increment = Math.random() * 1.2 + 0.5; // Verifying phase
                    speedNum = Math.random() * 0.3 + 0.4; // 400 - 700 KB/s
                } else {
                    increment = 0.4; // Polish step
                    speedNum = 0.2; // 200 KB/s
                }
                
                currentProgress = Math.min(currentProgress + increment, 100);
                setProgress(currentProgress);
                
                // Format Speed and dynamic estimated remaining time (ETA)
                const isKb = speedNum < 1.0;
                const formattedSpeed = isKb 
                    ? `${Math.round(speedNum * 1000)} KB/s` 
                    : `${speedNum.toFixed(1)} MB/s`;
                setDownloadSpeed(formattedSpeed);

                // Estimate remaining seconds
                const remainingMb = 1.2 * (1 - currentProgress / 100);
                const secondsRemaining = Math.max(Math.ceil(remainingMb / speedNum), 1);
                const formattedEta = language === 'fr' 
                    ? `${secondsRemaining}s restants` 
                    : `${secondsRemaining}s left`;
                setEta(formattedEta);
                
                if (currentProgress >= 100) {
                    clearInterval(progressTimerRef.current);
                    setDownloadCompleted(true);
                    triggerFileDownload(downloadLanguage);
                    AnalyticsTracker.trackEngagementEvent('resume_download', downloadLanguage);

                    // Auto-reset completed status after 10 seconds of success unless they clear it themselves
                    if (autoResetTimerRef.current) {
                        clearTimeout(autoResetTimerRef.current);
                    }
                    autoResetTimerRef.current = setTimeout(() => {
                        setIsPopoverOpen(false);
                        setDownloadCompleted(false);
                        setIsDownloading(false);
                        setProgress(0);
                    }, 10000);
                }
            }, updateInterval);
        } else {
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
            }
        }
        
        return () => {
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
            }
            if (autoResetTimerRef.current) {
                clearTimeout(autoResetTimerRef.current);
            }
        };
    }, [isDownloading, downloadLanguage, triggerFileDownload, language]);

    const handleDownload = (lang: 'en' | 'fr') => {
        // Cooldown Security Guard Check
        const now = Date.now();
        const timeSinceLast = now - lastDownloadTimestampRef.current;
        const cooldownMs = 15000; // 15 seconds cooldown
        
        if (timeSinceLast < cooldownMs) {
            const timeLeftSecs = Math.ceil((cooldownMs - timeSinceLast) / 1000);
            console.warn(`Anti-DDoS block: Please retry in ${timeLeftSecs} seconds.`);
            return;
        }

        if (isDownloading) return;

        // Reset any autoResetTimer if triggering a new download
        if (autoResetTimerRef.current) {
            clearTimeout(autoResetTimerRef.current);
        }

        // Set last download timestamp to now
        lastDownloadTimestampRef.current = now;

        setDownloadLanguage(lang);
        setIsDownloading(true);
        setIsMenuOpen(false);
        setIsPopoverOpen(true);
        addPoints(15, 'resume_download');
    };

    const handleVisualise = (lang: 'en' | 'fr') => {
        setPreviewLanguage(lang);
        setPreviewTab('pdf');
        setIsPreviewOpen(true);
        setIsMenuOpen(false);
        addPoints(10, 'explore_section');
    };

    const handleCancel = useCallback(() => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
        }
        if (autoResetTimerRef.current) {
            clearTimeout(autoResetTimerRef.current);
        }
        setIsDownloading(false);
        setProgress(0);
        setIsPopoverOpen(false);
        setDownloadCompleted(false);
    }, []);

    const handleClear = useCallback(() => {
        if (autoResetTimerRef.current) {
            clearTimeout(autoResetTimerRef.current);
        }
        setIsDownloading(false);
        setDownloadCompleted(false);
        setProgress(0);
        setIsPopoverOpen(false);
        setShowHashDetails(true);
    }, []);

    const handleCopy = (e: React.MouseEvent, hash: string, key: 'en' | 'fr') => {
        e.stopPropagation();
        navigator.clipboard.writeText(hash);
        setCopiedHashKey(key);
        setTimeout(() => setCopiedHashKey(null), 2000);
    };

    const handleCopyFileLink = (e: React.MouseEvent | React.TouchEvent) => {
        if (e && 'stopPropagation' in e) e.stopPropagation();
        const url = resumeUrls[downloadLanguage];
        navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    // Toggle popover or version selector dropdown
    const handleButtonClick = () => {
        if (isDownloading || downloadCompleted) {
            if (isPopoverOpen) {
                setIsPopoverOpen(false);
                setDownloadCompleted(false); // Reset completed status when manually closed
            } else {
                setIsPopoverOpen(true);
            }
        } else {
            setIsMenuOpen(prev => !prev);
        }
    };

    // Style helper vars based on active theme
    const bgClasses = uniformTheme
        ? 'bg-primary/85 border-primary/40 hover:bg-primary hover:border-primary'
        : 'bg-[#ffc300]/85 border-yellow-300/40 hover:bg-[#ffc300] hover:border-yellow-300';

    const blurClasses = uniformTheme ? 'bg-primary/20' : 'bg-yellow-400/20';

    const textClasses = uniformTheme
        ? (isAccentLight ? 'text-dark-bg' : 'text-white')
        : 'text-dark-bg/80 hover:text-dark-bg';

    // File name representation
    const fileName = downloadLanguage === 'en' ? 'Angesh_Chanderdip_Resume.pdf' : 'Angesh_Chanderdip_CV.pdf';
    const fileSizeStr = "1.2 MB";

    return (
        <div ref={wrapperRef} className="relative select-none">
            {/* Header Interactive Downloader Button */}
            <motion.div
              className={`relative h-11 ${isTabletOrSmaller ? 'w-11' : 'w-auto'}`}
              animate={isDownloading ? { scale: [1, 0.98, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
                <motion.button
                    onClick={handleButtonClick}
                    className="relative w-full h-full group flex items-center justify-center cursor-pointer overflow-visible tooltip"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen || isPopoverOpen}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                >
                    {/* Tooltip on non-mobile when state is normal */}
                    {!isTabletOrSmaller && !isDownloading && !downloadCompleted && (
                        <span className="tooltip-text">{t('resume_download') || 'Download CV'}</span>
                    )}
                    
                    {/* Custom button background with subtle blur */}
                    <div className={`absolute inset-0 backdrop-blur-md border transition-all duration-300 rounded-xl ${bgClasses}`} />
                    <div className={`absolute inset-0 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl ${blurClasses}`} />
                    
                    <div className={`relative z-10 flex items-center justify-center w-full h-full gap-2 lg:px-5 ${textClasses}`}>
                         {/* Circle progress ring on button for immediate feedback */}
                         {isDownloading ? (
                             <div className="relative w-5 h-5 flex items-center justify-center">
                                 <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                                     <circle
                                         cx="10"
                                         cy="10"
                                         r="7"
                                         className="stroke-slate-500/20 dark:stroke-white/10"
                                         strokeWidth="2"
                                         fill="transparent"
                                     />
                                     <circle
                                         cx="10"
                                         cy="10"
                                         r="7"
                                         className="stroke-current transition-all duration-150 ease-out"
                                         strokeWidth="2"
                                         fill="transparent"
                                         strokeDasharray={43.98}
                                         strokeDashoffset={43.98 - (progress / 100) * 43.98}
                                     />
                                 </svg>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-1.5 h-1.5 bg-current rounded-xs animate-pulse" />
                                 </div>
                             </div>
                         ) : downloadCompleted ? (
                             <motion.div 
                               initial={{ scale: 0.5, rotate: -45 }}
                               animate={{ scale: 1, rotate: 0 }}
                               className="text-emerald-500 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm"
                             >
                                 <Check size={14} strokeWidth={3} />
                             </motion.div>
                         ) : (
                             <motion.div
                                animate={{ y: [0, -3, 0, 1.5, 0] }}
                                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1 }}
                             >
                                <Download size={18} />
                             </motion.div>
                         )}

                         {/* Responsive Label */}
                         {!isTabletOrSmaller && (
                             <span className="font-bold text-sm font-sans tracking-wide whitespace-nowrap">
                                 {isDownloading 
                                     ? `${Math.round(progress)}%` 
                                     : downloadCompleted 
                                         ? (language === 'fr' ? 'Téléchargé' : 'Downloaded')
                                         : (t('resume_download') || 'Download CV')
                                 }
                             </span>
                         )}
                         
                         {!isTabletOrSmaller && !isDownloading && !downloadCompleted && (
                             <motion.div animate={{ rotate: isMenuOpen ? 180 : 0 }}>
                                 <ChevronDown size={14} />
                             </motion.div>
                         )}
                    </div>
                </motion.button>
            </motion.div>
            
            {/* 1. LANGUAGE VERSION SELECTOR DROPDOWN (Closed while downloading/completed) */}
            <AnimatePresence>
                {isMenuOpen && !isDownloading && !downloadCompleted && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="resume-dropdown-menu"
                    >
                        {/* English CV Option */}
                        <div className="resume-dropdown-item-v2 p-2.5">
                            <div className="flex items-center justify-between w-full mb-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs text-slate-850 dark:text-slate-100">
                                        {t('resume_version_en') || 'English Version'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">1.2 MB • PDF</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleVisualise('en')}
                                        className="p-1 px-1.5 rounded bg-slate-100 dark:bg-white/5 hover:bg-primary/20 hover:text-primary transition-all text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer border border-transparent hover:border-primary/20"
                                        title={language === 'fr' ? 'Visualiser' : 'Visualise'}
                                    >
                                        <Eye size={12} />
                                        <span>{language === 'fr' ? 'Voir' : 'View'}</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDownload('en')}
                                        className="p-1 px-1.5 rounded bg-primary/10 hover:bg-primary hover:text-white dark:hover:text-dark-bg transition-all text-[11px] font-bold text-primary flex items-center gap-1 cursor-pointer border border-primary/20"
                                        title={language === 'fr' ? 'Télécharger' : 'Download'}
                                    >
                                        <Download size={12} />
                                        <span>{language === 'fr' ? 'Get' : 'Get'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="sha-area flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-1.5">
                                <span className="sha-text flex items-center gap-1" title={resumeHashes.en}>
                                    <ShieldCheck size={10} className="text-emerald-500" />
                                    SHA256: {resumeHashes.en.substring(0, 6)}...{resumeHashes.en.substring(resumeHashes.en.length - 4)}
                                </span>
                                <button onClick={(e) => handleCopy(e, resumeHashes.en, 'en')} className="copy-button" aria-label="Copy SHA256 English">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={copiedHashKey === 'en' ? 'check' : 'copy'}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {copiedHashKey === 'en' ? <Check size={12} className="text-primary animate-bounce" /> : <Copy size={12} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>

                        {/* French CV Option */}
                        <div className="resume-dropdown-item-v2 p-2.5 border-t border-slate-100 dark:border-white/5 mt-1 pt-2.5">
                            <div className="flex items-center justify-between w-full mb-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs text-slate-850 dark:text-slate-100">
                                        {t('resume_version_fr') || 'French Version'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">1.2 MB • PDF</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleVisualise('fr')}
                                        className="p-1 px-1.5 rounded bg-slate-100 dark:bg-white/5 hover:bg-primary/20 hover:text-primary transition-all text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer border border-transparent hover:border-primary/20"
                                        title={language === 'fr' ? 'Visualiser' : 'Visualise'}
                                    >
                                        <Eye size={12} />
                                        <span>{language === 'fr' ? 'Voir' : 'View'}</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDownload('fr')}
                                        className="p-1 px-1.5 rounded bg-primary/10 hover:bg-primary hover:text-white dark:hover:text-dark-bg transition-all text-[11px] font-bold text-primary flex items-center gap-1 cursor-pointer border border-primary/20"
                                        title={language === 'fr' ? 'Télécharger' : 'Download'}
                                    >
                                        <Download size={12} />
                                        <span>{language === 'fr' ? 'Get' : 'Get'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="sha-area flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-1.5">
                                <span className="sha-text flex items-center gap-1" title={resumeHashes.fr}>
                                    <ShieldCheck size={10} className="text-emerald-500" />
                                    SHA256: {resumeHashes.fr.substring(0, 6)}...{resumeHashes.fr.substring(resumeHashes.fr.length - 4)}
                                </span>
                                <button onClick={(e) => handleCopy(e, resumeHashes.fr, 'fr')} className="copy-button" aria-label="Copy SHA256 French">
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={copiedHashKey === 'fr' ? 'check' : 'copy'}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {copiedHashKey === 'fr' ? <Check size={12} className="text-primary animate-bounce" /> : <Copy size={12} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. APPLE SAFARI-STYLE DOWNLOAD MANAGER POPUP */}
            <AnimatePresence>
                {isPopoverOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                        className="absolute top-full mt-2.5 right-0 w-[310px] md:w-[340px] rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
                    >
                        {/* Apple Safari downloads topbar */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5 select-none">
                            <span className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase font-sans">
                                {language === 'fr' ? 'Téléchargements' : 'Downloads'}
                            </span>
                            <button 
                                onClick={handleClear}
                                className="text-xs font-semibold text-primary hover:opacity-80 transition cursor-pointer"
                            >
                                {downloadCompleted 
                                    ? (language === 'fr' ? 'Effacer' : 'Clear') 
                                    : (language === 'fr' ? 'Masquer' : 'Hide')
                                }
                            </button>
                        </div>
                        
                        {/* Downloads list block */}
                        <div className="p-3.5 space-y-3">
                            <div className="flex items-start gap-3.5 relative">
                                
                                {/* Realistic folded-ear PDF file icon with animation */}
                                <motion.div 
                                    className="relative w-10 h-12 bg-red-500/10 dark:bg-red-500/20 rounded-lg border border-red-500/25 flex flex-col justify-between p-1.5 overflow-visible flex-shrink-0 select-none shadow-sm group"
                                    animate={downloadCompleted ? { 
                                        scale: [1, 1.2, 0.95, 1.02, 1],
                                        rotate: [0, -3, 3, -1, 0]
                                    } : {}}
                                    transition={{ 
                                        duration: 0.6,
                                        ease: "easeInOut",
                                        delay: 0.1
                                    }}
                                >
                                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500/25 dark:bg-red-500/35 rounded-bl-[4px]" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
                                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-bl-[4px]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                                    
                                    <div className="w-5 h-1 bg-red-500/30 dark:bg-red-500/40 rounded-full mt-0.5" />
                                    <div className="w-4 h-0.5 bg-red-500/20 dark:bg-red-500/30 rounded-full" />
                                    
                                    <span className="font-sans font-extrabold text-[9px] text-red-600 dark:text-red-400 leading-none">
                                        PDF
                                    </span>
                                    
                                    {/* Success confetti sparks inside popover */}
                                    {downloadCompleted && <SparkleConfetti />}

                                    {/* Download completed check overlay badge */}
                                    {downloadCompleted && (
                                        <motion.div 
                                          initial={{ opacity: 0, scale: 0 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 border border-white dark:border-slate-950 flex items-center justify-center text-white rounded-full shadow-sm"
                                        >
                                            <Check size={10} strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* File text details & dynamic statistics */}
                                <div className="flex-grow min-w-0 flex flex-col justify-start pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate font-sans block" title={fileName}>
                                            {fileName}
                                        </span>
                                        <button 
                                            onClick={() => setShowHashDetails(!showHashDetails)}
                                            className={`p-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ${showHashDetails ? 'text-primary' : ''}`}
                                            title="View Metadata"
                                        >
                                            <Info size={11} />
                                        </button>
                                    </div>
                                    
                                    {/* Transfer Speed, Size & ETA Stats */}
                                    <div className="text-[10px] md:text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                                        {isDownloading ? (
                                            <div className="flex flex-col gap-0.5 font-mono">
                                                <div className="flex justify-between w-full">
                                                    <span>{(1.2 * progress / 100).toFixed(2)} MB of {fileSizeStr}</span>
                                                    <span>{downloadSpeed}</span>
                                                </div>
                                                <div className="text-[9px] text-primary/80 text-right font-medium">
                                                    {eta}
                                                </div>
                                            </div>
                                        ) : downloadCompleted ? (
                                            <span className="text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                                                <Sparkles size={10} className="animate-pulse" />
                                                {language === 'fr' ? 'Téléchargé • 1.2 Mo' : 'Downloaded • 1.2 MB'}
                                            </span>
                                        ) : (
                                            <span>1.2 MB</span>
                                        )}
                                    </div>
                                    
                                    {/* Sleek inline progress bar */}
                                    {isDownloading && (
                                        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-1.5 border border-slate-200/20 dark:border-white/5">
                                            <motion.div 
                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]"
                                                style={{ width: `${progress}%` }}
                                                transition={{ ease: "linear" }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side Action Button (Cancel/Open/Delete) */}
                                <div className="flex-shrink-0 flex items-center justify-center select-none pl-1 pt-1.5">
                                    {isDownloading ? (
                                        <div className="relative w-8 h-8 flex items-center justify-center group/cancel">
                                            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                                                <circle
                                                    cx="16"
                                                    cy="16"
                                                    r="11.5"
                                                    className="stroke-slate-200 dark:stroke-slate-800"
                                                    strokeWidth="2.5"
                                                    fill="transparent"
                                                />
                                                <circle
                                                    cx="16"
                                                    cy="16"
                                                    r="11.5"
                                                    className="stroke-primary transition-all duration-150 ease-out"
                                                    strokeWidth="2.5"
                                                    fill="transparent"
                                                    strokeDasharray={72.25}
                                                    strokeDashoffset={72.25 - (progress / 100) * 72.25}
                                                />
                                            </svg>
                                            <button 
                                                onClick={handleCancel}
                                                className="absolute inset-0 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer"
                                                aria-label="Cancel download"
                                            >
                                                <X size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ) : downloadCompleted ? (
                                        <div className="flex items-center gap-1.5">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => triggerFileDownload(downloadLanguage)}
                                                className="px-2.5 py-1 text-[10px] md:text-xs font-bold text-primary bg-primary/10 dark:bg-primary/25 rounded-full hover:bg-primary/20 dark:hover:bg-primary/35 transition cursor-pointer flex items-center gap-1"
                                                aria-label="Open document"
                                            >
                                                <Eye size={12} />
                                                <span>{language === 'fr' ? 'Ouvrir' : 'Open'}</span>
                                            </motion.button>
                                            <button
                                                onClick={handleClear}
                                                className="p-1 rounded-full text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                                aria-label="Delete history"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleDownload(downloadLanguage)}
                                            className="p-2 rounded-full text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                                        >
                                            <Download size={14} />
                                        </button>
                                    )}
                                </div>

                            </div>

                            {/* Info Disclosure Panel (Accordion details) shown BY DEFAULT */}
                            <AnimatePresence>
                                {showHashDetails && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-slate-100 dark:border-white/5 pt-2.5 mt-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-mono select-text"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-sans font-semibold text-slate-450">{language === 'fr' ? 'Type' : 'Format'}:</span>
                                            <span className="text-slate-600 dark:text-slate-300 font-semibold">Adobe PDF (.pdf)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-sans font-semibold text-slate-450">{language === 'fr' ? 'Emplacement' : 'Where'}:</span>
                                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title="Vercel Cloud Storage">Cloud Storage</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-sans font-semibold text-slate-450">{language === 'fr' ? 'Lien de téléchargement' : 'Direct Link'}:</span>
                                            <div className="flex items-center justify-between gap-2 bg-slate-55 dark:bg-white/5 p-1 rounded border border-slate-100 dark:border-white/5">
                                                <span className="truncate text-[9px] text-slate-500 dark:text-slate-300 max-w-[190px]">
                                                    {resumeUrls[downloadLanguage]}
                                                </span>
                                                <button 
                                                    onClick={handleCopyFileLink}
                                                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:text-primary transition cursor-pointer text-slate-500"
                                                    title="Copy link"
                                                >
                                                    {copiedUrl ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-sans font-semibold text-slate-450">SHA256 Integrity:</span>
                                            <div className="flex items-center justify-between gap-2 bg-slate-55 dark:bg-white/5 p-1 rounded border border-slate-100 dark:border-white/5">
                                                <span className="truncate text-[9px] text-slate-500 dark:text-slate-300">
                                                    {resumeHashes[downloadLanguage]}
                                                </span>
                                                <button 
                                                    onClick={(e) => handleCopy(e, resumeHashes[downloadLanguage], downloadLanguage)}
                                                    className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:text-primary transition cursor-pointer text-slate-500"
                                                    title="Copy SHA-256 Hash"
                                                >
                                                    {copiedHashKey === downloadLanguage ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. IMMERSIVE PDF VISUALISER MODAL */}
            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4 md:p-6 select-none"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-sans font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
                                            <span>
                                                {previewLanguage === 'fr' 
                                                    ? 'Visualiseur de Curriculum Vitae' 
                                                    : 'Curriculum Vitae Visualiser'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold uppercase">
                                                {previewLanguage}
                                            </span>
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-sans">
                                            {previewLanguage === 'fr' ? 'Aperçu interactif haute fidélité' : 'High-fidelity interactive document preview'}
                                        </p>
                                    </div>
                                </div>

                                {/* Controls: Lang selector, Tab Selector, Close button */}
                                <div className="flex items-center justify-end gap-2.5 flex-wrap">
                                    {/* Modal Tab Switcher */}
                                    <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                                        <button
                                            onClick={() => setPreviewTab('pdf')}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                                previewTab === 'pdf' 
                                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {previewLanguage === 'fr' ? 'Document PDF' : 'PDF Document'}
                                        </button>
                                        <button
                                            onClick={() => setPreviewTab('text')}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                                previewTab === 'text' 
                                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {previewLanguage === 'fr' ? 'Dossier Interactif' : 'Interactive Dossier'}
                                        </button>
                                    </div>

                                    {/* Language Switcher */}
                                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                        <button
                                            onClick={() => setPreviewLanguage('en')}
                                            className={`w-7 h-6 flex items-center justify-center text-[10px] font-bold rounded cursor-pointer ${
                                                previewLanguage === 'en'
                                                    ? 'bg-primary text-white dark:text-dark-bg font-extrabold'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            EN
                                        </button>
                                        <button
                                            onClick={() => setPreviewLanguage('fr')}
                                            className={`w-7 h-6 flex items-center justify-center text-[10px] font-bold rounded cursor-pointer ${
                                                previewLanguage === 'fr'
                                                    ? 'bg-primary text-white dark:text-dark-bg font-extrabold'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            FR
                                        </button>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setIsPreviewOpen(false)}
                                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                        aria-label="Close preview"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content Pane */}
                            <div className="flex-grow overflow-y-auto relative bg-slate-50 dark:bg-slate-950/40">
                                {previewTab === 'pdf' ? (
                                    <div className="w-full h-full relative">
                                        {/* Fallback info card under the iframe */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center z-0">
                                            <FileText size={48} className="text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                {previewLanguage === 'fr' ? 'Affichage du document PDF...' : 'Rendering PDF Document View...'}
                                            </p>
                                            <p className="text-xs text-slate-400 max-w-xs mb-4">
                                                {previewLanguage === 'fr' 
                                                    ? "Si l'aperçu ne se charge pas dans votre navigateur, cliquez sur le bouton ci-dessous pour l'ouvrir directement." 
                                                    : "If the viewer doesn't display instantly on your device, click the button below to view it directly."}
                                            </p>
                                            <a 
                                                href={resumeUrls[previewLanguage]} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="px-4 py-2 bg-primary text-white dark:text-dark-bg text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm cursor-pointer hover:opacity-90"
                                            >
                                                <ExternalLink size={14} />
                                                <span>{previewLanguage === 'fr' ? 'Ouvrir en plein écran' : 'Open Fullscreen'}</span>
                                            </a>
                                        </div>

                                        <iframe
                                            src={`${resumeUrls[previewLanguage]}#toolbar=1&navpanes=0&scrollbar=1`}
                                            className="w-full h-full border-0 relative z-10 bg-white dark:bg-slate-900"
                                            title="CV Preview"
                                        />
                                    </div>
                                ) : (
                                    /* Interactive Document Text Summary Fallback Drawer */
                                    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8 select-text">
                                        
                                        {/* Dynamic Control Bar (Search, Active filter info, Copy & Export buttons) */}
                                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-4">
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                                {/* Search Field */}
                                                <div className="relative flex-grow">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                                                        <Search size={14} />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => {
                                                            setSearchQuery(e.target.value);
                                                            if (activeSkillFilter) setActiveSkillFilter(null); // Reset skill filter on manual search
                                                        }}
                                                        placeholder={previewLanguage === 'fr' ? 'Rechercher une compétence, un rôle, un outil...' : 'Search skills, roles, credentials...'}
                                                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Developer Export Actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleCopyMarkdown}
                                                        className="px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                                                        title="Copy CV in Markdown format"
                                                    >
                                                        {copiedMarkdown ? <Check size={12} className="text-primary animate-bounce" /> : <Copy size={12} />}
                                                        <span>{copiedMarkdown ? (previewLanguage === 'fr' ? 'Copié !' : 'Copied!') : (previewLanguage === 'fr' ? 'Copier MD' : 'Copy MD')}</span>
                                                    </button>
                                                    <button
                                                        onClick={handleExportJSON}
                                                        className="px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
                                                        title="Export CV as JSON structure"
                                                    >
                                                        <FileText size={12} />
                                                        <span>{previewLanguage === 'fr' ? 'Export JSON' : 'Export JSON'}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Active Filter Indicators */}
                                            {(activeSkillFilter || searchQuery) && (
                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5 text-[10px] md:text-xs">
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <Filter size={11} className="text-primary animate-pulse" />
                                                        <span>
                                                            {previewLanguage === 'fr' ? 'Filtres actifs :' : 'Active Filters:'}
                                                        </span>
                                                        {activeSkillFilter && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                                                {activeSkillFilter}
                                                                <button onClick={() => setActiveSkillFilter(null)} className="hover:text-red-500 cursor-pointer">
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        )}
                                                        {searchQuery && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold font-mono">
                                                                "{searchQuery}"
                                                                <button onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer">
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setActiveSkillFilter(null);
                                                            setSearchQuery('');
                                                        }}
                                                        className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                                    >
                                                        {previewLanguage === 'fr' ? 'Réinitialiser' : 'Reset All'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Stats Counters Overview */}
                                            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
                                                <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-white/5 text-center flex flex-col justify-center items-center">
                                                    <div className="text-xs font-mono font-extrabold text-primary flex items-center gap-1">
                                                        <Award size={10} />
                                                        <span>{totalCertsCount}</span>
                                                    </div>
                                                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-400 dark:text-slate-500">
                                                        {previewLanguage === 'fr' ? 'Certifications' : 'Certifications'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-white/5 text-center flex flex-col justify-center items-center">
                                                    <div className="text-xs font-mono font-extrabold text-primary flex items-center gap-1">
                                                        <Sparkles size={10} />
                                                        <span>{totalUniqueSkillsCount}</span>
                                                    </div>
                                                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-400 dark:text-slate-500">
                                                        {previewLanguage === 'fr' ? 'Compétences' : 'Skills'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-150 dark:border-white/5 text-center flex flex-col justify-center items-center">
                                                    <div className="text-xs font-mono font-extrabold text-primary flex items-center gap-1">
                                                        <Briefcase size={10} />
                                                        <span>5+ Yrs</span>
                                                    </div>
                                                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-mono font-semibold text-slate-400 dark:text-slate-500">
                                                        {previewLanguage === 'fr' ? 'Expérience' : 'Experience'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Profile Brief header card */}
                                        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-sm space-y-3">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <h4 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-800 dark:text-white tracking-tight">
                                                        ANGESH CHANDERDIP
                                                    </h4>
                                                    <p className="text-sm font-semibold text-primary font-sans mt-0.5">
                                                        {previewLanguage === 'fr' 
                                                            ? 'Spécialiste du Support Applicatif & Ingénieur Sécurité' 
                                                            : 'Application Support Specialist & Security Engineer'}
                                                    </p>
                                                </div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-sans space-y-1">
                                                    <div className="flex items-center gap-1"><span>Email:</span> <span className="font-mono text-slate-600 dark:text-slate-350 select-all">angesh021@gmail.com</span></div>
                                                    <div className="flex items-center gap-1"><span>GitHub:</span> <a href="https://github.com/angesh021" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/angesh021</a></div>
                                                    <div className="flex items-center gap-1"><span>LinkedIn:</span> <a href="https://linkedin.com/in/angesh-chanderdip" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">linkedin.com/in/angesh-chanderdip</a></div>
                                                </div>
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans border-t border-slate-100 dark:border-white/5 pt-3">
                                                {previewLanguage === 'fr'
                                                    ? 'Professionnel dévoué de la cybersécurité et du cloud avec une solide expérience dans la configuration de réseaux sécurisés, la maintenance de bases de données (SQL Server, PostgreSQL), et l\'automatisation des processus opérationnels.'
                                                    : 'Dedicated Cybersecurity & Cloud professional with a strong track record of configuring secure enterprise networks, maintaining database infrastructure (SQL Server, PostgreSQL), and automating operational workflows.'}
                                            </p>
                                        </div>

                                        {/* Core Tech Stack categories (Moved up so they can click to filter roles first!) */}
                                        <div className="space-y-4">
                                            <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <span>{previewLanguage === 'fr' ? 'Compétences Spécifiques (Cliquer pour filtrer)' : 'Skills Expertise (Click to Filter)'}</span>
                                                <div className="h-[1px] bg-slate-200 dark:bg-white/5 flex-grow" />
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                {Object.entries(filteredSkillsCategories).map(([catName, catData]: [string, any]) => (
                                                    <div key={catName} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-2 shadow-sm transition-all hover:shadow-md">
                                                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider" style={{ color: catData.color || '#ffc300' }}>
                                                            {catName}
                                                        </span>
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {catData.skills?.map((sk: any, sIdx: number) => {
                                                                const isSelected = activeSkillFilter?.toLowerCase() === sk.name.toLowerCase();
                                                                return (
                                                                    <button
                                                                        key={sIdx}
                                                                        onClick={() => {
                                                                            if (isSelected) {
                                                                                setActiveSkillFilter(null);
                                                                            } else {
                                                                                setActiveSkillFilter(sk.name);
                                                                                setSearchQuery(''); // Clear manual search query
                                                                            }
                                                                        }}
                                                                        className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer border ${
                                                                            isSelected
                                                                                ? 'bg-primary text-white dark:text-dark-bg border-primary font-bold shadow-sm'
                                                                                : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold border-slate-100 dark:border-white/5 hover:border-primary/30 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                                                                        }`}
                                                                        title={previewLanguage === 'fr' ? 'Filtrer l\'expérience par cette compétence' : 'Filter experience by this skill'}
                                                                    >
                                                                        {sk.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                {Object.keys(filteredSkillsCategories).length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl col-span-full">
                                                        {previewLanguage === 'fr' ? 'Aucune compétence ne correspond à la recherche' : 'No skills found matching search criteria'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Work Experience timelines */}
                                        <div className="space-y-4">
                                            <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <span>{previewLanguage === 'fr' ? 'Expérience Professionnelle' : 'Professional Experience'}</span>
                                                <div className="h-[1px] bg-slate-200 dark:bg-white/5 flex-grow" />
                                            </h5>
                                            <div className="space-y-4">
                                                {filteredExperience.map((exp: any, idx: number) => (
                                                    <div key={idx} className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-3.5 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex gap-2.5 items-start">
                                                                <div className="p-2 rounded-lg bg-primary/5 text-primary mt-0.5 shrink-0">
                                                                    <Briefcase size={14} />
                                                                </div>
                                                                <div>
                                                                    <h6 className="font-sans font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-snug">{exp.role}</h6>
                                                                    <p className="text-xs font-semibold text-primary mt-0.5">{exp.company} • <span className="text-[10px] text-slate-400 dark:text-slate-500">{exp.location}</span></p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] px-2 py-0.5 font-bold font-mono rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{exp.period}</span>
                                                        </div>

                                                        {/* Role Bullets for more detail */}
                                                        {exp.bullets && exp.bullets.length > 0 && (
                                                            <ul className="text-xs text-slate-600 dark:text-slate-350 space-y-1.5 pl-4 sm:pl-7 list-disc leading-relaxed">
                                                                {exp.bullets.map((bullet: string, bIdx: number) => (
                                                                    <li key={bIdx}>{bullet}</li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {exp.skills && (
                                                            <div className="flex flex-wrap gap-1.5 pt-1.5 pl-0 sm:pl-7 border-t border-slate-50 dark:border-white/5">
                                                                {exp.skills.map((sk: any, sIdx: number) => {
                                                                    const isFiltered = activeSkillFilter?.toLowerCase() === sk.name.toLowerCase();
                                                                    return (
                                                                        <button 
                                                                            key={sIdx} 
                                                                            onClick={() => {
                                                                                if (isFiltered) {
                                                                                    setActiveSkillFilter(null);
                                                                                } else {
                                                                                    setActiveSkillFilter(sk.name);
                                                                                    setSearchQuery('');
                                                                                }
                                                                            }}
                                                                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer font-semibold ${
                                                                                isFiltered
                                                                                    ? 'bg-primary border-primary text-white dark:text-dark-bg font-bold shadow-sm'
                                                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-primary/20'
                                                                            }`}
                                                                            title={sk.context || (previewLanguage === 'fr' ? 'Cliquer pour filtrer' : 'Click to filter')}
                                                                        >
                                                                            {sk.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {filteredExperience.length === 0 && (
                                                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                                                        {previewLanguage === 'fr' ? 'Aucune expérience ne correspond aux filtres de recherche' : 'No experience records match your active search and filters'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Certifications Category section */}
                                        <div className="space-y-4">
                                            <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <span>{previewLanguage === 'fr' ? 'Certifications Professionnelles' : 'Professional Certifications'}</span>
                                                <div className="h-[1px] bg-slate-200 dark:bg-white/5 flex-grow" />
                                            </h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {filteredCertifications.map((cert: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex gap-2.5 items-start">
                                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
                                                                        <Award size={13} />
                                                                    </div>
                                                                    <div>
                                                                        <h6 className="font-sans font-bold text-xs text-slate-800 dark:text-white leading-snug">{cert.name}</h6>
                                                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-0.5">{cert.issuer}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">{cert.date.replace('Issued ', '')}</span>
                                                            </div>
                                                            {cert.skillsGained && cert.skillsGained.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {cert.skillsGained.map((sk: string, sIdx: number) => {
                                                                        const isFiltered = activeSkillFilter?.toLowerCase() === sk.toLowerCase();
                                                                        return (
                                                                            <span
                                                                                key={sIdx}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (isFiltered) {
                                                                                        setActiveSkillFilter(null);
                                                                                    } else {
                                                                                        setActiveSkillFilter(sk);
                                                                                        setSearchQuery('');
                                                                                    }
                                                                                }}
                                                                                className={`text-[8px] px-1 py-0.2 rounded border cursor-pointer font-semibold transition-all ${
                                                                                    isFiltered
                                                                                        ? 'bg-primary border-primary text-white dark:text-dark-bg font-extrabold'
                                                                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-primary/20 hover:text-primary'
                                                                                }`}
                                                                            >
                                                                                {sk}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {cert.credentialUrl && cert.credentialUrl !== '#' && (
                                                            <a
                                                                href={cert.credentialUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[9px] font-mono font-bold text-primary flex items-center gap-1 hover:underline pt-2 border-t border-slate-50 dark:border-white/5 cursor-pointer mt-auto w-fit"
                                                            >
                                                                <span>{previewLanguage === 'fr' ? 'Vérifier l\'accréditation' : 'Verify Credential'}</span>
                                                                <ArrowRight size={10} />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                                {filteredCertifications.length === 0 && (
                                                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl col-span-full">
                                                        {previewLanguage === 'fr' ? 'Aucune certification ne correspond aux filtres de recherche' : 'No certifications match your active search and filters'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Education Timeline */}
                                        <div className="space-y-4">
                                            <h5 className="font-sans font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <span>{previewLanguage === 'fr' ? 'Éducation et Formation' : 'Education & Credentials'}</span>
                                                <div className="h-[1px] bg-slate-200 dark:bg-white/5 flex-grow" />
                                            </h5>
                                            <div className="space-y-3">
                                                {filteredEducation.map((edu: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 flex justify-between gap-3 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex gap-2.5 items-start">
                                                            <div className="p-2 rounded-lg bg-primary/5 text-primary mt-0.5 shrink-0">
                                                                <BookOpen size={14} />
                                                            </div>
                                                            <div>
                                                                <h6 className="font-sans font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-snug">{edu.degree}</h6>
                                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{edu.school}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 font-bold font-mono rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 h-fit whitespace-nowrap">{edu.year}</span>
                                                    </div>
                                                ))}
                                                {filteredEducation.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                                                        {previewLanguage === 'fr' ? 'Aucune formation ne correspond aux filtres' : 'No education records match your active search and filters'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer bar */}
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-[10px] md:text-xs text-slate-400 font-mono flex items-center gap-2 truncate">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    <span className="truncate">SHA256: {resumeHashes[previewLanguage]}</span>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={handleCopyFileLink}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
                                    >
                                        {copiedUrl ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                                        <span>{copiedUrl ? (previewLanguage === 'fr' ? 'Copié !' : 'Copied!') : (previewLanguage === 'fr' ? 'Copier le lien' : 'Copy Link')}</span>
                                    </button>
                                    <a
                                        href={resumeUrls[previewLanguage]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
                                    >
                                        <ExternalLink size={12} />
                                        <span>{previewLanguage === 'fr' ? 'Ouvrir externe' : 'Open External'}</span>
                                    </a>
                                    <button
                                        onClick={() => {
                                            setIsPreviewOpen(false);
                                            handleDownload(previewLanguage);
                                        }}
                                        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white dark:text-dark-bg hover:opacity-90 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Download size={12} />
                                        <span>{previewLanguage === 'fr' ? 'Télécharger' : 'Download Now'}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ResumeDownloader;
