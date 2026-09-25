import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info, Sparkles } from 'lucide-react';

export const MetricExplainer: React.FC<{ 
  title: string; 
  description: string; 
  formula?: string;
  nominalRange?: string;
}> = ({ title, description, formula, nominalRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, align: 'center', position: 'top' });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let pos = 'top';
      let align = 'center';
      
      if (rect.top < 180) {
        pos = 'bottom';
      }
      if (rect.left < 140) {
        align = 'left';
      } else if (rect.right > window.innerWidth - 140) {
        align = 'right';
      }

      setCoords({
        x: rect.left + (rect.width / 2),
        y: pos === 'top' ? rect.top - 8 : rect.bottom + 8,
        align,
        position: pos
      });
    }
  }, []);

  const handleEnter = () => {
    calculatePosition();
    setIsOpen(true);
  };
  
  const handleLeave = () => {
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => calculatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
     const clickOutside = (e: MouseEvent | TouchEvent) => {
       if (isOpen && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
         setIsOpen(false);
       }
     };
     document.addEventListener('mousedown', clickOutside);
     document.addEventListener('touchstart', clickOutside);
     return () => {
       document.removeEventListener('mousedown', clickOutside);
       document.removeEventListener('touchstart', clickOutside);
     };
  }, [isOpen]);

  let transform = 'translateX(-50%)';
  let arrowLeft = '50%';
  if (coords.align === 'left') { transform = 'translateX(-20px)'; arrowLeft = '20px'; }
  if (coords.align === 'right') { transform = 'translateX(calc(-100% + 20px))'; arrowLeft = 'calc(100% - 20px)'; }

  return (
    <>
      <span 
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleToggle}
        suppressHydrationWarning
        className="cursor-help text-[#8B929A] hover:text-[#26F0C4] transition-colors p-[3px] inline-flex items-center justify-center bg-[#1F2225]/30 rounded-full hover:bg-[#26F0C4]/10 ml-1.5 align-middle select-none relative"
      >
        <Info size={12} className="opacity-75 hover:opacity-100" />
      </span>

      {mounted && isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[99999] w-64 p-4 bg-[#111315]/95 backdrop-blur-xl border border-[#26F0C4]/40 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.9)] text-left flex flex-col pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
          style={{
            left: coords.x,
            top: coords.position === 'top' ? 'auto' : coords.y,
            bottom: coords.position === 'top' ? window.innerHeight - coords.y : 'auto',
            transform,
          }}
        >
          <div className={`absolute left-0 w-3 h-3 bg-[#111315] border-[#26F0C4]/40 rotate-45 
            ${coords.position === 'top' ? 'bottom-[-7px] border-b border-r' : 'top-[-7px] border-t border-l'}
          `} 
          style={{ left: arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }}
          />

          <h4 className="text-[11px] font-black text-[#E5E7EB] border-b border-[#26F0C4]/20 pb-1.5 mb-2.5 font-mono tracking-wide uppercase flex items-center gap-1.5 relative z-10">
            <Sparkles size={11} className="text-[#26F0C4]" />
            {title}
          </h4>
          <p className="text-[10.5px] text-[#8B929A] leading-relaxed font-sans relative z-10">{description}</p>
          {formula && (
            <div className="mt-3 bg-[#0A0C0E] p-2 rounded-lg border border-[#1F2225] font-mono text-[9px] relative z-10">
              <span className="text-blue-400 block font-bold mb-1 uppercase tracking-widest text-[8.5px]">Formula:</span>
              <span className="text-[#E5E7EB] block break-words leading-relaxed font-medium">{formula}</span>
            </div>
          )}
          {nominalRange && (
            <div className="mt-2.5 flex justify-between items-center text-[10px] font-mono border-t border-[#1F2225]/30 pt-2 relative z-10">
              <span className="text-[#8B929A]">NOMINAL RANGE:</span>
              <span className="text-[#26F0C4] font-black">{nominalRange}</span>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
export default MetricExplainer;
