import { createAuthProxy } from "@datarango/auth/middleware";

export const proxy = createAuthProxy({ signInUrl: "/signin" });

export const config = {
  matcher: ["/dashboard/:path*"],
};
