export type QuestionKind = "mcq" | "multi_select" | "short_answer" | "code_snippet";

export type AttemptContext = "standalone" | "lesson" | "module_exercise";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  text: string;
  options?: QuestionOption[];
  position: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  attemptLimit?: number;
  timeLimitSeconds?: number;
  passThreshold: number;
  tokenReward?: number;
  creatorId: string;
  createdAt: Date;
}

export interface QuizDetail extends Quiz {
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  context: AttemptContext;
  courseVersionId?: string;
  lessonId?: string;
  moduleId?: string;
  score: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string;
}

export interface NotebookExercise {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  gradingMode: "auto" | "manual" | "hybrid";
  tokenReward?: number;
  creatorId: string;
  createdAt: Date;
}

export interface NotebookSubmission {
  id: string;
  exerciseId: string;
  userId: string;
  context: AttemptContext;
  courseVersionId?: string;
  status: "pending" | "grading" | "graded" | "needs_review";
  score?: number;
  passed?: boolean;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}
