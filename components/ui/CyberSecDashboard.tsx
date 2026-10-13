
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Maximize2, X, TerminalSquare, AppWindow, Zap } from 'lucide-react';
import SkillProfiler from './SkillProfiler';
import LiveClock from './LiveClock';
import { useI18n } from '../../hooks/useI18n';

type WindowState = 'open' | 'maximized' | 'docked' | 'closed';

const CyberSecDashboard: React.FC = () => {
    const { t } = useI18n();
    const [windowState, setWindowState] = useState<WindowState>('open');
    const [isScanning, setIsScanning] = useState(false);
    const constraintsRef = useRef<HTMLDivElement>(null);

    const handleAction = (e: React.MouseEvent, action: WindowState) => {
        e.stopPropagation();
        if (isScanning) return; // Prevent state changes during scan
        setWindowState(action);
    };

    const handleToggleMaximize = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isScanning) return;
        setWindowState(prev => prev === 'maximized' ? 'open' : 'maximized');
    };

    const handleScan = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (windowState === 'closed' || windowState === 'docked') {
            setWindowState('open');
            // Give window time to open before scanning
            setTimeout(() => setIsScanning(true), 500);
        } else {
            setIsScanning(true);
        }
    };

    const windowContent = (
        <motion.div
            className="w-full h-full flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
        >
            <motion.div layout="position" className="dashboard-title-bar">
                <div className="flex items-center gap-2">
                    <TerminalSquare size={12} className="text-primary" />
                    <span className="dashboard-title-text">{t('dash_skill_matrix') || '[ SKILL_ANALYSIS_MATRIX ]'}</span>
                </div>
                <div className="window-controls">
                    <button onClick={handleScan} disabled={isScanning} className="window-control-btn scan" aria-label="Run System Scan">
                        <Zap size={10} />
                    </button>
                    <button onClick={(e) => handleAction(e, 'docked')} disabled={isScanning} className="window-control-btn minimize" aria-label="Minimize">
                        <Minus size={10} />
                    </button>
                    <button onClick={handleToggleMaximize} disabled={isScanning} className="window-control-btn maximize" aria-label="Maximize">
                        <Maximize2 size={8} />
                    </button>
                    <button onClick={(e) => handleAction(e, 'closed')} disabled={isScanning} className="window-control-btn close" aria-label="Close">
                        <X size={10} />
                    </button>
                </div>
            </motion.div>
            
            {windowState !== 'docked' && (
              <motion.div
                layout="position"
                initial={{ opacity: 0, flexGrow: 0 }}
                animate={{ opacity: 1, flexGrow: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="dashboard-content"
              >
                <SkillProfiler isScanning={isScanning} onScanComplete={() => setIsScanning(false)} />
              </motion.div>
            )}

            {windowState !== 'docked' && (
                <motion.div layout="position" className="dashboard-status-bar">
                    <div className="flex items-center gap-4">
                        <div className="status-alert">
                            <span className="status-alert-dot"></span>
                            <span>{isScanning ? (t('dash_scan_running') || "RUNNING DIAGNOSTICS...") : (t('dash_alerts') || "ALERTS: 0")}</span>
                        </div>
                        <span>{t('dash_sys_int') || "SYS_INTEGRITY: 100%"}</span>
                    </div>
                    <LiveClock />
                </motion.div>
            )}
        </motion.div>
    );

    return (
        <div ref={constraintsRef} className="dashboard-container">
            <AnimatePresence>
                {windowState === 'closed' ? (
                    <motion.button
                        layoutId="dashboard-window"
                        key="relaunch-icon"
                        onClick={(e) => handleAction(e, 'open')}
                        className="dashboard-relaunch-icon"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        aria-label="Launch Skill Analysis"
                    >
                        <AppWindow size={32} />
                        <span>{t('dash_launch_skill') || 'Skill Analysis'}</span>
                    </motion.button>
                ) : (
                    <motion.div
                        layoutId="dashboard-window"
                        key="dashboard-window"
                        drag={!isScanning}
                        dragConstraints={constraintsRef}
                        dragMomentum={false}
                        dragElastic={0.05}
                        className={`dashboard-window bg-gray-100 dark:bg-dark-card ${windowState !== 'docked' ? 'glitch-in' : ''}`}
                        animate={{
                            width: windowState === 'maximized' ? '100%' : 'min(100%, 600px)',
                            height: windowState === 'maximized' ? '100%' : windowState === 'docked' ? 'auto' : 480,
                            x: windowState === 'docked' ? 0 : undefined,
                            y: windowState === 'docked' ? (constraintsRef.current?.offsetHeight ?? 0) / 2 - 22 : undefined,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 40,
                            mass: 1
                        }}
                    >
                        {windowContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CyberSecDashboard;
