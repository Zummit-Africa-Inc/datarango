"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Delays reflecting a fast-changing value until it has stopped changing for the given delay.
 * @param value - The value to debounce.
 * @param delay - Milliseconds to wait after the last change before updating. Defaults to `300`.
 * @returns The debounced value, updated only once `value` has settled.
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 400);
 * useEffect(() => { setParam("search", debouncedSearch); }, [debouncedSearch]);
 */
export const useDebounce = <T>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

export const useDebouncedCallback = <T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
) => {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => ref.current(...args), delay);
    },
    [delay],
  );
};
