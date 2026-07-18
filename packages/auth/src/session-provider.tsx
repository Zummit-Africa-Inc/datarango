"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { SessionPayload } from "./types";
import { useSessionStore } from "./store";

interface SessionProviderProps {
  children: ReactNode;
  /**
   * Boots the session: silent refresh via the BFF, then the platform `/me`.
   * Resolve null for a guest. Wired in each app so packages stay decoupled.
   */
  loadSession: () => Promise<SessionPayload | null>;
}

/**
 * Runs the session bootstrap exactly once on mount and feeds the session
 * store; everything downstream (guards, hooks, api org scoping) reacts to
 * the store.
 *
 * @example
 * <SessionProvider loadSession={loadSession}>{children}</SessionProvider>
 */
export const SessionProvider = ({ children, loadSession }: SessionProviderProps) => {
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const { setSession, setGuest } = useSessionStore.getState();
    loadSession()
      .then((session) => (session ? setSession(session) : setGuest()))
      .catch(() => setGuest());
  }, [loadSession]);

  return children;
};
