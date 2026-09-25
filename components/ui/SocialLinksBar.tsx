import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';
import { Github, Linkedin, Mail } from 'lucide-react';
import { AnalyticsTracker } from '../../lib/analyticsTracker';

const getIcon = (iconVal: any, nameVal?: string) => {
  const iconStr = typeof iconVal === 'string' ? iconVal : '';
  const nameStr = typeof nameVal === 'string' ? nameVal : '';

  if (iconStr === 'Github' || nameStr.toLowerCase() === 'github') return Github;
  if (iconStr === 'Linkedin' || nameStr.toLowerCase() === 'linkedin') return Linkedin;
  if (iconStr === 'Mail' || nameStr.toLowerCase() === 'email' || nameStr.toLowerCase() === 'mail') return Mail;
  
  return Mail;
};

const AUTH_DURATION_MS = 1500; // 1.5 seconds for authentication animation

/**
 * A single interactive social link button with an authentication animation.
 */
const SocialLink: React.FC<{ link: any }> = ({ link }) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const Icon = getIcon(link.icon, link.name);

    const handleClick = (e: React.MouseEvent) => {
        if (isAuthenticating) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        setIsAuthenticating(true);
        
        // Track privacy-safe engagement metrics
        const normName = (link.name || '').toLowerCase();
        if (normName === 'github') {
            AnalyticsTracker.trackEngagementEvent('github_click', 'social_bar');
        } else if (normName === 'linkedin') {
            AnalyticsTracker.trackEngagementEvent('linkedin_click', 'social_bar');
        } else if (normName === 'email' || normName === 'mail') {
            AnalyticsTracker.trackEngagementEvent('email_click', 'social_bar');
        } else {
            AnalyticsTracker.trackEngagementEvent('external_click', normName || 'social_button');
        }
    };

    useEffect(() => {
        if (isAuthenticating) {
            const timer = setTimeout(() => {
                window.open(link.url, '_blank', 'noopener,noreferrer');
                setIsAuthenticating(false);
            }, AUTH_DURATION_MS);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticating, link.url]);

    return (
        <div className="social-link-wrapper">
            <motion.a
                href={link.url}
                onClick={handleClick}
                aria-disabled={isAuthenticating}
                className="social-auth-link"
                aria-label={`Connect on ${link.name}`}
                whileHover={!isAuthenticating ? { scale: 1.1 } : {}}
                whileTap={!isAuthenticating ? { scale: 0.95 } : {}}
            >
                <div className="social-auth-icon-wrapper">
                    <motion.div
                        key="icon"
                        initial={{ opacity: 1, scale: 1 }}
                    >
                        <Icon size={24} />
                    </motion.div>
                </div>
                <AnimatePresence>
                    {isAuthenticating && (
                        <svg className="social-auth-progress-ring" width="64" height="64" viewBox="0 0 64 64">
                            <circle
                                cx="32" cy="32" r={radius}
                                stroke="rgba(100, 255, 218, 0.2)"
                                strokeWidth="4"
                                fill="transparent"
                            />
                            <motion.circle
                                cx="32" cy="32" r={radius}
                                stroke="#64ffda"
                                strokeWidth="4"
                                fill="transparent"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: 0 }}
                                exit={{ strokeDashoffset: circumference }}
                                transition={{ duration: AUTH_DURATION_MS / 1000, ease: 'linear' }}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                        </svg>
                    )}
                </AnimatePresence>
            </motion.a>
            <AnimatePresence>
                {isAuthenticating && (
                    <motion.span
                        key="text"
                        className="social-auth-text"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        Authenticating
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};


/**
 * Renders a row of circular social link buttons.
 * Each button has a click-to-authenticate animation before opening the link.
 */
const SocialLinksBar: React.FC = () => {
    const { language } = useI18n();
    const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
    const socialLinks = personalData.socialLinks || [];
    
    return (
        <div className="social-auth-bar">
            {socialLinks.map(link => (
                <SocialLink key={link.name} link={link} />
            ))}
        </div>
    );
};

export default SocialLinksBar;