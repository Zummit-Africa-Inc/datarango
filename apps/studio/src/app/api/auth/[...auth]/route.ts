import { createAuthHandlers } from "@datarango/auth/server";

// Backs /api/auth/signin (PKCE hand-off, which auto-completes via the shared
// SSO cookie on the gateway origin) and /api/auth/signout.
const handlers = createAuthHandlers({
  issuer: process.env.AUTH_ISSUER ?? "http://localhost:8080",
  clientId: process.env.AUTH_CLIENT_ID ?? "datarango-studio",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002",
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const { GET, POST } = handlers;
