import type { Metadata } from "next";

import {
  CreatorsCta,
  CreatorsEarnings,
  CreatorsFeatures,
  CreatorsHero,
  CreatorsSteps,
} from "@/components/marketing/for-creators";

export const metadata: Metadata = {
  title: "For Creators",
  description:
    "Publish courses, quizzes and notebook exercises on Datarango Studio. Set your own prices, reward learners with tokens, and reach thousands of data practitioners.",
};

export default function ForCreatorsPage() {
  return (
    <main>
      <CreatorsHero />
      <CreatorsFeatures />
      <CreatorsSteps />
      <CreatorsEarnings />
      <CreatorsCta />
    </main>
  );
}
