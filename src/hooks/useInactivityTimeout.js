import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Implements the 15-minute inactivity requirement from the IF API ToS.
 * Returns isTimedOut=true when the user has been idle for `timeoutMs`.
 * Call resetTimer() on any user interaction.
 */
export default function useInactivityTimeout(timeoutMs = 15 * 60 * 1000) {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    setIsTimedOut(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsTimedOut(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetTimer]);

  return { isTimedOut, resetTimer };
}
