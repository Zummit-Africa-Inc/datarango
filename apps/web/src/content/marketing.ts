import type { AccentToken } from "@datarango/ui";

/**
 * Marketing content that has to be real: photos of actual learners and
 * instructors, and quotes people actually gave (with their consent).
 *
 * Every list starts empty. The home page shows accent tiles in place of hero
 * photos and leaves the Instructors and Testimonials sections out until there
 * is something true to put in them — nothing here is ever invented.
 *
 * Images go in `apps/web/public/assets/marketing/` and are referenced by their
 * public path (e.g. "/assets/marketing/ada.jpg").
 */

export interface HeroPhoto {
  src: string;
  /** Describe the person and what they're doing, for screen readers. */
  alt: string;
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

/** Up to five; the hero fills any empty places with feature tiles. */
export const HERO_PHOTOS: HeroPhoto[] = [];

export const INSTRUCTORS: Instructor[] = [];

export const TESTIMONIALS: Testimonial[] = [];
