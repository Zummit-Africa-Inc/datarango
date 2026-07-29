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
  getOrgId: () => useSessionStore.getState().activeOrgId,
  onUnauthorized: async () => (await auth.refresh()) !== null,
  onSessionExpired: () => useSessionStore.getState().clearSession(),
});

const loadSession = async (): Promise<SessionPayload | null> => {
  const token = await auth.refresh();
  if (!token) return null;
  return getApi().get<SessionPayload>("/me");
};

export const Providers = ({ children }: { children: ReactNode }) => {
  const activeOrgId = useSessionStore((s) => s.activeOrgId);

  return (
    <ApiProvider orgId={activeOrgId}>
      <SessionProvider loadSession={loadSession}>
        {children}
        <Toaster />
      </SessionProvider>
    </ApiProvider>
  );
};
