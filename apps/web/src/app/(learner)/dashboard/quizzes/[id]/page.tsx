"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { QuizRunner } from "@/components/learning/quiz-runner";

/**
 * A quiz taken from the library — the **standalone** attempt context.
 *
 * There is deliberately no way to reach a course-bound attempt from here. The
 * same quiz definition can be a module's end-of-module exercise, and a pass
 * taken standalone advances nothing (handoff §5.2: certificates and org
 * reporting must reflect work done *in the course*). The runner says so before
 * submission as well as after, so the learner is never told afterwards that the
 * attempt they just spent twenty minutes on didn't count.
 */
export default function QuizPage() {
  const quizId = useParams().id as string;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/dashboard/quizzes"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All quizzes
      </Link>

      <QuizRunner quizId={quizId} context="standalone" />
    </div>
  );
}
