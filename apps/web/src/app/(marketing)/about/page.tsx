import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ACCENT_CLASSES,
  Button,
  ButtonArrow,
  FadeIn,
  Stagger,
  StaggerItem,
  cn,
  type AccentToken,
} from "@datarango/ui";

import { JoinBand } from "@/components/marketing/feature-preview";
import { PageHero } from "@/components/marketing/page-hero";
import { PHOTOS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "About",
  description:
    "Datarango exists to make practical data and AI skills reachable for anyone with curiosity and a browser.",
};

const VALUES: { title: string; body: string; accent: AccentToken }[] = [
  {
    title: "Doing beats watching",
    body: "Nobody learns data science from videos alone. Every course ends its modules with graded, hands-on exercises, because the skill is in the doing.",
    accent: "violet",
  },
  {
    title: "Proof over promises",
    body: "Certificates verify publicly. Leaderboards are earned. Progress reports reflect real work, not time-on-page.",
    accent: "amber",
  },
  {
    title: "Your learning is yours",
    body: "Courses granted to you stay yours, even if the organization that paid for them moves on. Notebooks, wallet, history: yours.",
    accent: "teal",
  },
  {
    title: "Built for our market",
    body: "African learners, schools and companies are our first audience, from pricing in naira to competitions on local datasets.",
    accent: "rose",
  },
];

const COLLAGE = [PHOTOS.campus, PHOTOS.colleagues, PHOTOS.graduate, PHOTOS.laptop];

export default function AboutPage() {
  return (
    <main>
      <PageHero
        accent="amber"
        actions={
          <Button asChild shape="pill" size="lg">
            <Link href="/signup">
              Start learning free
              <ButtonArrow />
            </Link>
          </Button>
        }
        eyebrow="About Datarango"
        lede="The gap between watching tutorials and doing real data work is where most learners give up. We close it with real notebooks, graded exercises, and competition that keeps you honest."
        photo={PHOTOS.pair}
        title="Practical data skills, within reach"
      />

      <section className="container mx-auto grid items-center gap-14 px-4 pb-24 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <FadeIn className="grid grid-cols-2 gap-4">
          {COLLAGE.map((photo, index) => (
            <div
              className={cn(
                "relative aspect-4/5 overflow-hidden rounded-2xl",
                index % 2 === 1 && "mt-10",
              )}
              key={photo.src}
            >
              <Image
                alt={photo.alt}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 22vw, 50vw"
                src={photo.src}
              />
            </div>
          ))}
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight lg:text-5xl">
            The story so far
          </h2>
          <div className="text-foreground-muted mt-6 space-y-4 text-lg leading-relaxed">
            <p>
              We started Datarango after watching too many capable people stall between &ldquo;I
              finished the course&rdquo; and &ldquo;I can do the job.&rdquo; The missing piece was
              never more content. It was a place where writing real code against real data is the
              default, not the capstone.
            </p>
            <p>
              So we built one platform around that idea: courses whose modules you can&apos;t finish
              without passing a hands-on exercise, notebooks that live in your browser and remember
              where you stopped, datasets you mount instead of download, and competitions that turn
              practice into a sport.
            </p>
            <p>
              Today Datarango serves individual learners and the teams and schools that train them:
              same platform, same account, one honest measure of progress.
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="container mx-auto px-4 pb-24 lg:px-8 lg:pb-32">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight lg:text-5xl">
            What we hold ourselves to
          </h2>
        </FadeIn>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
          {VALUES.map((value) => (
            <StaggerItem
              className={cn("rounded-2xl p-7", ACCENT_CLASSES[value.accent].soft)}
              key={value.title}
            >
              <h3 className="font-display text-xl font-semibold">{value.title}</h3>
              <p className="mt-3 leading-relaxed opacity-85">{value.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <JoinBand />
    </main>
  );
}
