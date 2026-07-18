import { Award, ClipboardCheck, Layers, NotebookPen, PlayCircle, Route } from "lucide-react";
import type { Metadata } from "next";

import { FeaturePreview } from "@/components/marketing/feature-preview";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Structured courses in data analytics, AI and ML — video, text and audio lessons with graded exercises that gate every module.",
};

const POINTS = [
  {
    icon: PlayCircle,
    title: "Every format that works",
    body: "Video, text and audio lessons, quizzes as lessons, and notebook exercises — mixed by the creator to fit the material.",
  },
  {
    icon: ClipboardCheck,
    title: "Modules you must earn",
    body: "Every module ends with a required graded exercise. You can't tab your way to a certificate here.",
  },
  {
    icon: NotebookPen,
    title: "Notebooks built in",
    body: "Notebook lessons open straight into a live Jupyter session with the course's datasets already mounted.",
  },
  {
    icon: Layers,
    title: "Versioned content",
    body: "You consume a pinned version of each course — creators can keep improving without pulling the rug from under you.",
  },
  {
    icon: Route,
    title: "Beginner to advanced",
    body: "Courses state their prerequisites up front, from no-code beginnings to production ML.",
  },
  {
    icon: Award,
    title: "Certificates that verify",
    body: "Finish everything and you get a certificate with a public verification URL — shareable, checkable, real.",
  },
];

export default function CoursesPage() {
  return (
    <FeaturePreview
      eyebrow="Courses"
      title={
        <>
          Courses that make you <span className="text-primary-500">do the work</span>
        </>
      }
      lede="Structured learning for data analytics, AI and ML — authored by our team and external creators, gated by real graded exercises."
      points={POINTS}
      note="The course catalog opens with the platform launch. Join now and start with notebooks and standalone quizzes on day one."
    />
  );
}
