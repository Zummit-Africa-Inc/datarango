"use client";

import { BookOpen, CalendarDays, Coins, FileQuestion, Layers, Play, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";

import {
  Button,
  CatalogueCover,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Price,
  Skeleton,
  SteppedProgress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  parsePrices,
  pricingFromPrices,
} from "@datarango/ui";

import { CourseCard } from "@/components/learning/course-card";
import { Discussions } from "@/components/learning/discussions";
import { Overview, useResumeLesson } from "@/components/learning/overview";
import { Resources } from "@/components/learning/resources";
import { Syllabus } from "@/components/learning/syllabus";
import { useCoursePrice, useRedeemCourse, useWalletBalance } from "@/hooks/economy";
import {
  useCourseProgress,
  useCourseTree,
  useDiscoverCourses,
  useEnroll,
  useMyEnrollments,
  type CourseTree,
  type ProgressSnapshot,
} from "@/hooks/learning";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Course detail (§7.5) and, once enrolled, its home (§7.4 rail). */
export default function CourseDetailPage() {
  const courseId = useParams().id as string;
  const { data: tree, isLoading } = useCourseTree(courseId);
  const { data: enrollments } = useMyEnrollments();
  const isEnrolled = (enrollments?.enrollments ?? []).some((e) => e.courseId === courseId);
  const { data: progress } = useCourseProgress(courseId, isEnrolled);

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!tree) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Course not found"
        hint="It may have been unpublished."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/courses">Back to courses</Link>
          </Button>
        }
      />
    );
  }

  const lessonCount = tree.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const exerciseCount = tree.modules.filter((m) => m.exerciseId).length;
  const meta = [
    { icon: Layers, label: `${tree.modules.length} module${tree.modules.length === 1 ? "" : "s"}` },
    { icon: Play, label: `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}` },
    ...(exerciseCount > 0
      ? [
          {
            icon: FileQuestion,
            label: `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`,
          },
        ]
      : []),
    { icon: CalendarDays, label: `Updated ${dateFormat.format(new Date(tree.course.updatedAt))}` },
  ];

  return (
    <div className="space-y-8">
      <header>
        <CatalogueCover
          id={courseId}
          title={tree.course.title}
          imageUrl={tree.course.imageUrl}
          iconTile
        />
        <div className="max-w-3xl">
          <h1 className="font-display text-foreground text-3xl leading-tight font-semibold tracking-tight">
            {tree.course.title}
          </h1>
          {tree.course.summary && (
            <p className="text-foreground-muted mt-2 text-base">{tree.course.summary}</p>
          )}
          <ul className="text-foreground-muted mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs defaultValue="overview" className="min-w-0">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-5">
            <Overview tree={tree} />
          </TabsContent>
          <TabsContent value="curriculum" className="pt-5">
            <Syllabus
              courseId={courseId}
              isEnrolled={isEnrolled}
              lessonCount={lessonCount}
              progress={progress}
              tree={tree}
            />
          </TabsContent>
          <TabsContent value="resources" className="pt-5">
            <Resources />
          </TabsContent>
          <TabsContent value="discussion" className="pt-5">
            <Discussions />
          </TabsContent>
        </Tabs>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          {isEnrolled ? (
            <StudyCard courseId={courseId} tree={tree} progress={progress} />
          ) : (
            <PurchaseCard courseId={courseId} tree={tree} />
          )}
        </aside>
      </div>

      <RelatedCourses courseId={courseId} />
    </div>
  );
}

const STUDY_MESSAGES = [
  { below: 1, text: "Ready when you are. The first lesson is a short one." },
  { below: 25, text: "A good start. Little and often beats a long session." },
  { below: 50, text: "You're finding your rhythm. Keep going." },
  { below: 75, text: "Past halfway. The hard part is behind you." },
  { below: 100, text: "Nearly there. One more push." },
];

