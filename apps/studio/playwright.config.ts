import { defineConfig, devices } from "@playwright/test";

/**
 * The Phase 2 gate, driven through the real UI against the running stack.
 *
 * Unlike `web`'s boot smoke, this one **needs the backend up** — the whole point
 * is the seam between the studio's hooks and the gateway. That seam has already
 * hidden one bug that neither typecheck nor `next build` could see: catalog
 * responses were double-wrapped, so every field the studio read would have been
 * `undefined`. It survived because the studio had never once been run against a
 * live backend.
 *
 * Two servers, because signing in genuinely spans them: the studio's guard
 * bounces to its BFF, which bounces to the gateway's OIDC endpoint, which lands
 * on `web`'s sign-in page. That chain is part of what is being verified.
 *
 * `pnpm start` rather than `build && start` — the apps are built beforehand, so
 * a failing build fails loudly on its own rather than inside a webServer timeout.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // one creator, one course; parallel runs would race
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 90_000,

  use: {
    baseURL: "http://localhost:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      command: "pnpm start",
      url: "http://localhost:3002",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // `web` owns /signin for every app — the SSO cookie lives on the gateway
      // origin, so studio's guard completes through here.
      command: "pnpm --filter web start",
      cwd: "../..",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
