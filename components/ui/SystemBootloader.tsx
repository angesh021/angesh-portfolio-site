import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useI18n } from '../../hooks/useI18n';
import { getContent } from '../../lib/contentService';

// --- Types ---
type LineStatus = 'info' | 'ok' | 'warn' | 'fail' | 'pending' | 'progress' | 'art' | 'prompt';
interface BootLine {
  id: number;
  text: string;
  status: LineStatus;
  progress?: number;
  timestamp?: string;
  noPrefix?: boolean;
}

// --- Helper Components ---
const Spinner: React.FC = () => {
    const chars = useMemo(() => ['/', '-', '\\', '|'], []);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(prev => (prev + 1) % chars.length);
        }, 150);
        return () => clearInterval(interval);
    }, [chars.length]);

    return <span>{chars[frame]}</span>;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    const barWidth = 20;
    const filledWidth = Math.round((progress / 100) * barWidth);
    const bar = `[${'█'.repeat(filledWidth)}${'-'.repeat(barWidth - filledWidth)}]`;
    return <span>{bar}</span>;
};

const BootLineDisplay: React.FC<{ line: BootLine }> = ({ line }) => {
    let prefixContent;
    switch (line.status) {
        case 'ok': prefixContent = <span className="status-ok">[ OK ]</span>; break;
        case 'warn': prefixContent = <span className="status-warn">[WARN]</span>; break;
        case 'fail': prefixContent = <span className="status-fail">[FAIL]</span>; break;
        case 'pending': prefixContent = <span className="status-pending">[....]</span>; break;
        case 'info': prefixContent = line.timestamp ? <span className="bootloader-prefix">{line.timestamp}</span> : null; break;
        default: prefixContent = null;
    }

    return (
        <div className={`bootloader-line ${line.status}`}>
            {!line.noPrefix && <span className="bootloader-prefix-wrapper">{prefixContent}</span>}
            <span className="bootloader-text">
                {line.status === 'progress' && <ProgressBar progress={line.progress ?? 0} />}
                {line.text}
            </span>
        </div>
    );
};

