import type { Metadata } from "next";

import {
  TeamsBilling,
  TeamsCta,
  TeamsFeatures,
  TeamsHero,
  TeamsSteps,
} from "@/components/marketing/for-teams";

export const metadata: Metadata = {
  title: "For Teams & Schools",
  description:
    "Onboard your organization, assign courses, track real progress and pay only for what you assign — Datarango for teams and schools.",
};

export default function ForTeamsPage() {
  return (
    <main>
      <TeamsHero />
      <TeamsFeatures />
      <TeamsSteps />
      <TeamsBilling />
      <TeamsCta />
    </main>
  );
}
