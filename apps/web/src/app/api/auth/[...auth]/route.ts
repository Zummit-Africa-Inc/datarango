import { createAuthHandlers } from "@datarango/auth/server";

const handlers = createAuthHandlers({
  issuer: process.env.AUTH_ISSUER ?? "http://localhost:8080",
  // Unset outside Docker, where the public issuer is reachable from here too.
  tokenIssuer: process.env.AUTH_ISSUER_INTERNAL,
  clientId: process.env.AUTH_CLIENT_ID ?? "datarango-web",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const { GET, POST } = handlers;
