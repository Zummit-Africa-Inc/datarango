"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ACCENT_CLASSES,
  Button,
  ButtonArrow,
  Circle,
  FadeIn,
  HalfMoon,
  Ring,
  Sparkle,
  Stagger,
  StaggerItem,
  cn,
} from "@datarango/ui";

import { HERO_PHOTOS } from "@/content/marketing";

// Staggered heights for the card row: middle card highest.
const OFFSETS = ["lg:mt-12", "lg:mt-4", "lg:mt-0", "lg:mt-4", "lg:mt-12"];

/**
 * Landing hero (§7.1): centred proof pill, one-colour two-line headline,
 * subhead, pill CTA, then a staggered row of five photo cards framed in
 * accent colours (`HERO_PHOTOS`).
 */
export const Hero = ({ courseCount }: { courseCount: number | null }) => (
  <section className="relative overflow-hidden">
    <Circle
      accent="amber"
      className="absolute -top-16 -left-20 hidden opacity-70 md:block"
      size={220}
    />
    <Ring accent="violet" className="absolute top-24 -right-10 hidden md:block" size={140} />
    <div className="container mx-auto px-4 pt-14 pb-20 text-center lg:px-8 lg:pt-20 lg:pb-28">
      <FadeIn>
        <p className="border-border bg-card text-foreground-muted mx-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm">
          <Sparkle accent="primary" size={14} tone="solid" />
          {courseCount
            ? `${courseCount.toLocaleString()} ${courseCount === 1 ? "course" : "courses"} to start today, free to join`
            : "Free to join, no card needed"}
        </p>
        <h1 className="font-display text-foreground mx-auto mt-6 max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          Learn data skills
          <br />
          by doing the work.
        </h1>
        <p className="text-foreground-muted mx-auto mt-6 max-w-xl text-lg leading-relaxed">
          Courses with graded notebook exercises, hosted datasets and live competitions. One account
          for you, one console for your team.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Button asChild shape="pill" size="lg">
            <Link href="/signup">
              Start learning free
              <ButtonArrow />
            </Link>
          </Button>
          <Link
            className="text-foreground text-base font-medium underline-offset-4 hover:underline"
            href="/for-teams"
          >
            Datarango for teams
          </Link>
        </div>
      </FadeIn>

      <Stagger className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {HERO_PHOTOS.slice(0, 5).map((photo, index) => (
          <StaggerItem
            className={cn(
              "relative",
              OFFSETS[index],
              index === 3 && "sm:hidden lg:block",
              index === 4 && "hidden lg:block",
            )}
            key={photo.src}
          >
            {index % 2 === 0 ? (
              <Circle accent={photo.accent} className="absolute -top-5 -left-5 -z-10" size={90} />
            ) : (
              <HalfMoon
                accent={photo.accent}
                className="absolute -right-5 -bottom-5 -z-10"
                size={90}
              />
            )}
            <div
              className={cn(
                "relative aspect-3/4 overflow-hidden rounded-3xl p-2",
                ACCENT_CLASSES[photo.accent].soft,
              )}
            >
              <div className="relative h-full overflow-hidden rounded-2xl">
                <Image
                  alt={photo.alt}
                  className="object-cover"
                  fill
                  priority={index < 3}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  src={photo.src}
                />
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  </section>
);
