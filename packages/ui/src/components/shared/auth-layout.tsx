"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Blocks,
  Building2,
  ChartNoAxesColumn,
  FileCheck2,
  KeyRound,
  NotebookPen,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ACCENT_CLASSES, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";
import { Logo } from "./logo";
import { Blob, DotGrid, Ring, Sparkle, type ShapeAccent } from "./shapes";
import { ThemeToggle } from "./theme";

/** Who a sign-in page is for. Each app has its own (§7.7). */
export type AuthAudience = "learner" | "creator" | "org" | "admin";

export interface AuthAsidePoint {
  icon: LucideIcon;
  label: string;
}

export interface AuthAsideContent {
  /** Small label above the headline, e.g. the app name. */
  kicker: string;
  headline: string;
  points: AuthAsidePoint[];
  /** Accent for the panel; `band` is the dark surface (admin). */
  accent: AccentToken | "band";
  /**
   * A real photograph for the panel (§7.7). Optional because we don't have
   * licensed photography yet; without one the panel shows the points on the
   * accent tile instead. Never pass a stock image of a made-up "learner".
   */
  photo?: { src: string; alt: string };
  /** A real, attributable quote. Rendered only when given. */
  testimonial?: { quote: string; name: string; role: string; avatarSrc?: string };
}

/**
 * Default panel copy per audience. Every point describes something the
 * product does today; keep it that way when editing.
 */
export const AUTH_ASIDE: Record<AuthAudience, AuthAsideContent> = {
  learner: {
    kicker: "Datarango",
    headline: "Learn data skills by doing them.",
    accent: "amber",
    points: [
      { icon: NotebookPen, label: "Courses with hands-on notebook exercises" },
      { icon: BadgeCheck, label: "Certificates anyone can verify" },
      { icon: Trophy, label: "Competitions on real datasets" },
    ],
  },
  creator: {
    kicker: "Datarango Studio",
    headline: "Build courses people finish.",
    accent: "violet",
    points: [
      { icon: Blocks, label: "A step-by-step builder that saves as you go" },
      { icon: NotebookPen, label: "Notebook exercises graded automatically" },
      { icon: FileCheck2, label: "Reviewed before it goes live" },
    ],
  },
  org: {
    kicker: "Datarango for teams",
    headline: "Train your team on real data work.",
    accent: "teal",
    points: [
      { icon: Users, label: "Assign courses and follow progress" },
      { icon: KeyRound, label: "Single sign-on with your identity provider" },
      { icon: ChartNoAxesColumn, label: "Seats and invoices in one place" },
    ],
  },
  admin: {
    kicker: "Datarango Admin",
    headline: "Platform operations.",
    accent: "band",
    points: [
      { icon: ShieldCheck, label: "Platform staff only" },
      { icon: Building2, label: "Users, organisations and moderation" },
      { icon: KeyRound, label: "Passwordless sign-in with Trustaige" },
    ],
  },
};

const AuthAside = ({ content }: { content: AuthAsideContent }) => {
  const band = content.accent === "band";
  const shapeAccent: ShapeAccent = content.accent === "band" ? "primary" : content.accent;

  return (
    <aside
      className={cn(
        "relative hidden overflow-hidden rounded-2xl lg:flex lg:flex-col lg:justify-between",
        band ? "bg-band text-on-band" : ACCENT_CLASSES[content.accent as AccentToken].tile,
      )}
    >
      {/* Shapes peek from the edges; decoration only. */}
      <Blob accent={shapeAccent} className="absolute -top-16 -right-16 opacity-60" size={260} />
      <Ring accent={shapeAccent} className="absolute -bottom-20 -left-20 opacity-50" size={240} />
      <DotGrid
        className={cn("absolute top-10 left-10", band ? "text-on-band/20" : "opacity-30")}
        accent={shapeAccent}
        size={96}
      />

      {content.photo ? (
        <img
          alt={content.photo.alt}
          className="relative m-10 mb-0 aspect-[4/3] w-[calc(100%-5rem)] rounded-xl object-cover"
          src={content.photo.src}
        />
      ) : (
        <div aria-hidden className="relative" />
      )}

      <div className="relative p-10">
        <p
          className={cn(
            "font-mono text-xs tracking-wide uppercase",
            band ? "text-on-band-muted" : "opacity-70",
          )}
        >
          {content.kicker}
        </p>
        <h2 className="font-display mt-3 max-w-md text-4xl leading-[1.05] font-semibold tracking-tight text-balance xl:text-5xl">
          {content.headline}
        </h2>
        <ul className="mt-8 space-y-3">
          {content.points.map(({ icon: Icon, label }) => (
            <li className="flex items-center gap-3 text-[0.9375rem] font-medium" key={label}>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  band ? "bg-band-elevated" : "bg-white/55 dark:bg-black/20",
                )}
              >
                <Icon className="size-4.5" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {content.testimonial && (
          <figure
            className={cn(
              "mt-10 max-w-md rounded-xl p-5",
              band ? "bg-band-elevated" : "bg-white/70 dark:bg-black/25",
            )}
          >
            <Sparkle accent={shapeAccent} className="mb-2" size={18} tone="solid" />
            <blockquote className="text-sm leading-relaxed">
              “{content.testimonial.quote}”
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-2.5 text-xs">
              {content.testimonial.avatarSrc && (
                <img
                  alt=""
                  className="size-7 rounded-full object-cover"
                  src={content.testimonial.avatarSrc}
                />
              )}
              <span>
                <span className="font-semibold">{content.testimonial.name}</span>
                <span className="opacity-70"> · {content.testimonial.role}</span>
              </span>
            </figcaption>
          </figure>
        )}
      </div>
    </aside>
  );
};

export interface AuthSplitLayoutProps {
  children: ReactNode;
  audience: AuthAudience;
  /** Override or extend the panel copy for this page. */
  aside?: Partial<AuthAsideContent>;
  /** Where the logo links to (default "/"). */
  homeHref?: string;
  /** Small print under the form, e.g. legal links. */
  footer?: ReactNode;
}

/**
 * §7.7 auth split screen: the form on one side, an accent panel (photo and
 * testimonial when we have real ones) on the other. The panel hides below
 * `lg`, leaving the form full width.
 */
export const AuthSplitLayout = ({
  children,
  audience,
  aside,
  homeHref = "/",
  footer,
}: AuthSplitLayoutProps) => (
  <div className="bg-background text-foreground grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-4 lg:p-4">
    <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:min-h-0 lg:px-12">
      <header className="flex items-center justify-between">
        <Link aria-label="Datarango home" href={homeHref}>
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      {footer && <footer className="text-muted-foreground text-center text-xs">{footer}</footer>}
    </main>
    <AuthAside content={{ ...AUTH_ASIDE[audience], ...aside }} />
  </div>
);

export interface AuthHeadingProps {
  title: string;
  subtitle?: ReactNode;
  /** A short chip above the title, e.g. "Staff only". */
  badge?: ReactNode;
}

/** Title block used at the top of every auth form. */
export const AuthHeading = ({ title, subtitle, badge }: AuthHeadingProps) => (
  <div className="mb-8">
    {badge && <div className="mb-4">{badge}</div>}
    <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
    {subtitle && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{subtitle}</p>}
  </div>
);
