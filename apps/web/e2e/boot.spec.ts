import { expect, test } from "@playwright/test";

/**
 * Does the app render?
 *
 * Every assertion here is about a page producing real content rather than an
 * error boundary or a blank body. No backend is running, so anything needing
 * data is expected to redirect or show its empty state — and asserting the
 * redirect is worthwhile in itself, because an auth guard failing open would
 * surface here as a dashboard that rendered anyway.
 *
 * The bar is deliberately "it works at all". A suite that asserts copy breaks
 * on every wording change and gets deleted; this one should only go red when
 * something is genuinely broken.
 */

/** Console errors are collected per test so a page that renders *and* throws still fails. */
const watchForErrors = (page: import("@playwright/test").Page) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
};

test("the marketing home page renders", async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto("/");

  // A real heading, not a shell. `first()` because the hero and nav both carry
  // headings and strict mode would otherwise fail on the ambiguity.
  await expect(page.locator("h1").first()).toBeVisible();
  expect(errors, `uncaught errors: ${errors.join(" | ")}`).toEqual([]);
});

test("the sign-in page renders its form", async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto("/signin");

  // Email is the one field every sign-in path starts from — password, social
  // and SSO discovery all key off it.
  await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  expect(errors, `uncaught errors: ${errors.join(" | ")}`).toEqual([]);
});

test("a guarded route does not render without a session", async ({ page }) => {
  await page.goto("/dashboard");

  // Either bounced to sign-in, or held on a loader while the guard resolves.
  // What must not happen is the dashboard rendering as though signed in.
  await page.waitForLoadState("networkidle");
  const url = page.url();
  const showsDashboardContent = await page
    .getByRole("heading", { name: /welcome back/i })
    .isVisible()
    .catch(() => false);

  expect(
    url.includes("/signin") || url.includes("/api/auth") || !showsDashboardContent,
    `guard failed open: landed on ${url} with dashboard content visible`,
  ).toBe(true);
});

test("the public certificate verification page renders for an unknown serial", async ({ page }) => {
  const errors = watchForErrors(page);

  // Deliberately public and server-rendered (decision #10): a hiring manager
  // pasting a serial must get an answer in the HTML. A bogus serial must render
  // the not-found state rather than a false "verified" or a crash.
  await page.goto("/verify/DR-XXXX-XXXX-XXXX");

  await expect(page.locator("body")).not.toBeEmpty();
  expect(errors, `uncaught errors: ${errors.join(" | ")}`).toEqual([]);
});
