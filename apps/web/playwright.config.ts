import { defineConfig, devices } from "@playwright/test";

/**
 * Boot smoke for the web app.
 *
 * Deliberately **not** a full end-to-end suite. Driving real journeys needs the
 * whole backend — Postgres, NATS, five services — and a CI job that spins all of
 * that becomes slow enough that people stop waiting for it. What this covers is
 * the gap nothing else does: whether the built app actually renders.
 *
 * That gap is not hypothetical. Typecheck and `next build` were green for weeks
 * while the studio would have read `undefined` from every field, because the
 * gateway double-wrapped catalog responses. Types cannot catch a server that
 * disagrees with them, and a build cannot catch a page that throws on paint.
 *
 * Pages needing a session are expected to redirect, and asserting *that* is
 * itself worth having: the auth guard silently failing open would show up here.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // The production build, not `next dev`. Dev-mode leniency is exactly what
    // hides the failures worth catching, and this repo has had Turbopack
    // dev-server instability besides.
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
