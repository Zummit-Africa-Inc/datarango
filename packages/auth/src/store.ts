import { persist } from "zustand/middleware";
import { create } from "zustand";

import type { Membership, SessionPayload, SessionStatus, SessionUser } from "./types";
import { tokenStore } from "./token";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  memberships: Membership[];
  /** Active context: an org id, or null for the personal context. */
  activeOrgId: string | null;
  setSession: (session: SessionPayload) => void;
  setGuest: () => void;
  setOrgContext: (orgId: string | null) => void;
  clearSession: () => void;
}

/**
 * Platform-wide session + org-context store — the one package-level Zustand
 * store (FRONTEND-HANDOFF §1). Only `activeOrgId` persists (per app);
 * user/session state is rebuilt from the BFF refresh + `/me` on boot, and
 * tokens live in {@link tokenStore}, never here.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      status: "loading",
      user: null,
      memberships: [],
      activeOrgId: null,
      setSession: ({ user, memberships }) => {
        const { activeOrgId } = get();
        const stillMember = memberships.some((m) => m.orgId === activeOrgId);
        set({
          status: "authenticated",
          user,
          memberships,
          activeOrgId: stillMember ? activeOrgId : null,
        });
      },
      setGuest: () => set({ status: "guest", user: null, memberships: [] }),
      setOrgContext: (orgId) => {
        if (orgId !== null && !get().memberships.some((m) => m.orgId === orgId)) return;
        set({ activeOrgId: orgId });
      },
      clearSession: () => {
        tokenStore.clear();
        set({ status: "guest", user: null, memberships: [], activeOrgId: null });
      },
    }),
    {
      name: "dr.auth.context",
      partialize: ({ activeOrgId }) => ({ activeOrgId }),
    },
  ),
);

/** The membership record for the active org context, or null in personal context. */
export const selectActiveMembership = (state: {
  memberships: Membership[];
  activeOrgId: string | null;
}): Membership | null => state.memberships.find((m) => m.orgId === state.activeOrgId) ?? null;
