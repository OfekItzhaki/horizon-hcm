import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<number>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}
