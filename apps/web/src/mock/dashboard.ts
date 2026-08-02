import type { ChartWidget, Course, Enrollment } from "@datarango/ui";
import { faker } from "@faker-js/faker";

/** Placeholder data until the gateway ships (backend Phases 1–2). */

export const LEARNER_STATS = [
  { label: "Day streak", value: "14", delta: "+2", description: "vs last week" },
  { label: "Total XP", value: "2,450", delta: "+180", description: "this week" },
  { label: "Token balance", value: "380 DRG", description: "≈ 2 course redemptions" },
  { label: "Certificates", value: "3", description: "1 pending review" },
];

export const ACTIVITY_WIDGET: ChartWidget = {
  id: "activity",
  name: "Learning activity",
  type: "data",
  dataType: "chart",
  chartType: "area",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    series: [
      { name: "XP", data: [0, 0, 0, 0, 0, 0, 0] },
      { name: "Minutes", data: [0, 0, 0, 0, 0, 0, 0] },
    ],
  },
};

export const QUIZ_WIDGET: ChartWidget = {
  id: "quiz-scores",
  name: "Recent quiz scores",
  type: "data",
  dataType: "chart",
  chartType: "bar",
  data: {
    labels: ["Pandas I", "SQL Joins", "Viz 101", "ML Intro", "Stats II"],
    series: [{ name: "Score", data: [0, 0, 0, 0, 0] }],
  },
};

export const COURSES: Course[] = Array.from({ length: 20 }, () => {
  const amount = faker.number.int();
  const tokens = amount * 100;
  const price = faker.commerce.price({ symbol: "USD" });
  console.log({ price });

  return {
    createdAt: faker.date.past(),
    creatorId: faker.string.uuid(),
    description: faker.lorem.paragraphs({ min: 1, max: 2 }),
    id: faker.string.uuid(),
    price: { fiat: { amount, currency: "USD" }, tokens },
    slug: faker.lorem.slug(),
    status: "published",
    title: faker.system.commonFileName(),
    updatedAt: faker.date.recent(),
    coverUrl: faker.image.urlPicsumPhotos({ height: 300, width: 200 }),
    publishedVersionId: faker.system.semver(),
  };
});

export const CONTINUE_LEARNING: Enrollment[] = Array.from({ length: 3 }, (_, index) => {
  const course = COURSES[index]!;

  return {
    courseId: course.id,
    courseTitle: course.title,
    courseVersionId: course.publishedVersionId!,
    currentModuleTitle: faker.lorem.lines(2),
    completedAt: index === 0 ? faker.date.recent() : undefined,
    progress: faker.number.int({ min: 0, max: 100 }),
    source: "purchase",
    createdAt: faker.date.recent(),
    id: faker.string.uuid(),
    course: {
      id: course.id,
      title: course.title,
      module: faker.word.preposition(),
      source: "purchase",
      progressPercent: faker.number.int({ min: 0, max: 100 }),
    },
    userId: faker.string.uuid(),
    grantedByOrgId: faker.string.uuid(),
  }
});
