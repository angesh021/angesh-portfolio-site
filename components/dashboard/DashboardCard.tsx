import React, { useRef } from 'react';
// FIX: Import AnimatePresence from framer-motion to resolve 'Cannot find name' errors.
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Maximize2 } from 'lucide-react';

interface DashboardCardProps {
    id: string;
    title?: string;
    children: React.ReactNode;
    onFocusClick: (id: string) => void;
    className?: string;
    pulse: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ id, title, children, onFocusClick, className = '', pulse }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <Reorder.Item
            // FIX: Use as="div" to ensure the component renders a div, matching the ref and event handler types.
            as="div"
            ref={cardRef}
            value={id}
            id={id}
            className={`dash-card ${className}`}
            onMouseMove={handleMouseMove}
            dragListener={false} // We will use a drag handle if needed, or let the whole card be draggable
        >
            <AnimatePresence>
            {pulse && (
                <motion.div
                    className="data-pulse-effect"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: [0.7, 1, 0], scale: 1.05 }}
                    transition={{ duration: 0.7, ease: "circOut" }}
                />
            )}
            </AnimatePresence>
            <div className="card-controls">
                <button onClick={() => onFocusClick(id)} className="card-expand-btn ripple-btn" aria-label={`Focus on ${title}`}>
                    <Maximize2 size={14} />
                </button>
            </div>
            {title && (
                <div className="dash-card-header">
                    <h2 className="dash-card-title">{title}</h2>
                </div>
            )}
            {children}
        </Reorder.Item>
    );
};

export default DashboardCard;