// --- Main Bootloader Component ---
const SystemBootloader: React.FC<{ onBootComplete: () => void }> = ({ onBootComplete }) => {
    const { language, t } = useI18n();
    const personalData = useMemo(() => getContent('personal', language) || {}, [language]);
    const changelogData = personalData.changelogData || [{ version: '1.0.0' }];
    const osVersion = `v${changelogData[0]?.version || '1.0.0'}`;

    const [lines, setLines] = useState<BootLine[]>([]);
    const [phase, setPhase] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [typedCommand, setTypedCommand] = useState('');

    const timers = useRef<Set<any>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const lineIdCounter = useRef(0);
    const startTimeRef = useRef(Date.now());

    const onBootCompleteRef = useRef(onBootComplete);
    useEffect(() => {
        onBootCompleteRef.current = onBootComplete;
    }, [onBootComplete]);

    const addTimer = (timer: any) => timers.current.add(timer);
    const clearAllTimers = useCallback(() => {
        timers.current.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        timers.current.clear();
    }, []);

    const getTimeStamp = () => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        return `[${elapsed.toFixed(6).padStart(10, ' ')}]`;
    };

    const addLine = useCallback((text: string, status: LineStatus, options: Partial<Omit<BootLine, 'id' | 'text' | 'status'>> = {}): number => {
        const id = lineIdCounter.current++;
        const timestamp = options.timestamp ?? (status === 'info' ? getTimeStamp() : undefined);
        setLines(prev => [...prev, { id, text, status, timestamp, ...options }]);
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        return id;
    }, []);

    const updateLine = useCallback((id: number, newProps: Partial<BootLine>) => {
        setLines(prev => prev.map(line => line.id === id ? { ...line, ...newProps } : line));
    }, []);

    const finishBoot = useCallback(() => {
        clearAllTimers();
        setIsFadingOut(true);
        addTimer(setTimeout(() => {
            onBootCompleteRef.current();
        }, 500));
    }, [clearAllTimers]);

    useEffect(() => {
        if (prefersReducedMotion) {
            onBootCompleteRef.current();
            return;
        }
        startTimeRef.current = Date.now();

        return () => {
            clearAllTimers();
        };
    }, [prefersReducedMotion, clearAllTimers]);

    useEffect(() => {
        if (prefersReducedMotion || isFadingOut) return;
        
        const runPhase = async () => {
            if (phase === 0) { // POST Phase
                addLine(`Aetherius BIOS ${osVersion}`, 'info', { timestamp: '[ SYSTEM ]' });
                await new Promise(r => addTimer(setTimeout(r, 200)));
                addLine(`Copyright (C) 2025, Angesh Chanderdip Inc.`, 'info', { timestamp: '[ SYSTEM ]' });
                await new Promise(r => addTimer(setTimeout(r, 500)));
                addLine(``, 'info');
                
                const memLineId = addLine('Memory Test: ', 'progress', { progress: 0 });
                let memProgress = 0;
                await new Promise<void>(resolve => {
                    const interval = setInterval(() => {
                        memProgress += 4;
                        if (memProgress <= 100) {
                            updateLine(memLineId, { progress: memProgress, text: `Memory Test: 16384MB OK` });
                        } else {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 20);
                    timers.current.add(interval);
                });
                
                await new Promise(r => addTimer(setTimeout(r, 300)));
                const checks = [
                    'CPU: Quantum Core Q-v1 @ 4.2GHz',
                    'NVMe_0: SYS_DRIVE_512GB (AetheriusFS)',
                    'GPU: VRTX-4090-GL (Holographic Renderer)',
                    'NIC: ETH-SECURE-ADAPT-v2',
                    'TPM: v2.0 Security Module',
                ];
                for (const check of checks) {
                    const lineId = addLine(`${check}...`, 'pending');
                    await new Promise(r => addTimer(setTimeout(r, 150)));
                    updateLine(lineId, { status: 'ok', text: `${check}` });
                }
                await new Promise(r => addTimer(setTimeout(r, 500)));
                addLine(`All systems nominal. Handing over to bootloader...`, 'info', { timestamp: '[ BIOS ]' });
                await new Promise(r => addTimer(setTimeout(r, 800)));
                setPhase(1);
            } 
            else if (phase === 1) { // Kernel Load
                setLines([]);
                await new Promise(r => addTimer(setTimeout(r, 200)));
                
                addLine(`Loading Aetherius Kernel ${osVersion}...`, 'info');
                await new Promise(r => addTimer(setTimeout(r, 400)));
                
                const kernelArt = [
                    "      ___      ",
                    "     /   \\     ",
                    "    /  ^  \\    ",
                    "   /  /_\\  \\   ",
                    "  /  _____  \\  ",
                    " /__/     \\__\\ ",
                ];
                for(const artLine of kernelArt) {
                    addLine(artLine, 'art', { noPrefix: true });
                    await new Promise(r => addTimer(setTimeout(r, 50)));
                }
                
                await new Promise(r => addTimer(setTimeout(r, 400)));
                const kernelLines = [
                    'Kernel decompression complete.',
                    'Initializing security subsystem... [ENCRYPTED]',
                    'Mounting root filesystem (AetheriusFS) in read-only mode.',
                    'Calibrating holographic display driver...',
                    'Initializing I/O scheduler...'
                ];
                for (const line of kernelLines) {
                    addLine(line, 'ok');
                    await new Promise(r => addTimer(setTimeout(r, 100)));
                }
                await new Promise(r => addTimer(setTimeout(r, 800)));
                setPhase(2);
            } 
            else if (phase === 2) { // Service Loading
                setLines([]);
                await new Promise(r => addTimer(setTimeout(r, 200)));

                const netId = addLine('Starting Network Daemon', 'pending');
                await new Promise(r => addTimer(setTimeout(r, 400)));
                updateLine(netId, { text: 'Starting Network Daemon', status: 'fail' });

                await new Promise(r => addTimer(setTimeout(r, 200)));
                addLine('Network configuration invalid. Attempting fallback...', 'warn');
                await new Promise(r => addTimer(setTimeout(r, 500)));
                
                const reconfigId = addLine('Reconfiguring network interface (eth0)', 'pending');
                await new Promise(r => addTimer(setTimeout(r, 600)));
                updateLine(reconfigId, { text: 'Reconfiguring network interface (eth0)', status: 'ok' });
                
                await new Promise(r => addTimer(setTimeout(r, 200)));
                const netRetryId = addLine('Restarting Network Daemon', 'pending');
                await new Promise(r => addTimer(setTimeout(r, 400)));
                updateLine(netRetryId, { text: 'Started Network Daemon (eth0)', status: 'ok' });

                const services = [
                    'Loading UI Compositor (AetheriusGUI)',
                    'Initializing Firewall (Project Chimera)',
                    'Checking User Session'
                ];
                for (const service of services) {
                    const lineId = addLine(service, 'pending');
                    await new Promise(r => addTimer(setTimeout(r, Math.random() * 300 + 200)));
                    updateLine(lineId, { text: service, status: 'ok' });
                }
                
                await new Promise(r => addTimer(setTimeout(r, 300)));
                addLine('No previous user session found. Initializing fresh environment.', 'warn');
                await new Promise(r => addTimer(setTimeout(r, 1200)));
                setPhase(3);
            }
            else if (phase === 3) { // Finalization
                setLines([]);
                await new Promise(r => addTimer(setTimeout(r, 200)));
                addLine(`Welcome to Aetherius OS ${osVersion}`, 'info', { noPrefix: true });
                await new Promise(r => addTimer(setTimeout(r, 500)));
                addLine(`UI environment ready. Launching session...`, 'info', { noPrefix: true });
                await new Promise(r => addTimer(setTimeout(r, 1000)));

                const command = 'startx --session=aetherius-ui';
                let i = 0;
                const typingInterval = setInterval(() => {
                    setTypedCommand(command.slice(0, i + 1));
                    i++;
                    if (i >= command.length) {
                        clearInterval(typingInterval);
                        addTimer(setTimeout(finishBoot, 1000));
                    }
                }, 80);
                addTimer(typingInterval);
            }
        };

        runPhase();

    }, [phase, isFadingOut, prefersReducedMotion, addLine, updateLine, finishBoot]);

    const finalPrompt = (
        <div className="bootloader-line prompt">
            <span className="bootloader-prefix-wrapper">
                <span className="status-ok">root</span>
                <span style={{color: '#ccd6f6'}}>@aetherius</span>
                <span style={{color: '#ccd6f6'}}>:~#</span>
            </span>
            <span className="bootloader-text">
                {typedCommand}
                <span className="bootloader-cursor" />
            </span>
        </div>
    );

    return (
        <div
            className={`bootloader-container ${isFadingOut ? 'fade-out' : ''}`}
            aria-live="assertive"
            aria-busy="true"
        >
            <div ref={containerRef} className="bootloader-content">
                {lines.map(line => <BootLineDisplay key={line.id} line={line} />)}
                {phase === 3 && typedCommand && finalPrompt}
            </div>
            
            <div className="crt-lines" />
        </div>
    );
};

export default SystemBootloader;
