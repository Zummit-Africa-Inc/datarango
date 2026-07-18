let accessToken: string | null = null;
let expiresAt = 0;

/**
 * In-memory access token holder (FRONTEND-HANDOFF §2: tokens never touch
 * storage). The api client reads from here; the refresh flow writes to it.
 */
export const tokenStore = {
  /** Current access token, or null when signed out / not yet refreshed. */
  get: (): string | null => accessToken,
  /**
   * Stores a fresh access token.
   * @param token - The raw bearer token.
   * @param expiresInSeconds - Lifetime reported by the token endpoint.
   */
  set: (token: string, expiresInSeconds: number): void => {
    accessToken = token;
    expiresAt = Date.now() + expiresInSeconds * 1000;
  },
  clear: (): void => {
    accessToken = null;
    expiresAt = 0;
  },
  /**
   * Whether the token is absent or inside the expiry window — callers use this
   * to refresh proactively instead of eating a 401.
   * @param withinMs - Window before hard expiry considered "expiring" (default 60s).
   */
  isExpiring: (withinMs = 60_000): boolean =>
    accessToken === null || Date.now() > expiresAt - withinMs,
};
