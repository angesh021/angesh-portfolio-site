import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to create a typing animation effect.
 *
 * @param {() => void} [onComplete] - Optional callback to run when typing is finished.
 * @param {number} [speed=30] - The delay between characters in milliseconds.
 * @returns {{ typedText: string; startTyping: (text: string) => void; isTyping: boolean; }}
 */
export const useTypingAnimation = (
  onComplete?: () => void,
  speed: number = 30
) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const startTyping = useCallback((text: string) => {
    cleanup();
    setTypedText('');
    setIsTyping(true);

    let i = 0;
    const type = () => {
      if (i < text.length) {
        setTypedText(prev => text.substring(0, i + 1));
        i++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };
    timeoutRef.current = setTimeout(type, 20);
  }, [speed, onComplete, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { typedText, startTyping, isTyping };
};
