import { expect, test } from "@playwright/test";

import { register, signIn, studioUser } from "./support";

/**
 * The media upload path, through the real UI against the live stack.
 *
 * This is the one piece of the media work that **no other test can reach**. The
 * upload does not go through `@datarango/api` — it cannot, because the ticket
 * URL is a different origin and that client stamps the session JWT on every
 * request — so the bytes travel over a hand-written `XMLHttpRequest` that only a
 * browser executes. The API-level verification proved the server contract; it
 * ran the transport not at all.
 *
 * Three things can only fail here: the ticket's `Content-Type` not being echoed
 * back verbatim (the server deletes the object and fails the asset on a
 * mismatch), the presigned URL being signed for an origin the browser cannot
 * reach, and CORS on the object store.
 */

const creator = studioUser("media");

test.describe("Media library", () => {
  test("a creator uploads an image and it becomes ready", async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await register(request, creator);
    await signIn(page, creator);

    await page.goto("/media");
    await expect(page.getByRole("heading", { name: /media library/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    // A new creator's library is empty — owner-scoped, so nobody else's uploads
    // can drift into this assertion.
    await expect(page.getByText(/nothing uploaded yet/i)).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole("button", { name: /^upload$/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // A real 1x1 PNG, with the content type the server allowlists. Supplied as a
    // buffer rather than a fixture file so the mime type is stated explicitly —
    // it is the value the whole completion check turns on.
    const fileName = `proof-${Date.now()}.png`;
    await dialog.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    // The picker states the file's own type, not the kind it maps to.
    await expect(dialog.getByText(/image\/png/)).toBeVisible();

    await dialog.getByRole("button", { name: /^upload$/i }).click();

    // The outcome the server settled on. An image completes straight to ready —
    // there is nothing to transcode — so this is the whole round trip: ticket →
    // presigned PUT from the browser → complete → the server's own verification
    // of what actually landed in the bucket.
    await expect(dialog.getByText(new RegExp(`${fileName} is ready`, "i"))).toBeVisible({
      timeout: 60_000,
    });

    await dialog.getByRole("button", { name: /^done$/i }).click();
    await expect(dialog).toBeHidden();

    // And it is in the library, from a fresh read rather than the dialog's own
    // state.
    await expect(page.getByText(fileName).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^ready$/i).first()).toBeVisible();

    expect(pageErrors, `uncaught errors: ${pageErrors.join(" | ")}`).toEqual([]);
  });

  test("a file the server would refuse is refused before it is sent", async ({ page, request }) => {
    const rejected = studioUser("reject");
    await register(request, rejected);
    await signIn(page, rejected);

    await page.goto("/media");
    await page
      .getByRole("button", { name: /^upload$/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");

    // SVG is deliberately absent from the image allowlist — it is a
    // script-bearing format and the store echoes the content type on download.
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "payload.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    });

    await expect(dialog.getByText(/is not an accepted upload type/i)).toBeVisible();

    // The point: the submit is disabled, so no ticket is ever requested. The
    // server would refuse it anyway, but a UI that lets somebody send a 4 GB
    // file and then explains why it was pointless is not the same product.
    await expect(dialog.getByRole("button", { name: /^upload$/i })).toBeDisabled();
  });
});
