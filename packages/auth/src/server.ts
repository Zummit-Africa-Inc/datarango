import { NextResponse, type NextRequest } from "next/server";

import { createPkcePair, randomState } from "./pkce";

export interface AuthHandlerConfig {
  /** Accounts service origin (OpenIddict), e.g. https://accounts.datarango.com */
  issuer: string;
  clientId: string;
  /** This app's public origin — used for the redirect URI and returnTo resolution. */
  appUrl: string;
  /** OAuth scopes (default: "openid profile email offline_access"). */
  scope?: string;
  /** Cookie domain, ".datarango.com" in prod so the session spans apps. */
  cookieDomain?: string;
  /** Session marker cookie the middleware checks (default "dr_session"). */
  sessionCookie?: string;
  /** Refresh-token cookie lifetime in seconds (default 30 days). */
  refreshMaxAge?: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface RouteContext {
  params: Promise<{ auth: string[] }>;
}

type Handler = (request: NextRequest, context: RouteContext) => Promise<NextResponse>;

/**
 * BFF route-handler factory (FRONTEND-HANDOFF §2): authorization code + PKCE
 * against the accounts service, rotating refresh token in an httpOnly cookie,
 * access tokens returned to the browser for memory-only use. Mount in each
 * app at `app/api/auth/[...auth]/route.ts`.
 *
 * Routes: GET signin, GET callback, POST refresh, POST signout.
 *
 * @example
 * const handlers = createAuthHandlers({ issuer, clientId, appUrl });
 * export const { GET, POST } = handlers;
 */
export const createAuthHandlers = ({
  issuer,
  clientId,
  appUrl,
  scope = "openid profile email offline_access",
  cookieDomain,
  sessionCookie = "dr_session",
  refreshMaxAge = 30 * 24 * 60 * 60,
}: AuthHandlerConfig): { GET: Handler; POST: Handler } => {
  const redirectUri = `${appUrl}/api/auth/callback`;
  const secure = appUrl.startsWith("https");
  const base = { httpOnly: true, secure, sameSite: "lax" as const };
  const flowCookie = { ...base, path: "/api/auth", maxAge: 600 };
  const refreshCookie = { ...base, path: "/api/auth", maxAge: refreshMaxAge };
  const markerCookie = {
    ...base,
    path: "/",
    maxAge: refreshMaxAge,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };

  const exchangeToken = async (body: Record<string, string>): Promise<TokenResponse | null> => {
    const res = await fetch(`${issuer}/connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, ...body }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TokenResponse;
  };

  const clearSession = (response: NextResponse): NextResponse => {
    response.cookies.set("dr_refresh", "", { ...refreshCookie, maxAge: 0 });
    response.cookies.set(sessionCookie, "", { ...markerCookie, maxAge: 0 });
    return response;
  };

  const signin = async (request: NextRequest): Promise<NextResponse> => {
    const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/";
    const { verifier, challenge } = await createPkcePair();
    const state = randomState();

    const authorize = new URL(`${issuer}/connect/authorize`);
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("scope", scope);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", challenge);
    authorize.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authorize);
    response.cookies.set("dr_pkce", verifier, flowCookie);
    response.cookies.set("dr_state", JSON.stringify({ state, returnTo }), flowCookie);
    return response;
  };

  const callback = async (request: NextRequest): Promise<NextResponse> => {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const verifier = request.cookies.get("dr_pkce")?.value;
    const stored = request.cookies.get("dr_state")?.value;

    const fail = (reason: string) =>
      NextResponse.redirect(new URL(`/signin?error=${reason}`, appUrl));

    if (!code || !state || !verifier || !stored) return fail("missing_flow_state");

    let expected: { state: string; returnTo: string };
    try {
      expected = JSON.parse(stored) as { state: string; returnTo: string };
    } catch {
      return fail("invalid_flow_state");
    }
    if (expected.state !== state) return fail("state_mismatch");

    const tokens = await exchangeToken({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    if (!tokens?.refresh_token) return fail("token_exchange_failed");

    const returnTo = expected.returnTo.startsWith("/") ? expected.returnTo : "/";
    const response = NextResponse.redirect(new URL(returnTo, appUrl));
    response.cookies.set("dr_refresh", tokens.refresh_token, refreshCookie);
    response.cookies.set(sessionCookie, "1", markerCookie);
    response.cookies.set("dr_pkce", "", { ...flowCookie, maxAge: 0 });
    response.cookies.set("dr_state", "", { ...flowCookie, maxAge: 0 });
    return response;
  };

  const refresh = async (request: NextRequest): Promise<NextResponse> => {
    const token = request.cookies.get("dr_refresh")?.value;
    if (!token) return clearSession(NextResponse.json({ error: "no_session" }, { status: 401 }));

    const tokens = await exchangeToken({ grant_type: "refresh_token", refresh_token: token });
    if (!tokens) {
      return clearSession(NextResponse.json({ error: "refresh_failed" }, { status: 401 }));
    }

    const response = NextResponse.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    });
    if (tokens.refresh_token) response.cookies.set("dr_refresh", tokens.refresh_token, refreshCookie);
    response.cookies.set(sessionCookie, "1", markerCookie);
    return response;
  };

  const signout = async (): Promise<NextResponse> =>
    clearSession(NextResponse.json({ ok: true }));

  const route: Handler = async (request, context) => {
    const [action] = (await context.params).auth;
    switch (`${request.method} ${action}`) {
      case "GET signin":
        return signin(request);
      case "GET callback":
        return callback(request);
      case "POST refresh":
        return refresh(request);
      case "POST signout":
        return signout();
      default:
        return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  };

  return { GET: route, POST: route };
};
