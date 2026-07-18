import { NextResponse, type NextRequest } from "next/server";

export interface AuthMiddlewareConfig {
  /** Sign-in location; absolute URL for apps whose auth UI lives on `web`. */
  signInUrl?: string;
  /** Session marker cookie set by the BFF (default "dr_session"). */
  sessionCookie?: string;
  /** Path prefixes always allowed through, even without a session. */
  publicPaths?: string[];
}

/**
 * Edge middleware factory: optimistic session gating by cookie presence.
 * Pair with `matcher` config so it only runs on protected paths; the client
 * AuthGuard and the api layer's 401 handling remain the source of truth.
 *
 * @param config - Sign-in target, cookie name, public path prefixes.
 * @returns A Next.js middleware function.
 * @example
 * export const middleware = createAuthMiddleware({ signInUrl: "/signin" });
 * export const config = { matcher: ["/dashboard/:path*"] };
 */
export const createAuthMiddleware = ({
  signInUrl = "/signin",
  sessionCookie = "dr_session",
  publicPaths = [],
}: AuthMiddlewareConfig = {}) => {
  return (request: NextRequest): NextResponse => {
    const { pathname, search } = request.nextUrl;
    const isPublic = publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (isPublic || request.cookies.has(sessionCookie)) return NextResponse.next();

    const returnTo = encodeURIComponent(`${pathname}${search}`);
    const target = signInUrl.startsWith("http")
      ? new URL(`${signInUrl}?returnTo=${returnTo}`)
      : new URL(`${signInUrl}?returnTo=${returnTo}`, request.url);
    return NextResponse.redirect(target);
  };
};
