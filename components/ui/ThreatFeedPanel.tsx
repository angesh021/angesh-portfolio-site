import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill } from '../../types';
import { useI18n } from '../../hooks/useI18n';

interface SkillTarget extends Skill {
  categoryColor: string;
  targetCoords: { x: number; y: number };
  categoryName: string;
}

interface ThreatFeedPanelProps {
  activeSkill: SkillTarget | null;
}

const threatTemplates: { [key: string]: string[] } = {
    "Defense & Response": [
        "[WARN] Anomalous login pattern detected from new geo-location.",
        "[CRITICAL] Potential policy violation: Unauthorized USB device connected.",
        "[INFO] 802.1X authentication successful for endpoint DEV-PC-01.",
        "[CRITICAL] Ransomware signature match found: {skill}. Quarantining endpoint.",
    ],
    "Automation & Scripting": [
        "[INFO] Script execution successful: Certificate rotation completed.",
        "[WARN] High-privilege command detected in {skill} script.",
        "[CRITICAL] Anomalous PowerShell execution detected from non-interactive process.",
    ],
    "Security Operations": [
        "[INFO] SIEM correlation rule triggered for {skill} analysis.",
        "[WARN] Brute-force attempt detected on external interface.",
        "[INFO] Deep packet inspection initiated with Wireshark.",
        "[CRITICAL] Web application attack signature matched: SQLi attempt.",
    ],
    "Infrastructure & Cloud": [
        "[INFO] New IAM role created with least-privilege policy.",
        "[WARN] Unusual outbound traffic from production server.",
        "[CRITICAL] Security group misconfiguration detected: Port 22 open to 0.0.0.0/0.",
        "[INFO] Active Directory GPO successfully applied to all endpoints.",
    ]
};

const generateThreats = (skill: SkillTarget | null): string[] => {
    if (!skill) {
        return ["[INFO] System nominal. Standby mode.", "[INFO] Awaiting operator input..."];
    }

    const category = skill.categoryName;
    const templates = threatTemplates[category] || [];

    // FIX: Handle cases where a category might not have associated threat templates.
    if (templates.length === 0) {
        return [`[INFO] Analyzing parameters for: ${skill.name}...`];
    }
    
    const threats: string[] = [];

    // Add 2-3 random threats from the category
    for (let i = 0; i < 3; i++) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        if (template) { 
            threats.push(template.replace('{skill}', skill.name));
        }
    }
    return threats;
};

const getSeverityClass = (log: string) => {
    if (!log) { // Guard against undefined/null/empty strings
        return 'severity-info';
    }
    if (log.startsWith('[CRITICAL]')) return 'severity-critical';
    if (log.startsWith('[WARN]')) return 'severity-warn';
    return 'severity-info';
};

const ThreatFeedPanel: React.FC<ThreatFeedPanelProps> = ({ activeSkill }) => {
    const { t } = useI18n();
    const [displayedThreats, setDisplayedThreats] = useState<string[]>([]);
    const feedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const threats = generateThreats(activeSkill);
        let currentIndex = 0;
        
        // Clear previous threats
        setDisplayedThreats([]);

        const interval = setInterval(() => {
            if (currentIndex < threats.length) {
                setDisplayedThreats(prev => [...prev, threats[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, activeSkill ? 300 : 1000); // Slower update for standby message

        return () => clearInterval(interval);
    }, [activeSkill]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [displayedThreats]);

    return (
        <div ref={feedRef} className="threat-feed-panel">
            <p className="threat-feed-title">{t('threat_live_feed') || '> LIVE THREAT INTELLIGENCE_'}</p>
            <AnimatePresence>
                {displayedThreats.map((log, index) => (
                    <motion.p
                        key={`${activeSkill?.name}-${index}`}
                        className={`threat-feed-log ${getSeverityClass(log)}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                       {`> ${log}`}
                    </motion.p>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ThreatFeedPanel;