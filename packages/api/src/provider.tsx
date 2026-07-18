"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";

const OrgScopeContext = createContext<string | null>(null);

/** The org id useApi scopes query keys with (null = personal context). */
export const useOrgScope = (): string | null => useContext(OrgScopeContext);

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

interface ApiProviderProps {
  children: ReactNode;
  /**
   * Active org context from the auth store — passed as a prop so this package
   * stays decoupled from @datarango/auth (apps wire the two together).
   */
  orgId?: string | null;
}

/**
 * Owns the QueryClient and the org scope that useApi bakes into query keys.
 * Mount once per app, inside the session provider.
 *
 * @example
 * <ApiProvider orgId={activeOrgId}><App /></ApiProvider>
 */
export const ApiProvider = ({ children, orgId = null }: ApiProviderProps) => {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OrgScopeContext.Provider value={orgId}>{children}</OrgScopeContext.Provider>
    </QueryClientProvider>
  );
};
