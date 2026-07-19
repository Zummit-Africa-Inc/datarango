import { faker } from "@faker-js/faker";

import { Course } from "@datarango/ui";

export const MOCK_COURSES: Course[] = Array.from({ length: 22 }, () => ({
  createdAt: faker.date.past(),
  creatorId: faker.string.uuid(),
  description: faker.lorem.paragraphs(3),
  id: faker.string.uuid(),
  image: faker.image.url({ height: 400, width: 600 }),
  title: faker.book.title(),
  progressPercent: Math.floor(Math.random() * 100),
  price: {
    fiat: { amount: faker.number.float({ min: 10, max: 1000 }), currency: "USD" },
    tokens: faker.number.int({ min: 10, max: 1000 }),
  },
  slug: "",
  status: "published",
  updatedAt: faker.date.recent(),
  coverUrl: faker.image.url({ height: 400, width: 600 }),
  publishedVersionId: "v1",
}));
