import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 2 * 60 * 1000; // 2 minutes before timeout

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeoutRef = useRef<number>();
  const warningRef = useRef<number>();
  const intervalRef = useRef<number>();
  const logout = useAuthStore((state) => state.logout);

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setShowWarning(false);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(WARNING_DURATION);

      // Update countdown every second
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, TIMEOUT_DURATION - WARNING_DURATION);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
      setShowWarning(false);
    }, TIMEOUT_DURATION);
  };

  const extendSession = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [showWarning]);

  return {
    showWarning,
    timeRemaining: Math.ceil(timeRemaining / 1000), // Convert to seconds
    extendSession,
  };
}
