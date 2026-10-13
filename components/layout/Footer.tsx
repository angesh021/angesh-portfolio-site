import React, { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useInView } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import ChangelogModal from '../ui/ChangelogModal';
import { LegalModal } from '../ui/LegalModal';
import { AngeshLogo } from '../ui/AngeshLogo';
import { Code, Layers, Users, Coffee, Clock, Github, Linkedin, Mail } from 'lucide-react';

const getIcon = (iconVal: any, nameVal?: string) => {
  const iconStr = typeof iconVal === 'string' ? iconVal : '';
  const nameStr = typeof nameVal === 'string' ? nameVal : '';

  if (iconStr === 'Github' || nameStr.toLowerCase() === 'github') return Github;
  if (iconStr === 'Linkedin' || nameStr.toLowerCase() === 'linkedin') return Linkedin;
  if (iconStr === 'Mail' || nameStr.toLowerCase() === 'email' || nameStr.toLowerCase() === 'mail') return Mail;
  
  return Mail;
};

// --- Stat Tooltip Component ---
interface StatTooltipProps {
    activeId: string | null;
    statRefs: React.RefObject<{ [key: string]: HTMLButtonElement | null }>;
    statsData: any[];
    onClose: () => void;
}

const StatTooltip: React.FC<StatTooltipProps> = ({ activeId, statRefs, statsData, onClose }) => {
    const [coords, setCoords] = useState<{ top: number; left: number; flipped: boolean } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    if (!activeId) return null;

    const stat = statsData.find(s => s.id === activeId);
    const triggerRef = statRefs.current?.[activeId];
    if (!stat || !triggerRef) return null;

    useEffect(() => {
        const updatePosition = () => {
            const rect = triggerRef.getBoundingClientRect();
            const tooltipEl = tooltipRef.current;
            
            let tooltipWidth = 200; // fallback
            let tooltipHeight = 85;  // fallback

            if (tooltipEl) {
                tooltipWidth = tooltipEl.offsetWidth;
                tooltipHeight = tooltipEl.offsetHeight;
            }

            // Ideal position is directly above the centered button
            let targetLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            let targetTop = rect.top - tooltipHeight - 10;
            let isFlipped = false;

            // Keep within viewport boundaries with 16px of margin
            const padding = 16;
            const viewportWidth = window.innerWidth;

            // Horizontal bounds correction
            if (targetLeft < padding) {
                targetLeft = padding;
            } else if (targetLeft + tooltipWidth > viewportWidth - padding) {
                targetLeft = viewportWidth - tooltipWidth - padding;
            }

            // Vertical bounds correction: if the tooltip goes off the top of the screen, place it below the button instead!
            if (targetTop < padding) {
                targetTop = rect.bottom + 10;
                isFlipped = true;
            }

            setCoords({ top: targetTop, left: targetLeft, flipped: isFlipped });
        };

        // Run initially
        updatePosition();

        // Also update on window resize or scroll
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [activeId, triggerRef]);

    const initialRect = triggerRef.getBoundingClientRect();
    const topVal = coords ? coords.top : initialRect.top - 95;
    const leftVal = coords ? coords.left : initialRect.left + initialRect.width / 2 - 100;
    const opacityVal = coords ? 1 : 0;
    const initialY = coords ? (coords.flipped ? -10 : 10) : 10;

    return (
        <>
            <div className="stat-tooltip-backdrop" onClick={onClose} />
            <motion.div
                ref={tooltipRef}
                className="stat-tooltip-container"
                style={{
                    top: topVal,
                    left: leftVal,
                    opacity: opacityVal,
                }}
                initial={{ opacity: 0, y: initialY }}
                animate={{ opacity: opacityVal, y: 0 }}
                exit={{ opacity: 0, y: initialY }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
            >
                <div className="stat-tooltip-content">
                    <h4>{stat.label}</h4>
                    {typeof stat.tooltipContent === 'string' ? (
                        <p>{stat.tooltipContent}</p>
                    ) : (
                        <ul>
                            {Object.entries(stat.tooltipContent).map(([key, value]) => (
                                // FIX: Explicitly cast value to string to prevent type error.
                                <li key={key}><span>{key}:</span> <span>{String(value)}</span></li>
                            ))}
                        </ul>
                    )}
                </div>
            </motion.div>
        </>
    );
};

// --- Interactive Stat Component ---
interface InteractiveStatProps {
    value: number;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

const InteractiveStat = forwardRef<HTMLButtonElement, InteractiveStatProps>(({ value, label, icon, onClick }, ref) => {
    const valueRef = useRef<HTMLSpanElement>(null);
    const isInView = useInView(valueRef, { once: true, margin: "0px 0px -20px 0px" });
    const spring = useSpring(0, { mass: 0.8, stiffness: 100, damping: 15 });

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [isInView, value, spring]);

    useEffect(() => {
        const unsubscribe = spring.on("change", (latest) => {
            if (valueRef.current) {
                valueRef.current.textContent = Math.round(latest).toLocaleString();
            }
        });
        return () => unsubscribe();
    }, [spring]);

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            className="flex items-center justify-center gap-2 p-1 rounded-md transition-colors hover:bg-primary/10"
            whileTap={{ scale: 0.95 }}
            aria-label={`View details for ${label}`}
        >
            {icon}
            <span className="w-12 text-left font-semibold text-dark-text tabular-nums"><span ref={valueRef}>0</span></span>
        </motion.button>
    );
});

// --- Uptime Component ---
const UptimeStat: React.FC<{ uptime: string }> = ({ uptime }) => (
    <div className="flex items-center justify-center gap-2 p-1" aria-label={`System Uptime: ${uptime}`}>
      <Clock size={14} className="text-primary"/>
      <span className="w-auto text-center font-semibold text-dark-text tabular-nums">{uptime}</span>
    </div>
);

// --- Main Footer Component ---
const Footer: React.FC = () => {
    const { language, t } = useI18n();
    const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
    const socialLinks = personalData.socialLinks || [];
    const changelogData = personalData.changelogData || [];
    
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [activeSessions, setActiveSessions] = useState(1);
    const [uptime, setUptime] = useState('00:00:00');
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const statRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
    
    const statsData = [
        { id: 'loc', value: 5500, label: t('footer_stat_loc'), icon: <Code size={14} className="text-primary"/>, tooltipContent: { 'TSX': '65%', 'CSS': '20%', 'Other': '15%' } },
        { id: 'components', value: 27, label: t('footer_stat_components'), icon: <Layers size={14} className="text-primary"/>, tooltipContent: t('footer_stat_components_tooltip') },
        { id: 'sessions', value: activeSessions, label: t('footer_stat_sessions'), icon: <Users size={14} className="text-primary"/>, tooltipContent: t('footer_stat_sessions_tooltip') },
        { id: 'coffee', value: 3458, label: t('footer_stat_coffee'), icon: <Coffee size={14} className="text-primary"/>, tooltipContent: t('footer_stat_coffee_tooltip') }
    ];
    
    // Uptime and Active Sessions Effect
    useEffect(() => {
        let serverUptimeOffset = Date.now(); // fallback
        
        const formatUptime = (ms: number) => {
            const totalSeconds = Math.max(0, Math.floor(ms / 1000));
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health');
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data.activeUsers === 'number') {
                        setActiveSessions(data.activeUsers);
                    }
                    if (typeof data.uptimeSeconds === 'number') {
                        serverUptimeOffset = Date.now() - (data.uptimeSeconds * 1000);
                        // Clear offline/disconn states on successful query
                        setUptime(prev => (prev === "OFFLINE" || prev === "DISCONN") ? "00:00:00" : prev);
                    }
                } else {
                    setUptime("OFFLINE");
                }
            } catch (err) {
                setUptime("DISCONN");
            }
        };

        // Initial fetch
        fetchHealth();

        // Local high-resolution second ticker
        const clockInterval = setInterval(() => {
            setUptime(prev => {
                if (prev === "OFFLINE" || prev === "DISCONN") return prev;
                return formatUptime(Date.now() - serverUptimeOffset);
            });
        }, 1000);

        // Slow telemetry polling (every 15 seconds)
        const pollInterval = setInterval(fetchHealth, 15000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(pollInterval);
        };
    }, []);

    const handleStatClick = (id: string) => {
        setActiveTooltip(prev => prev === id ? null : id);
    };

    // ========================================
    // Secret Admin Login Trigger (Mobile Support)
    // ========================================
    const [clickCount, setClickCount] = useState(0);
    const handleCopyrightClick = () => {
        setClickCount(prev => prev + 1);
        if (clickCount + 1 >= 7) {
            window.dispatchEvent(new Event('triggerAdminLogin'));
            setClickCount(0);
        }
    };

    useEffect(() => {
        if (clickCount > 0) {
            const timer = setTimeout(() => setClickCount(0), 2000);
            return () => clearTimeout(timer);
        }
    }, [clickCount]);

    return (
        <>
            <footer className="w-full max-w-7xl mx-auto px-6 md:px-10 py-6 font-mono text-dark-text-secondary text-xs footer-text-glow">
                {/* Horizontal Separator Line */}
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mb-6 opacity-60 blur-[1px]" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                    
                    {/* Left Column */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                        <div className="mb-1">
                            <AngeshLogo size={34} variant="horizontal" />
                        </div>
                        <p className="max-w-xs">
                            {t('footer_description')}
                        </p>
                        <p 
                            className="text-[11px] text-dark-text-secondary/70 pt-1 cursor-default select-none"
                            onClick={handleCopyrightClick}
                        >
                            &copy; {new Date().getFullYear()} Angesh Chanderdip. {t('footer_rights_reserved')}
                        </p>
                    </div>

                    {/* Middle Column */}
                    <div className="flex flex-col items-center justify-start text-center">
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                           {statsData.map(stat => (
                               <InteractiveStat
                                   key={stat.id}
                                   // FIX: Use a block to ensure the ref callback returns void.
                                   ref={el => { statRefs.current[stat.id] = el; }}
                                   value={stat.id === 'sessions' ? activeSessions : stat.value}
                                   label={stat.label}
                                   icon={stat.icon}
                                   onClick={() => handleStatClick(stat.id)}
                               />
                           ))}
                           <UptimeStat uptime={uptime} />
                        </div>
                    </div>


                    {/* Right Column */}
                    <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-3 h-3">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary/75 animate-ping"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </div>
                                <p className="font-bold tracking-wider text-primary">{t('footer_open_opportunities')}</p>
                            </div>
                             <div className="flex items-center gap-6">
                                {socialLinks.map((link: any) => {
                                    const Icon = getIcon(link.icon, link.name);
                                    return (
                                        <motion.a 
                                            key={link.name} 
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={link.name}
                                            className="text-dark-text-secondary hover:text-primary"
                                            whileHover={{ y: -3 }}
                                        >
                                            <Icon size={20} />
                                        </motion.a>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="text-[11px] text-center md:text-right space-y-1 pt-1">
                            <p>
                                <button onClick={() => setIsChangelogOpen(true)} className="footer-clickable-link">
                                    {t('footer_sys_version')} {changelogData[0]?.version || 'v1.0.0'}
                                </button>
                                <span className="mx-2 opacity-50">|</span>
                                <button onClick={() => setIsPrivacyOpen(true)} className="footer-clickable-link">
                                    {language === 'fr' ? 'Confidentialité & Mentions Légales' : 'Privacy & Legal'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
            
            <AnimatePresence>
                {activeTooltip && (
                    <StatTooltip 
                        activeId={activeTooltip} 
                        statRefs={statRefs} 
                        statsData={statsData} 
                        onClose={() => setActiveTooltip(null)} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isChangelogOpen && <ChangelogModal onClose={() => setIsChangelogOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
               {isPrivacyOpen && (
                 <LegalModal 
                   isOpen={isPrivacyOpen} 
                   onClose={() => setIsPrivacyOpen(false)} 
                 />
               )}
            </AnimatePresence>
        </>
    );
};

export default Footer;