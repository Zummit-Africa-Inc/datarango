import { expect, test } from "@playwright/test";

import { register, signIn, studioUser } from "./support";

/**
 * Phase 2 gate — the studio half, against the live stack.
 *
 * This is the check the phase's rules of engagement ask for and that nothing had
 * ever performed: a creator authoring a course *in the studio*, not through
 * curl. The backend chain was proven end to end weeks before any of this UI was
 * pointed at it.
 *
 * The account is synthetic and created here. Nothing touches a real user's
 * credentials — the password exists for the duration of this file.
 */

const creator = studioUser("studio");

test.describe("Phase 2 gate — studio", () => {
  test("a creator signs in and authors a course through the UI", async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await register(request, creator);
    await signIn(page, creator);

    // The courses screen must actually render. This is where the double-wrapped
    // catalog envelope would have surfaced — the list rendering but every field
    // reading `undefined`.
    await expect(page).toHaveURL(/\/courses/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /courses/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    // Author a course.
    const title = `Gate Course ${Date.now()}`;
    await page
      .getByRole("button", { name: /new course|create course|add course/i })
      .first()
      .click();

    await page.getByRole("textbox", { name: /title/i }).first().fill(title);

    // Slug is usually derived from the title; fill it only if it stayed empty.
    const slug = page.getByRole("textbox", { name: /slug/i }).first();
    if (await slug.isVisible().catch(() => false)) {
      const current = await slug.inputValue();
      if (!current) await slug.fill(`gate-course-${Date.now()}`);
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
