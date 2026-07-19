import type { Metadata } from "next";
import Image from "next/image";

import { FadeIn, Stagger, StaggerItem } from "@datarango/ui";
import { PageIntro } from "@/components/marketing/page-intro";
import { FinalCta } from "@/components/marketing/sections";
import { Gif } from "@/components/marketing/gif";

export const metadata: Metadata = {
  title: "About",
  description:
    "Datarango exists to make practical data and AI skills reachable for anyone with curiosity and a browser.",
};

const VALUES = [
  {
    title: "Doing beats watching",
    body: "Nobody learns data science from videos alone. Every course ends its modules with graded, hands-on exercises — because the skill is in the doing.",
  },
  {
    title: "Proof over promises",
    body: "Certificates verify publicly. Leaderboards are earned. Progress reports reflect real work, not time-on-page.",
  },
  {
    title: "Your learning is yours",
    body: "Courses granted to you stay yours — even if the organization that paid for them moves on. Notebooks, wallet, history: yours.",
  },
  {
    title: "Built for our market",
    body: "African learners, schools and companies are our first audience — from pricing in naira to competitions on local datasets.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <PageIntro
        eyebrow="About Datarango"
        title={
          <>
            Practical AI skills, <span className="text-primary-500">within reach</span>
          </>
        }
        lede="Datarango exists because the gap between watching tutorials and doing real data work is where most learners give up. We close that gap with real notebooks, graded exercises, and competition that keeps you honest."
      />
      <section className="container mx-auto grid items-center gap-16 px-4 pb-24 lg:grid-cols-2 lg:px-8">
        <FadeIn className="relative aspect-5/3">
          <Gif title="architect" />
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="font-heading text-3xl tracking-tight lg:text-5xl">The story so far</h2>
          <div className="text-muted-foreground mt-6 space-y-4 leading-relaxed">
            <p>
              We started Datarango after watching too many capable people stall between “I finished
              the course” and “I can do the job.” The missing piece was never more content — it was
              an environment where writing real code against real data is the default, not the
              capstone.
            </p>
            <p>
              So we built one platform around that idea: courses whose modules you cannot complete
              without passing a hands-on exercise, notebooks that live in your browser and remember
              where you stopped, datasets you can mount instead of download, and competitions that
              turn practice into a sport.
            </p>
            <p>
              Today Datarango serves individual learners and the teams and schools that train them —
              same platform, same account, one honest measure of progress.
            </p>
          </div>
        </FadeIn>
      </section>
      <section className="border-border/60 border-y">
        <div className="container mx-auto px-4 py-24 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl tracking-tight lg:text-5xl">
              What we hold ourselves to
            </h2>
          </FadeIn>
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value) => (
              <StaggerItem
                className="border-border bg-card rounded-xs border p-8"
                key={value.title}
              >
                <h3 className="font-heading text-xl">{value.title}</h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">{value.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      <FinalCta />
    </main>
  );
}
