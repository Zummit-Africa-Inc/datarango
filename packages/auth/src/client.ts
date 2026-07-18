import { tokenStore } from "./token";
import { useSessionStore } from "./store";

interface AuthClientConfig {
  /** BFF mount point in the host app (default "/api/auth"). */
  basePath?: string;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Browser-side auth client talking to the app's BFF routes. One in-flight
 * refresh at a time — concurrent 401s share the same promise.
 *
 * @param config - BFF mount point override.
 * @returns signIn / signOut / refresh actions.
 * @example const auth = createAuthClient(); await auth.refresh();
 */
export const createAuthClient = ({ basePath = "/api/auth" }: AuthClientConfig = {}) => {
  let refreshing: Promise<string | null> | null = null;

  const refresh = (): Promise<string | null> => {
    refreshing ??= fetch(`${basePath}/refresh`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        const { accessToken, expiresIn } = (await res.json()) as RefreshResponse;
        tokenStore.set(accessToken, expiresIn);
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };

  return {
    /** Redirects to the hosted sign-in flow, preserving the return location. */
    signIn: (returnTo?: string): void => {
      const suffix = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
      window.location.assign(`${basePath}/signin${suffix}`);
    },
    /** Ends the session everywhere: BFF cookies, memory token, store. */
    signOut: async (): Promise<void> => {
      await fetch(`${basePath}/signout`, { method: "POST" }).catch(() => undefined);
      useSessionStore.getState().clearSession();
      window.location.assign("/");
    },
    /** Silent refresh via the rotating refresh cookie; null when the session is gone. */
    refresh,
  };
};

export type AuthClient = ReturnType<typeof createAuthClient>;
