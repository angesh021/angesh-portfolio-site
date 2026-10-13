import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TypingPlaceholderProps {
  phrases: string[];
  isTextarea?: boolean;
}

const TypingPlaceholder: React.FC<TypingPlaceholderProps> = ({ phrases, isTextarea = false }) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const typingSpeed = 120;
  const deletingSpeed = 60;
  const pauseDuration = 2000;

  useEffect(() => {
    if (prefersReducedMotion) {
      setText(phrases[0]);
      return;
    }

    const handleType = () => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];
      const updatedText = isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1);

      setText(updatedText);

      if (!isDeleting && updatedText === fullText) {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && updatedText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      } else {
        timeoutRef.current = setTimeout(handleType, isDeleting ? deletingSpeed : typingSpeed);
      }
    };

    timeoutRef.current = setTimeout(handleType, typingSpeed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isDeleting, loopNum, phrases, prefersReducedMotion]);
  
  const placeholderClass = `macos-animated-placeholder ${isTextarea ? '!top-3 !transform-none' : ''}`;

  return (
    <div className={placeholderClass} aria-hidden="true">
      {text}
      <span className="typing-cursor" />
    </div>
  );
};

export default TypingPlaceholder;