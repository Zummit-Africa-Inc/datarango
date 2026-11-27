import { Award, ClipboardCheck, Layers, NotebookPen, PlayCircle, Route } from "lucide-react";
import type { Metadata } from "next";

import { ProductPage } from "@/components/marketing/feature-preview";
import { PHOTOS } from "@/content/marketing";

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
    <ProductPage
      accent="violet"
      appHref="/dashboard/courses"
      eyebrow="Courses"
      lede="Structured learning in data analytics, AI and ML, from our team and invited creators. Every module ends with an exercise you have to pass."
      overlay={
        <>
          <p className="text-foreground-muted text-xs">Module 2 of 6</p>
          <p className="mt-1 text-sm font-semibold">Cleaning messy data</p>
          <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full w-2/3 rounded-full" />
          </div>
          <p className="text-foreground-muted mt-2 text-xs">Exercise next: handle missing values</p>
        </>
      }
      photo={PHOTOS.lecture}
      points={POINTS}
      story={{
        eyebrow: "In practice",
        title: "Learn it, then prove it",
        body: "Lessons mix video, text and audio with notebook exercises. You move on by passing the graded exercise, so finishing a course means you can do the work.",
        bullets: [
          "Graded exercises gate every module",
          "Certificates anyone can verify",
          "A pinned course version, so nothing shifts under you",
        ],
        photo: PHOTOS.studying,
      }}
      title="Courses that make you do the work"
    />
  );
}
