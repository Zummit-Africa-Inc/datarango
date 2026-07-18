"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a stable debounced version of `callback`. Pending calls are
 * cancelled on unmount.
 */
export const useDebouncedCallback = <A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 300,
): ((...args: A) => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return useMemo(
    () =>
      (...args: A) => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
      },
    [delay],
  );
};
