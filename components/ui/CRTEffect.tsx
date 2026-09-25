import React from 'react';

/**
 * A component that creates a visual overlay simulating a CRT screen effect.
 * It adds scanlines and a subtle flicker to enhance the retro-tech theme.
 * This should be placed at a high level in the component tree to cover the entire viewport.
 * The required CSS keyframes are injected by the MatrixBackground component.
 *
 * @returns {JSX.Element} A div element that serves as the CRT overlay.
 */
const CRTEffect: React.FC = () => {
  return (
    <>
      <div 
        className="crt-lines pointer-events-none fixed top-0 left-0 w-full h-full z-[100]" 
        aria-hidden="true"
      />
      <div 
        className="crt-glow pointer-events-none fixed top-0 left-0 w-full h-full z-[99]" 
        aria-hidden="true"
      />
    </>
  );
};

export default CRTEffect;
