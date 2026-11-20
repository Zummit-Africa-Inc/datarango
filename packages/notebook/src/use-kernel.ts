"use client";

import { useEffect, useState } from "react";

import { KernelClient } from "./kernel";
import { type KernelStatus } from "./types";

/**
 * Attaches to the session's kernel for as long as the component is mounted.
 * Unmounting closes the socket only; the kernel (and its variables) keeps
 * running until the session ends.
 */
export const useKernel = (sessionId: string) => {
  const [kernel, setKernel] = useState<KernelClient | null>(null);
  const [status, setStatus] = useState<KernelStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new KernelClient(sessionId);
    let cancelled = false;
    const unsubscribe = client.onStatus(setStatus);
    setError(null);
    client
      .connect()
      .then(() => {
        if (!cancelled) setKernel(client);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus("dead");
          setError(err instanceof Error ? err.message : "Could not reach the kernel");
        }
      });
    return () => {
      cancelled = true;
      unsubscribe();
      client.dispose();
      setKernel(null);
    };
  }, [sessionId]);

  return { kernel, status, error };
};
