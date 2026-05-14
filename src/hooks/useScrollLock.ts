import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Save original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';

    // Cleanup on unmount or when unlocked
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}
