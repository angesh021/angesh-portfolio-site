import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to determine which section is most prominent in the viewport.
 * It uses the Intersection Observer API to efficiently track which section
 * currently occupies the most screen space.
 *
 * @param {string[]} sectionIds - An array of the DOM element IDs for each section.
 * @param {IntersectionObserverInit} [options] - Optional custom Intersection Observer options.
 * @returns {string} The ID of the currently active section.
 */
export const useActiveSection = (sectionIds: string[], options?: IntersectionObserverInit): string => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const observer = useRef<IntersectionObserver | null>(null);
  // A map to store the intersection entries for all observed elements.
  const observedElements = useRef(new Map<Element, IntersectionObserverEntry>());

  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
      // Update the map with the latest intersection data for each element
      entries.forEach(entry => {
        observedElements.current.set(entry.target, entry);
      });

      let mostVisibleSectionId = '';
      let maxIntersectingHeight = -1;

      // Find the intersecting element with the highest visible height in the viewport
      observedElements.current.forEach((entry, element) => {
        if (entry.isIntersecting) {
          const intersectingHeight = entry.intersectionRect.height;
          if (intersectingHeight > maxIntersectingHeight) {
            maxIntersectingHeight = intersectingHeight;
            mostVisibleSectionId = element.id;
          }
        }
      });

      // If a section is most visible, update the active section state.
      // This prevents the active section from clearing when scrolling between sections.
      if (mostVisibleSectionId) {
        setActiveSection(mostVisibleSectionId);
      }
    };

    // Default options: rootMargin excludes the top 10% (header) and bottom 15% of the viewport.
    // Multiple thresholds provide frequent, smooth updates during scroll.
    const observerOptions = options || {
      rootMargin: `-10% 0px -15% 0px`,
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    };

    observer.current = new IntersectionObserver(observerCallback, observerOptions);
    const { current: currentObserver } = observer;

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        currentObserver.observe(element);
      }
    });

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
      observedElements.current.clear();
    };
    // Dependency array uses JSON.stringify to ensure it reruns if the array content changes.
  }, [JSON.stringify(sectionIds), options]);

  // An additional effect to ensure the 'hero' section is active when scrolled to the top.
  // This provides a reliable override for the topmost position.
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight / 2) {
        setActiveSection('hero');
      }
    };
    // Set initial state on mount as well
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return activeSection;
};