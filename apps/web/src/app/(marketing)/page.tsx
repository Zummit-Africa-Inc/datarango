import {
  Features,
  FinalCta,
  Showcase,
  StatsBand,
  Teams,
  Testimonials,
  ToolStrip,
} from "@/components/marketing/sections";
import { Hero } from "@/components/marketing/hero";

export default function Home() {
  return (
    <main>
      <Hero />
      <ToolStrip />
      <Features />
      <Showcase />
      <Teams />
      <StatsBand />
      <Testimonials />
      <FinalCta />
    </main>
  );
}
