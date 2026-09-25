import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface DecompilingTextProps {
  linesConfig: { text: string; className: string }[];
  onComplete: () => void;
}

const hexChars = '0123456789ABCDEF!@#$%&*()_+-=[]{}|;:,.<>?';

const CHARS_PER_STEP = 3; // Speeds up the rendering by revealing 3 characters per frame
const LINE_COMPLETION_DELAY = 100; // Snappy delay between lines (ms)
const ANIMATION_START_DELAY = 150; // Snappy delay before starting (ms)

const DecompilingText: React.FC<DecompilingTextProps> = ({ linesConfig, onComplete }) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [revealedChars, setRevealedChars] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timeoutIds = useRef<number[]>([]);
  const frameRequest = useRef<number | undefined>(undefined);
  
  // Keep unstable or changing props inside refs to avoid resetting our effect or triggering loops
  const linesConfigRef = useRef(linesConfig);
  linesConfigRef.current = linesConfig;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Scramble noise generator for letters that are still decrypting
  const getScrambledNoise = (length: number) => {
    let output = '';
    for (let i = 0; i < length; i++) {
      output += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return output;
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsCompleted(true);
      onCompleteRef.current();
      return;
    }

    let currentLine = 0;
    let currentCharCount = 0;

    const animate = () => {
      const targetText = linesConfigRef.current[currentLine]?.text || '';
      
      if (currentCharCount >= targetText.length) {
        // Move to next line
        if (currentLine < linesConfigRef.current.length - 1) {
          currentLine++;
          currentCharCount = 0;
          setActiveLineIdx(currentLine);
          setRevealedChars(0);
          
          const timeout = window.setTimeout(() => {
            frameRequest.current = requestAnimationFrame(animate);
          }, LINE_COMPLETION_DELAY);
          timeoutIds.current.push(timeout);
        } else {
          // Fully complete
          setIsCompleted(true);
          onCompleteRef.current();
        }
        return;
      }

      // Increment char count
      currentCharCount = Math.min(targetText.length, currentCharCount + CHARS_PER_STEP);
      setRevealedChars(currentCharCount);
      frameRequest.current = requestAnimationFrame(animate);
    };

    // Kick off animation
    const startTimeout = window.setTimeout(() => {
      frameRequest.current = requestAnimationFrame(animate);
    }, ANIMATION_START_DELAY);
    timeoutIds.current.push(startTimeout);

    return () => {
      if (frameRequest.current) {
        cancelAnimationFrame(frameRequest.current);
      }
      timeoutIds.current.forEach(clearTimeout);
    };
  }, [prefersReducedMotion]); // Controlled strictly by prefersReducedMotion, never by changing object/array references

  return (
    <div 
      className="relative select-none decompiling-text-container"
    >

      {linesConfig.map((config, index) => {
        const text = config.text;
        // Determine highly semantic HTML tags based on position for SEO hierarchy
        const Tag = index === 1 ? 'h1' as const : (index === 2 ? 'h2' as const : (index === 0 ? 'p' as const : 'div' as const));

        // Line is fully decrypted/completed
        if (isCompleted || index < activeLineIdx) {
          return (
            <Tag key={index} className={config.className} aria-live="polite">
              {text}
            </Tag>
          );
        }

        // Line hasn't started yet
        if (index > activeLineIdx) {
          return (
            <Tag key={index} className={`${config.className} invisible select-none pointer-events-none`} aria-hidden="true">
              {text}
            </Tag>
          );
        }

        // Line is currently decrypting/active
        const decrypted = text.slice(0, revealedChars);
        const remaining = text.slice(revealedChars);

        // Scramble remaining characters while preserving space/newline layout structure for perfect wrap stability
        const scrambledRemaining = remaining
          .split('')
          .map(char => {
            if (char === ' ' || char === '\u00A0' || char === '\n' || char === '\r') {
              return char;
            }
            return hexChars[Math.floor(Math.random() * hexChars.length)];
          })
          .join('');

        const isMono = config.className.includes('font-mono');

        return (
          <Tag key={index} className={config.className} aria-live="polite">
            <span>{decrypted}</span>
            {scrambledRemaining.length > 0 && (
              <span className={`text-primary select-none drop-shadow-[0_0_6px_rgba(100,255,218,0.7)] font-bold animate-pulse ${isMono ? 'font-mono' : ''}`}>
                {scrambledRemaining}
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
};

export default DecompilingText;
