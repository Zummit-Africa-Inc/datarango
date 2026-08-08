"use client";

import Image, { type StaticImageData } from "next/image";

import courses from "../../assets/notion/images-1.avif";
import leaderboard from "../../assets/notion/images-2.avif";
import teaching from "../../assets/notion/images-3.avif";
import learning from "../../assets/notion/images-4.avif";
import progress from "../../assets/notion/images-5.avif";
import work from "../../assets/notion/images-6.avif";
import handson from "../../assets/notion/images-7.avif";
import teamwork from "../../assets/notion/images-8.avif";
import competition from "../../assets/notion/images-9.avif";
import earn from "../../assets/notion/images-10.avif";
import laptop from "../../assets/notion/images-11.png";
import focused from "../../assets/notion/images-12.png";
import users from "../../assets/notion/images-13.png";
import trophy from "../../assets/notion/images-14.png";
import notebook from "../../assets/notion/images-15.png";
import policy from "../../assets/notion/images-16.png";

import { cn } from "../../lib";

export type IllustrationName =
  | "competition"
  | "courses"
  | "earn"
  |"focused"
  | "handson"
  | "laptop"
  | "leaderboard"
  | "learning"
  | "notebook"
  | "policy"
  | "progress"
  | "teaching"
  | "teamwork"
  | "trophy"
  | "users"
  | "work";

const ART: Record<IllustrationName, string | StaticImageData> = {
  competition,
  courses,
  earn,
  focused,
  handson,
  laptop,
  leaderboard,
  learning,
  notebook,
  policy,
  progress,
  teaching,
  teamwork,
  trophy,
  users,
  work,
};

interface Props {
  name: IllustrationName;
  className?: string;
  /**
   * Accessible label. Omit for decorative art (the default) — the image is
   * then hidden from assistive tech. Provide text only when the illustration
   * carries meaning not present elsewhere.
   */
  alt?: string;
  priority?: boolean;
}

/**
 * Flat brand illustrations (business / credit / investment / onchain).
 *
 * The source art is drawn to bleed past its viewBox, so it's meant to sit in a
 * clipping container (a card with `overflow-hidden`) and be anchored to an
 * edge. Size and position it from the parent, e.g.:
 *
 *   <div className="relative overflow-hidden rounded-2xl">
 *     <Illustration name="business" className="absolute bottom-0 right-0 w-1/2" />
 *   </div>
 */
export const Illustration = ({ name, className, alt, priority }: Props) => (
  <Image
    src={ART[name]}
    alt={alt ?? ""}
    aria-hidden={alt ? undefined : true}
    priority={priority}
    className={cn("h-auto w-full select-none", className)}
  />
);

export const CompetitionIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="competition" {...props} />
);

export const CoursesIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="courses" {...props} />
);

export const EarnIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="earn" {...props} />
);

export const FocusedIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="focused" {...props} />
);

export const HandsonIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="handson" {...props} />
);

export const LaptopIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="laptop" {...props} />
);

export const LeaderboardIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="leaderboard" {...props} />
);

export const LearningIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="learning" {...props} />
);

export const NotebookIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="notebook" {...props} />
);

export const PolicyIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="policy" {...props} />
);

export const ProgressIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="progress" {...props} />
);

export const TeachingIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="teaching" {...props} />
);

export const TeamworkIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="teamwork" {...props} />
);

export const TrophyIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="trophy" {...props} />
);

export const UsersIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="users" {...props} />
);

export const WorkIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="work" {...props} />
);
