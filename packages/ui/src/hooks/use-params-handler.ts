"use client";

import { useCallback, useState } from "react";

export type ParamValue = string | number | boolean | undefined;

/**
 * Reads and writes typed URL search params, keeping component state in sync with the query string.
 * Distinct from `next/navigation`'s `useParams`, which reads dynamic route segments rather than the query string.
 * @param defaults - Fallback values used when a key is absent from the URL; their types drive coercion (`number`/`boolean`/`string`).
 * @returns The resolved `params`, plus `setParam`/`setParams` to patch the query string and `resetParams` to restore the defaults.
 * @example
 * const { params, setParam } = useParams({ page: 1, pageSize: 20, search: "" });
 * setParam("page", params.page + 1);
 */
export const useParamsHandler = <T extends Record<string, ParamValue>>(defaults: T) => {
  const [params, setParams] = useState(defaults);

  const onParamsChange = useCallback(<K extends keyof typeof defaults>(key: K, value: T[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onParamsReset = () => setParams(defaults);

  return { onParamsChange, onParamsReset, params };
};
