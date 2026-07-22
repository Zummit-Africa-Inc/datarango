import { createAuthHandlers } from "@datarango/auth/server";

// Powers POST /api/auth/signout (session cookie clear) so ContextSwitcher's
// sign-out works. signin/callback/refresh are wired for when the console gains
// its own OIDC login; sign-out itself needs none of the OIDC config.
const handlers = createAuthHandlers({
  issuer: process.env.AUTH_ISSUER ?? "http://localhost:8080",
  clientId: process.env.AUTH_CLIENT_ID ?? "datarango-console",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const { GET, POST } = handlers;