/** Enrolled rail (§7.4): stepped progress, an encouraging line and Continue. */
const StudyCard = ({
  courseId,
  tree,
  progress,
}: {
  courseId: string;
  tree: CourseTree;
  progress: ProgressSnapshot | undefined;
}) => {
  const resume = useResumeLesson(tree, progress);
  const percent = progress?.percentComplete ?? 0;
  const done = progress?.completed ?? false;
  const message = done
    ? "Course complete. Your certificate is waiting."
    : (STUDY_MESSAGES.find((m) => percent < m.below)?.text ?? STUDY_MESSAGES[0]!.text);

  return (
    <section className="border-border bg-card space-y-4 rounded-lg border p-5">
      <h2 className="font-display text-foreground font-semibold">Study progress</h2>
      <SteppedProgress value={done ? 100 : percent} label={`${percent}% complete`} />
      <p className="text-foreground-muted text-sm">{message}</p>
      {resume && (
        <div className="bg-muted/60 rounded-md p-3">
          <p className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
            {done ? "Revisit" : percent > 0 ? "Up next" : "Start with"}
          </p>
          <p className="text-foreground mt-0.5 truncate text-sm font-medium">{resume.title}</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {resume && (
          <Button asChild size="lg">
            <Link href={`/dashboard/courses/${courseId}/lessons/${resume.id}`}>
              <Play className="size-4" />
              {done ? "Open course" : percent > 0 ? "Continue learning" : "Start learning"}
            </Link>
          </Button>
        )}
        {done && (
          <Button asChild variant="outline">
            <Link href="/dashboard/certificates">View certificate</Link>
          </Button>
        )}
      </div>
    </section>
  );
};

/**
 * Not-enrolled rail (§6.4). Free → enrol. A token price → unlock with tokens,
 * confirmed first because it spends the learner's balance. A money price alone
 * → shown, but there is no checkout yet, so nothing pretends to sell it.
 */
const PurchaseCard = ({ courseId, tree }: { courseId: string; tree: CourseTree }) => {
  const prices = parsePrices(tree.course.pricesJson);
  const pricing = prices ? pricingFromPrices(prices) : null;
  const { data: tokenPrice } = useCoursePrice(courseId);
  const tokens = tokenPrice?.price?.enabled ? tokenPrice.price.tokenPrice : undefined;
  const enroll = useEnroll(courseId);

  // Free wins over a token price: the server enrols a free course without an entitlement.
  const isFree = pricing?.kind === "free";
  const lessonCount = tree.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <section className="border-border bg-card space-y-4 rounded-lg border p-5 shadow-sm">
      {pricing ? (
        <Price
          size="detail"
          pricing={pricing.kind === "paid" ? { ...pricing, tokenPrice: tokens } : pricing}
        />
      ) : tokens !== undefined ? (
        <p className="font-display text-foreground flex items-center gap-2 text-3xl font-semibold">
          <Coins aria-hidden="true" className="text-amber-soft-foreground size-7" />
          {tokens.toLocaleString("en-GB")} tokens
        </p>
      ) : null}

      {isFree ? (
        <Button
          size="lg"
          className="w-full"
          disabled={enroll.isPending}
          onClick={() => enroll.mutate()}
        >
          {enroll.isPending ? "Enrolling…" : "Start for free"}
        </Button>
      ) : tokens !== undefined ? (
        <UnlockWithTokens courseId={courseId} title={tree.course.title} tokens={tokens} />
      ) : (
        <p className="text-foreground-muted bg-muted/60 rounded-md p-3 text-sm">
          Card payments aren&apos;t available yet. This course will open for purchase when checkout
          launches.
        </p>
      )}

      <ul className="text-foreground-muted border-border space-y-2 border-t pt-4 text-sm">
        <li className="flex items-center gap-2">
          <Layers aria-hidden="true" className="size-4" />
          {tree.modules.length} module{tree.modules.length === 1 ? "" : "s"}, {lessonCount} lesson
          {lessonCount === 1 ? "" : "s"}
        </li>
        <li className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4" />
          Certificate on completion
        </li>
      </ul>
    </section>
  );
};

const UnlockWithTokens = ({
  courseId,
  title,
  tokens,
}: {
  courseId: string;
  title: string;
  tokens: number;
}) => {
  const [open, setOpen] = useState(false);
  const { data: wallet } = useWalletBalance();
  const redeem = useRedeemCourse();
  const balance = wallet?.balance ?? 0;
  const short = balance < tokens;

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)} disabled={!wallet}>
        <Coins className="size-4" />
        Unlock for {tokens.toLocaleString("en-GB")} tokens
      </Button>
      {wallet && short && (
        <p className="text-foreground-muted text-xs">
          You have {balance.toLocaleString("en-GB")} tokens. Earn more by passing quizzes and
          exercises.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock {title}?</DialogTitle>
            <DialogDescription>
              {short
                ? `This course costs ${tokens.toLocaleString("en-GB")} tokens and you have ${balance.toLocaleString("en-GB")}.`
                : `${tokens.toLocaleString("en-GB")} tokens will be taken from your balance of ${balance.toLocaleString("en-GB")}, leaving ${(balance - tokens).toLocaleString("en-GB")}. If the unlock fails, the tokens are returned.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={short || redeem.isPending}
              onClick={() => redeem.mutate({ courseId }, { onSuccess: () => setOpen(false) })}
            >
              {redeem.isPending ? "Unlocking…" : "Unlock course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const RelatedCourses = ({ courseId }: { courseId: string }) => {
  const { data } = useDiscoverCourses({ pageSize: 8 });
  const { data: enrollments } = useMyEnrollments();
  const enrolled = useMemo(
    () => new Set((enrollments?.enrollments ?? []).map((e) => e.courseId)),
    [enrollments],
  );
  const related = (data?.courses ?? []).filter((c) => c.id !== courseId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-display text-foreground text-xl font-semibold">More courses</h2>
      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {related.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} enrolled={enrolled.has(course.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
};
