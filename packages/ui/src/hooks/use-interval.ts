"use client";

import { useEffect, useRef } from "react";

/**
 * Runs a callback on a fixed interval, always invoking the latest closure without resetting the timer on every render.
 * @param callback - Function invoked on every tick.
 * @param delay - Interval in milliseconds; pass `null` to pause the interval.
 * @example
 * useInterval(() => setCount((count) => count + 1), isRunning ? 1000 : null);
 */
export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};
