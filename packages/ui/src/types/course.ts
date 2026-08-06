export type LessonKind = "video" | "text" | "audio" | "notebook_exercise" | "quiz";

export type CourseStatus = "draft" | "pending_review" | "published" | "archived";

export interface CoursePrice {
  tokens?: number;
  fiat?: { amount: number; currency: string };
}

export interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  position: number;
  durationSeconds?: number;
  refId?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  position: number;
  exerciseRefKind?: "quiz" | "notebook_exercise";
  exerciseRefId?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string;
  status: CourseStatus;
  creatorId: string;
  price: CoursePrice;
  publishedVersionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseVersionId: string;
  currentModuleTitle?: string;
  source: "purchase" | "token" | "org_assignment" | "free";
  grantedByOrgId?: string;
  progress: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface LessonProgress {
  lessonId: string;
  completedAt?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  verificationUrl: string;
}
