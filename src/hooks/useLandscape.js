import { useState, useEffect } from 'react';

// Check if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768 && window.matchMedia('(max-width: 768px)').matches);
};

export const useLandscape = () => {
  const [isLandscape, setIsLandscape] = useState(() => {
    // Initial check
    if (typeof window === 'undefined') return true;
    // If desktop, always return true (no landscape requirement)
    if (!isMobileDevice()) return true;
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    const checkOrientation = () => {
      // If desktop, always return true (no landscape requirement)
      if (!isMobileDevice()) {
        setIsLandscape(true);
        return;
      }
      
      let isCurrentlyLandscape = false;
      
      // Method 1: Check screen orientation API (most reliable)
      if (window.screen && window.screen.orientation) {
        const angle = window.screen.orientation.angle;
        isCurrentlyLandscape = angle === 90 || angle === -90 || angle === 270;
      }
      // Method 2: Check window dimensions (fallback)
      else if (window.innerWidth > window.innerHeight) {
        isCurrentlyLandscape = true;
      }
      // Method 3: Check orientation media query (if supported)
      else if (window.matchMedia) {
        isCurrentlyLandscape = window.matchMedia('(orientation: landscape)').matches;
      }
      
      setIsLandscape(isCurrentlyLandscape);
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes
    const handleResize = () => {
      // Use a small delay to ensure accurate dimensions after rotation
      setTimeout(checkOrientation, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Also listen to screen orientation API if available
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    // Check orientation media query if available
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(orientation: landscape)');
      const handleMediaChange = (e) => {
        setIsLandscape(e.matches);
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleMediaChange);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, []);

  return isLandscape;
};

