import type { AccentToken } from "@datarango/ui";

/**
 * Marketing imagery and social proof.
 *
 * Photos are free Unsplash stock (credits in
 * `apps/web/public/assets/marketing/CREDITS.md`) until we have photos of real
 * Datarango learners — swap them here. Instructors and testimonials must be
 * real people who agreed to appear; those lists stay empty (and their
 * sections hidden) until then. Nothing here is ever invented.
 */

export interface Photo {
  src: string;
  /** What the photo shows, for screen readers. */
  alt: string;
}

export interface HeroPhoto extends Photo {
  accent: AccentToken;
}

export interface Instructor {
  name: string;
  role: string;
  photo: string;
  courseCount: number;
  accent: AccentToken;
}

export interface Testimonial {
  quote: string;
  name: string;
  /** Role and company, e.g. "Data Analyst, Paystack". */
  role: string;
  photo?: string;
}

const img = (file: string) => `/assets/marketing/${file}`;

/** The hero's five staggered cards, left to right. */
export const HERO_PHOTOS: HeroPhoto[] = [
  {
    src: img("student-campus.jpg"),
    alt: "A smiling student with a backpack and notes outside a campus building",
    accent: "amber",
  },
  {
    src: img("learner-laptop.jpg"),
    alt: "A woman with long braids working on a laptop by a window",
    accent: "violet",
  },
  {
    src: img("analyst-tablet.jpg"),
    alt: "A woman with a tablet in a corridor beside a server room",
    accent: "sky",
  },
  {
    src: img("professional-laptop.jpg"),
    alt: "A woman smiling behind her laptop, surrounded by plants",
    accent: "lime",
  },
  {
    src: img("graduate.jpg"),
    alt: "A graduate in cap and gown smiling over her shoulder",
    accent: "rose",
  },
];

/** Photos for the value-proposition rows and the teams section. */
export const PHOTOS = {
  coding: {
    src: img("developer-coding.jpg"),
    alt: "A developer in headphones writing code at a desk",
  },
  studying: {
    src: img("learner-notes.jpg"),
    alt: "A woman reviewing her notes at a desk with a laptop",
  },
  analyst: {
    src: img("analyst-tablet.jpg"),
    alt: "A woman with a tablet in a corridor beside a server room",
  },
  earning: {
    src: img("learner-smiling.jpg"),
    alt: "A woman smiling at her desk with a laptop and open notebook",
  },
  team: {
    src: img("team-table.jpg"),
    alt: "A team gathered round a table working through plans together",
  },
} satisfies Record<string, Photo>;

export const INSTRUCTORS: Instructor[] = [];

export const TESTIMONIALS: Testimonial[] = [];
