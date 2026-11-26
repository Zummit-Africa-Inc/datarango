import { Hero } from "@/components/marketing/hero";
import { PricingPlans } from "@/components/marketing/pricing";
import {
  CourseShowcase,
  FinalCta,
  Instructors,
  PracticeBand,
  Teams,
  Testimonials,
  WhyTiles,
} from "@/components/marketing/sections";
import { getPublicCatalog } from "@/lib/public-catalog";

// Rendered per request: prerendering at build time would bake in an empty
// catalogue (the gateway isn't reachable from the image build). The catalogue
// fetch itself is cached for five minutes, and a failed fetch isn't cached.
export const dynamic = "force-dynamic";

/**
 * Home (§7.1). Course cards and the course count come from the public
 * catalogue; instructors and testimonials from `content/marketing.ts`. A
 * section with nothing real to show is left out.
 */
export default async function Home() {
  const catalog = await getPublicCatalog(8);

  return (
    <main>
      <Hero courseCount={catalog?.total || null} />
      <WhyTiles />
      {catalog && <CourseShowcase courses={catalog.courses} total={catalog.total} />}
      <PracticeBand />
      <Instructors />
      <Testimonials />
      <Teams />
      <section className="container mx-auto px-4 pt-4 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-foreground text-3xl font-semibold tracking-tight lg:text-5xl">
            Start free, pay when it helps
          </h2>
          <p className="text-foreground-muted mt-4 text-lg">
            Free for individuals, Pro for the whole catalogue, per seat for teams.
          </p>
        </div>
      </section>
      <PricingPlans />
      <FinalCta />
    </main>
  );
}
