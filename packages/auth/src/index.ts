/**
 * @datarango/auth — OIDC PKCE client, session state, org-context store, route guards.
 *
 * Phase F1 (backend Phase 1) implements: authorization code + PKCE against the
 * accounts service, silent refresh via per-app BFF route, requireAuth /
 * requirePermission / requireOrgRole guards. Tokens live in memory only.
 */
import { create } from "zustand";

export interface Membership {
  orgId: string;
  role: string;
}

interface SessionState {
  userId: string | null;
  email: string | null;
  memberships: Membership[];
  /** Active context: an org id, or null for the personal context. */
  activeOrgId: string | null;
  setSession: (session: { userId: string; email: string; memberships: Membership[] }) => void;
  setOrgContext: (orgId: string | null) => void;
  clearSession: () => void;
}

/** Platform-wide session + org-context store (the one package-level Zustand store). */
export const useSessionStore = create<SessionState>()((set) => ({
  userId: null,
  email: null,
  memberships: [],
  activeOrgId: null,
  setSession: ({ userId, email, memberships }) => set({ userId, email, memberships }),
  setOrgContext: (activeOrgId) => set({ activeOrgId }),
  clearSession: () => set({ userId: null, email: null, memberships: [], activeOrgId: null }),
}));
