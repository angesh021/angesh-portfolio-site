import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import CRTEffect from './CRTEffect';
import MatrixBackground from './MatrixBackground';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'rectangular', 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'overflow-hidden relative bg-light-bg-alt/80 dark:bg-dark-card/40 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'rectangular' && 'rounded-lg w-full h-full',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 dark:via-primary/10 to-transparent animate-shimmer" />
    </div>
  );
};

export const SkeletonTextRow: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={cn(
            "h-4", 
            i === lines - 1 ? "w-2/3" : (i % 2 === 0 ? "w-full" : "w-11/12")
          )} 
        />
      ))}
    </div>
  );
};

export const SkeletonNav: React.FC = () => {
  // Match the widths of the real items on medium screens+
  const itemWidthClasses = [
    'w-10 md:w-24', // Home
    'w-10 md:w-24', // About
    'w-10 md:w-32', // Experience
    'w-10 md:w-28', // Projects
    'w-10 md:w-30', // Education
    'w-10 md:w-28', // Contact
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full flex items-start justify-center p-4">
      <div className="relative w-full max-w-7xl h-10 grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left brand logo placeholder */}
        <div className="col-start-1 justify-self-start flex items-center h-full pl-0 md:pl-2">
          <Skeleton variant="rectangular" className="h-8 w-24 sm:w-32 rounded-lg" />
        </div>

        {/* Centered Navigation */}
        <nav className="pointer-events-auto col-start-2">
          <div className="relative flex items-center gap-1 px-2 py-2 rounded-full aetherius-bar">
            {itemWidthClasses.map((widthClass, i) => (
              <Skeleton 
                key={i} 
                variant="rectangular" 
                className={`${widthClass} h-10 rounded-full`} 
              />
            ))}
            {/* Separator line */}
            <div className="w-px h-5 bg-gray-500/30 dark:bg-dark-text-secondary/30 mx-1 align-self-center my-auto" />
            {/* Settings button */}
            <Skeleton variant="circular" className="w-10 h-10" />
          </div>
        </nav>

        {/* Resume Downloader placeholder */}
        <div className="col-start-3 justify-self-end lg:pr-4">
          <Skeleton variant="rectangular" className="h-10 w-28 sm:w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonHero: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-32 lg:pb-40 w-full">
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-16 w-full items-start">
          
          {/* Right Column - Profile Image Placeholder (same dims and sequence as real element) */}
          <div className="relative z-0 md:col-span-2 flex flex-col items-center justify-start md:order-last">
              <div className="relative w-[340px] h-[380px] md:w-[420px] md:h-[480px] lg:w-[480px] lg:h-[550px] flex items-center justify-center">
                  <Skeleton className="absolute w-full h-full hex-clip opacity-50" />
                  <Skeleton className="absolute w-[80%] h-[80%] hex-clip" />
              </div>
              <div className="flex gap-6 mt-10">
                  <Skeleton variant="circular" className="h-10 w-10" />
                  <Skeleton variant="circular" className="h-10 w-10" />
                  <Skeleton variant="circular" className="h-10 w-10" />
              </div>
          </div>
  
          {/* Left Column - Text content */}
          <div className="relative z-10 md:col-span-3 text-center md:text-left md:order-first">
              <Skeleton className="h-6 w-32 mb-6" variant="text" />
              <Skeleton className="h-12 sm:h-16 w-3/4 mb-4" variant="text" />
              <Skeleton className="h-10 sm:h-14 w-full md:w-5/6 mb-10" variant="text" />
              
              <div className="flex items-center gap-3 mb-8 w-full justify-center md:justify-start">
                 <Skeleton className="h-8 w-8 rounded-full" />
                 <Skeleton className="h-4 w-40" />
              </div>
  
              <SkeletonTextRow lines={3} className="w-full max-w-xl mb-12" />
  
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
          </div>
  
      </div>
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="min-h-screen bg-dark-bg p-8 w-full">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Header equivalent */}
      <div className="col-span-full h-16 w-full flex justify-between items-center bg-dark-card rounded-xl p-4">
         <Skeleton className="h-8 w-48" />
         <Skeleton className="h-8 w-24" />
      </div>
      {/* Stats row */}
      <Skeleton className="h-32 col-span-1 rounded-2xl" />
      <Skeleton className="h-32 col-span-1 rounded-2xl" />
      <Skeleton className="h-32 col-span-1 rounded-2xl" />
      <Skeleton className="h-32 col-span-1 rounded-2xl" />
      
      {/* Main content area */}
      <Skeleton className="h-96 col-span-2 rounded-2xl" />
      <Skeleton className="h-96 col-span-2 rounded-2xl" />
    </div>
  </div>
);

export const SkeletonScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-light-bg dark:bg-dark-bg w-full relative overflow-y-scroll flex flex-col"
    >
      <MatrixBackground />
      <CRTEffect />
      <SkeletonNav />
      {/* Overlay to fade bottom out similar to the real app */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-light-bg dark:from-dark-bg to-transparent pointer-events-none z-20" />
      <SkeletonHero />
    </motion.div>
  );
};
