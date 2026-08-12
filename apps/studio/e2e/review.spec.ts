import { expect, test, type APIRequestContext } from "@playwright/test";

import { GATEWAY, register, signIn, studioUser, tokenFor } from "./support";

/**
 * The creator's half of the review workflow, through the UI.
 *
 * What this proves that the API-level run could not: the course builder offers
 * **Submit for review** and no publish button — there is no publish endpoint
 * left to call — and `/review` renders the creator's own submissions from real
 * data. The reviewer's half lives in the admin app and needs a platform grant,
 * so it stays API-verified for now.
 */

const creator = studioUser("review");

/**
 * A course that is actually submittable: one module, one lesson, and a
 * published quiz attached as the module's exercise.
 *
 * Built over the API rather than clicked. Every step here is already covered by
 * the API-level verification, and driving the whole quiz-authoring chain through
 * the UI in this spec would add minutes and brittleness without testing anything
 * the studio's own quiz specs would not.
 */
const seedSubmittableCourse = async (request: APIRequestContext, token: string, title: string) => {
  const auth = { Authorization: `Bearer ${token}` };
  const json = async (response: Awaited<ReturnType<APIRequestContext["post"]>>) => {
    expect(response.ok(), `${response.url()} → ${response.status()}`).toBe(true);
    return response.json();
  };

  const course = await json(
    await request.post(`${GATEWAY}/learning/catalog/courses`, {
      headers: auth,
      data: {
        slug: `gate-review-${Date.now()}`,
        title,
        summary: "Authored for the review gate.",
        prices: [],
        creatorRevenueShareBps: 0,
      },
    }),
  );

  const courseModule = await json(
    await request.post(`${GATEWAY}/learning/catalog/courses/${course.id}/modules`, {
      headers: auth,
      data: { title: "Module 1", summary: "", position: 0 },
    }),
  );

  await json(
    await request.post(`${GATEWAY}/learning/catalog/modules/${courseModule.id}/lessons`, {
      headers: auth,
      data: {
        moduleId: courseModule.id,
        kind: "text",
        title: "Lesson 1",
        body: "hello",
        position: 0,
      },
    }),
  );

  const quiz = await json(
    await request.post(`${GATEWAY}/learning/assessment/quizzes`, {
      headers: auth,
      data: { title: "Exercise", description: "", passThresholdPercent: 50, maxAttempts: 0 },
    }),
  );

  // Options are (id, text) pairs and `correct` names option ids, not indices.
  await json(
    await request.post(`${GATEWAY}/learning/assessment/quizzes/${quiz.id}/questions`, {
      headers: auth,
      data: {
        kind: "mcq",
        prompt: "2 + 2?",
        points: 1,
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
        ],
        correct: ["b"],
      },
    }),
  );

  await json(
    await request.post(`${GATEWAY}/learning/assessment/quizzes/${quiz.id}/publish`, {
      headers: auth,
    }),
  );

  // A draft quiz would build a module no learner could ever complete, which is
  // why the picker offers published ones only.
  await json(
    await request.patch(`${GATEWAY}/learning/catalog/modules/${courseModule.id}`, {
      headers: auth,
      data: { exerciseId: quiz.id },
    }),
  );

  return course.id as string;
};

test.describe("Review workflow — creator side", () => {
  test("a creator submits a course and watches it in the queue", async ({ page, request }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await register(request, creator);
    const token = await tokenFor(request, creator);

    const title = `Gate Review ${Date.now()}`;
    const courseId = await seedSubmittableCourse(request, token, title);

    await signIn(page, creator);
    await page.goto(`/courses/${courseId}`);

    await expect(page.getByRole("heading", { name: title }).first()).toBeVisible({
      timeout: 30_000,
    });

    // The assertion that would have caught the bypass: the creator is offered
    // review, not publication. There is no publish endpoint behind a publish
    // button any more, so offering one would promise something impossible.
    await expect(page.getByRole("button", { name: /submit for review/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^publish$/i })).toHaveCount(0);

    await page.getByRole("button", { name: /submit for review/i }).click();

    // The builder switches to the in-review state: withdraw replaces submit.
    await expect(page.getByRole("button", { name: /withdraw/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/with the platform review team/i)).toBeVisible();

    // And the status page agrees, from its own read.
    await page.goto("/review");
    await expect(page.getByRole("heading", { name: /review status/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/waiting on a reviewer/i)).toBeVisible();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 30_000 });

    // Withdrawing is the creator changing their mind — distinct from a
    // rejection, which carries a reason and comes from somebody else.
    await page
      .getByRole("button", { name: /withdraw/i })
      .first()
      .click();
    await expect(page.getByText(/nothing submitted right now/i)).toBeVisible({ timeout: 30_000 });

    expect(pageErrors, `uncaught errors: ${pageErrors.join(" | ")}`).toEqual([]);
  });
});
