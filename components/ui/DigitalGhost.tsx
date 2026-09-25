import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ghost {
  id: number;
  x: number;
  y: number;
}

/**
 * A component that creates a "ghosting" trail of text following the mouse cursor.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped.
 * @param {string} props.ghostText - The text to display in the ghost trail.
 * @returns {JSX.Element} A container with the ghosting effect.
 */
const DigitalGhost: React.FC<{ children: React.ReactNode, ghostText: string }> = ({ children, ghostText }) => {
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const lastGhostTime = useRef(0);
  const timeoutIds = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    // Throttle ghost creation to optimize performance
    if (now - lastGhostTime.current < 75) {
      return;
    }
    lastGhostTime.current = now;

    const newGhost: Ghost = {
      id: now,
      x: e.clientX,
      y: e.clientY,
    };

    setGhosts(prev => [...prev, newGhost]);

    // Schedule the removal of the ghost to trigger the exit animation
    const timeoutId = setTimeout(() => {
      setGhosts(prev => prev.filter(g => g.id !== newGhost.id));
      timeoutIds.current.delete(newGhost.id);
    }, 1000); // Lifespan of each ghost element
    timeoutIds.current.set(newGhost.id, timeoutId);
  }, [ghostText]);

  // Cleanup any pending timeouts when the component unmounts
  useEffect(() => {
    const tm = timeoutIds.current;
    return () => {
      tm.forEach(id => clearTimeout(id));
    };
  }, []);

  return (
    <div onMouseMove={handleMouseMove} className="relative">
      {children}
      <AnimatePresence>
        {ghosts.map(ghost => (
          <motion.span
            key={ghost.id}
            className="digital-ghost"
            initial={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{
              position: 'fixed',
              top: ghost.y,
              left: ghost.x,
              transform: 'translate(-50%, -50%)',
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            aria-hidden="true"
          >
            {ghostText}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DigitalGhost;