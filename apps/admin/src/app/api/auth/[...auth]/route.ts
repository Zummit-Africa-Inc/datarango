import { createAuthHandlers } from "@datarango/auth/server";

// Backs /api/auth/signin (PKCE hand-off, which auto-completes via the shared
// SSO cookie on the gateway origin) and /api/auth/signout.
const handlers = createAuthHandlers({
  issuer: process.env.AUTH_ISSUER ?? "http://localhost:8080",
  // Unset outside Docker, where the public issuer is reachable from here too.
  // Inside a container `localhost:8080` is this container, so the server-side
  // code exchange has to dial the gateway on the compose network instead.
  tokenIssuer: process.env.AUTH_ISSUER_INTERNAL,
  clientId: process.env.AUTH_CLIENT_ID ?? "datarango-admin",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003",
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const { GET, POST } = handlers;
