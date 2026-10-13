import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Hash, Power, Palette, X } from 'lucide-react';

export interface Command {
    id: string;
    type: 'action' | 'project';
    title: string;
    icon: React.ReactNode;
    action: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCommands = searchTerm
        ? commands.filter(cmd => cmd.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : commands;

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedCommand = filteredCommands[selectedIndex];
                if (selectedCommand) {
                    selectedCommand.action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="command-palette-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="command-palette"
                        initial={{ y: -50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="cp-input-wrapper">
                            <Search size={20} className="text-[var(--dash-text-secondary)]" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a command or search..."
                                className="cp-input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button onClick={onClose} className="text-[var(--dash-text-secondary)]"><X size={20}/></button>
                        </div>
                        <div className="cp-results">
                            {filteredCommands.length > 0 ? (
                                filteredCommands.map((cmd, index) => (
                                    <div
                                        key={cmd.id}
                                        className={`cp-item ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => { cmd.action(); onClose(); }}
                                        onMouseMove={() => setSelectedIndex(index)}
                                    >
                                        <div className="cp-item-details">
                                            {cmd.icon}
                                            <span>{cmd.title}</span>
                                        </div>
                                        <span className="cp-item-type">{cmd.type}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-[var(--dash-text-secondary)]">No results found.</div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
