import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Phase 2 gate — the studio half, against the live stack.
 *
 * This is the check the phase's rules of engagement ask for and that nothing had
 * ever performed: a creator authoring a course *in the studio*, not through
 * curl. The backend chain was proven end to end weeks before any of this UI was
 * pointed at it.
 *
 * The account is synthetic and created here. Nothing touches a real user's
 * credentials — the password below exists for the duration of this file.
 */

const GATEWAY = "http://localhost:8080";
const STUDIO = "http://localhost:3002";

const stamp = Date.now();
const creator = {
  email: `gate-studio-${stamp}@datarango.test`,
  password: "gate-studio-pass-1",
  displayName: "Gate Studio Creator",
};

/** Registers the throwaway creator straight against the gateway. */
const register = async (request: APIRequestContext) => {
  const response = await request.post(`${GATEWAY}/auth/register`, {
    data: { email: creator.email, displayName: creator.displayName, password: creator.password },
  });
  expect(response.ok(), `register failed: ${response.status()}`).toBe(true);
};

/**
 * Signs in through the real chain: studio guard → studio BFF → gateway
 * /connect/authorize → web /signin → back with a session.
 */
const signIn = async (page: Page) => {
  await page.goto(`${STUDIO}/courses`);

  // The guard should send us to web's sign-in rather than render the studio.
  await page.waitForURL(/localhost:3000\/signin/, { timeout: 30_000 });

  await page.getByRole("textbox", { name: /email/i }).fill(creator.email);
  await page.locator('input[type="password"]').first().fill(creator.password);

  // The form's own submit, scoped to the form. A looser name match caught
  // "Continue with Google" and drove the run onto a real Google sign-in page —
  // the password flow is what is under test, and third-party consent screens are
  // not something a test should be clicking through.
  await page.locator('form button[type="submit"]').first().click();

  // ...and back into the studio, authenticated.
  await page.waitForURL(/localhost:3002/, { timeout: 45_000 });
};

test.describe("Phase 2 gate — studio", () => {
  test("a creator signs in and authors a course through the UI", async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await register(request);
    await signIn(page);

    // The courses screen must actually render. This is where the double-wrapped
    // catalog envelope would have surfaced — the list rendering but every field
    // reading `undefined`.
    await expect(page).toHaveURL(/\/courses/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /courses/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    // Author a course.
    const title = `Gate Course ${stamp}`;
    await page.getByRole("button", { name: /new course|create course|add course/i }).first().click();

    await page.getByRole("textbox", { name: /title/i }).first().fill(title);

    // Slug is usually derived from the title; fill it only if it stayed empty.
    const slug = page.getByRole("textbox", { name: /slug/i }).first();
    if (await slug.isVisible().catch(() => false)) {
      const current = await slug.inputValue();
      if (!current) await slug.fill(`gate-course-${stamp}`);
    }

    const summary = page.getByRole("textbox", { name: /summary|description/i }).first();
    if (await summary.isVisible().catch(() => false)) {
      await summary.fill("Authored through the studio for the Phase 2 gate.");
    }

    await page
      .getByRole("button", { name: /^create$|create course|save/i })
      .last()
      .click();

    // The real assertion: the course the server stored comes back and renders
    // with its actual title. A wrapped envelope would show a card with no title.
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 30_000 });

    expect(pageErrors, `uncaught errors: ${pageErrors.join(" | ")}`).toEqual([]);
  });
});
