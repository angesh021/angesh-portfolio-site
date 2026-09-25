import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook that creates a "scrambling" text effect.
 * It iteratively reveals a target text from a series of random characters.
 *
 * @param {string} text - The final text to reveal.
 * @param {number} [duration=800] - The total duration of the scramble effect in milliseconds.
 * @param {boolean} [startOnMount=true] - Whether to start the animation on component mount.
 * @returns {[React.RefObject<any>, () => void]} A tuple containing the ref to attach to the element and a function to trigger the animation.
 */
export const useTextScramble = (text: string, duration: number = 800, startOnMount: boolean = true) => {
  const ref = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // FIX: Use `number | undefined` for refs that are initialized without a value.
  const frameRequest = useRef<number | undefined>(undefined);
  const animationStartTime = useRef<number | undefined>(undefined);

  const chars = '!<>-_\\/[]{}—=+*^?#________';

  const animate = (time: number) => {
    // FIX: Use a strict check for undefined to prevent issues if time is 0.
    if (animationStartTime.current === undefined) {
      animationStartTime.current = time;
    }
    const elapsedTime = time - animationStartTime.current;
    const progress = Math.min(elapsedTime / duration, 1);

    if (ref.current) {
      const newText = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          const revealPosition = Math.floor(progress * text.length);
          if (index < revealPosition) {
            return text[index];
          }
          const randomChar = chars[Math.floor(Math.random() * chars.length)];
          return randomChar;
        })
        .join('');
      ref.current.textContent = newText;
    }

    if (progress < 1) {
      frameRequest.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
    }
  };

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    animationStartTime.current = undefined;
    frameRequest.current = requestAnimationFrame(animate);
  }, [isAnimating, text, duration]);
  
  useEffect(() => {
    if (startOnMount) {
      startAnimation();
    }
    return () => {
      if (frameRequest.current) {
        cancelAnimationFrame(frameRequest.current);
      }
    };
  }, [startOnMount, startAnimation]);

  return [ref, startAnimation];
};
