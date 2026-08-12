import { createHash, randomBytes } from "node:crypto";

import { expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Shared setup for the studio's live-stack specs.
 *
 * Accounts are synthetic and created per spec. Nothing here touches a real
 * user's credentials — the passwords exist for the duration of a run.
 */

export const GATEWAY = "http://localhost:8080";
export const STUDIO = "http://localhost:3002";

export interface StudioUser {
  email: string;
  password: string;
  displayName: string;
}

/**
 * A throwaway creator, unique per call.
 *
 * Unique because these specs assert on things like "the library is empty" and
 * "this course is in the queue", which a shared account would make false the
 * second time anybody ran them.
 */
export const studioUser = (label: string): StudioUser => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `gate-${label}-${stamp}@datarango.test`,
    password: `gate-${label}-pass-1`,
    displayName: `Gate ${label}`,
  };
};

/** Registers the throwaway account straight against the gateway. */
export const register = async (request: APIRequestContext, user: StudioUser) => {
  const response = await request.post(`${GATEWAY}/auth/register`, {
    data: { email: user.email, displayName: user.displayName, password: user.password },
  });
  expect(response.ok(), `register failed: ${response.status()}`).toBe(true);
};

/**
 * Signs in through the real chain: studio guard → studio BFF → gateway
 * /connect/authorize → web /signin → back with a session.
 */
export const signIn = async (page: Page, user: StudioUser) => {
  await page.goto(`${STUDIO}/courses`);

  // The guard should send us to web's sign-in rather than render the studio.
  await page.waitForURL(/localhost:3000\/signin/, { timeout: 30_000 });

  await page.getByRole("textbox", { name: /email/i }).fill(user.email);
  await page.locator('input[type="password"]').first().fill(user.password);

  // The form's own submit, scoped to the form. A looser name match caught
  // "Continue with Google" and drove the run onto a real Google sign-in page —
  // the password flow is what is under test, and third-party consent screens are
  // not something a test should be clicking through.
  await page.locator('form button[type="submit"]').first().click();

  // ...and back into the studio, authenticated.
  await page.waitForURL(/localhost:3002/, { timeout: 45_000 });
};

/**
 * An access token for the same user, for the API-driven setup steps.
 *
 * Some preconditions are simply not worth clicking: building a publishable
 * course means a quiz with a question, published, then attached as a module's
 * exercise. That chain is already covered by the API-level verification, and
 * driving it through the UI in every spec would make each one slow and brittle
 * for no extra coverage. The parts under test are always the ones clicked.
 */
export const tokenFor = async (request: APIRequestContext, user: StudioUser): Promise<string> => {
  // Accounts allows auth-code + PKCE and nothing else — there is deliberately no
  // password grant — so the setup path is the same dance the browser does. The
  // request context carries the SSO cookie that /auth/login sets, which is what
  // lets /connect/authorize complete without a second sign-in.
  const login = await request.post(`${GATEWAY}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(login.ok(), `login failed: ${login.status()}`).toBe(true);

  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());

  const authorize = await request.get(`${GATEWAY}/connect/authorize`, {
    params: {
      client_id: "datarango-studio",
      response_type: "code",
      redirect_uri: `${STUDIO}/api/auth/callback`,
      scope: "openid profile email offline_access",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state: "e2e",
    },
    // The authorization code is in the Location header; following the redirect
    // would land on the BFF callback and consume it.
    maxRedirects: 0,
    failOnStatusCode: false,
  });

  const location = authorize.headers()["location"];
  if (!location) {
    throw new Error(`authorize did not redirect (${authorize.status()})`);
  }

  const code = new URL(location).searchParams.get("code");
  expect(code, `no code in redirect: ${location}`).toBeTruthy();

  const token = await request.post(`${GATEWAY}/connect/token`, {
    form: {
      grant_type: "authorization_code",
      code: code!,
      redirect_uri: `${STUDIO}/api/auth/callback`,
      client_id: "datarango-studio",
      code_verifier: verifier,
    },
  });
  expect(token.ok(), `token exchange failed: ${token.status()}`).toBe(true);

  return (await token.json()).access_token as string;
};

const base64Url = (buffer: Buffer): string =>
  buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
