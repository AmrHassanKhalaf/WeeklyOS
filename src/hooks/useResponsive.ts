import { useState, useEffect } from 'react';

// Breakpoints: mobile < 768px, tablet 768-1024px, desktop > 1024px
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: number;

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // Call once initially to ensure correct state
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    width: windowWidth,
    isMobile: windowWidth < MOBILE_BREAKPOINT,
    isTablet: windowWidth >= MOBILE_BREAKPOINT && windowWidth <= TABLET_BREAKPOINT,
    isDesktop: windowWidth > TABLET_BREAKPOINT,
  };
}
