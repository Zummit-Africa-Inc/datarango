"use client";

import { type ReactNode } from "react";

import { ApiProvider, configureApi, getApi } from "@datarango/api";
import {
  SessionProvider,
  createAuthClient,
  tokenStore,
  useSessionStore,
  type SessionPayload,
} from "@datarango/auth";
import { Toaster } from "@datarango/ui";

const auth = createAuthClient();

configureApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  getAccessToken: () => tokenStore.get(),
  // Admin acts as the platform, not as a tenant, so there is no org to inject.
  // Platform authority arrives on the envelope as `platformRoles`, resolved by
  // the gateway from the user — deliberately kept separate from org permissions
  // so a tenant grant and a platform grant can never be confused.
  getOrgId: () => null,
  onUnauthorized: async () => (await auth.refresh()) !== null,
  onSessionExpired: () => useSessionStore.getState().clearSession(),
});

const loadSession = async (): Promise<SessionPayload | null> => {
  const token = await auth.refresh();
  if (!token) return null;
  return getApi().get<SessionPayload>("/me");
};

export const Providers = ({ children }: { children: ReactNode }) => (
  <ApiProvider orgId={null}>
    <SessionProvider loadSession={loadSession}>
      {children}
      <Toaster />
    </SessionProvider>
  </ApiProvider>
);
