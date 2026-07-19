import { createAuthMiddleware } from "@datarango/auth/middleware";

export const middleware = createAuthMiddleware({ signInUrl: "/signin" });

export const config = {
  matcher: [
    // "/dashboard/:path*",
  ],
};
