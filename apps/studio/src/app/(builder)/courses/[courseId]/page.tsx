"use client";

import { ArrowLeft, ArrowRight, Check, CircleAlert, ImageUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import {
  Badge,
  Button,
  CatalogueCover,
  CatalogueThumbnail,
  EmptyState,
  Input,
  Loader,
  Price,
  cn,
  listParam,
  parsePrices,
  pricingFromPrices,
  useListParams,
} from "@datarango/ui";

import { SaveIndicator } from "@/components/builder/save-indicator";
import { CourseCover } from "@/components/course-cover";
import { CourseOverviewEditor } from "@/components/course-overview-editor";
import { CoursePriceEditor } from "@/components/course-price";
import { CourseStatusBadge } from "@/components/course-status-badge";
import { InlineEdit } from "@/components/inline-edit";
import { ModuleCard } from "@/components/module-card";
import { SortableItem, SortableList } from "@/components/sortable";
import {
  useAddModule,
  useCourseTree,
  useRemoveModule,
  useReorderModules,
  useSubmitForReview,
  useUpdateCourse,
  useWithdrawFromReview,
  type CourseTree,
} from "@/hooks/catalog";

const STEPS = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "pricing", label: "Pricing & access" },
  { id: "media", label: "Media" },
  { id: "review", label: "Review & submit" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

/** Course builder in focus mode (§7.6). Every edit saves as it happens. */
export default function CourseBuilderPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CourseBuilder />
    </Suspense>
  );
}

const CourseBuilder = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: tree, isLoading } = useCourseTree(courseId);
  const { params, set } = useListParams({
    step: listParam.oneOf(
      STEPS.map((s) => s.id),
      "overview",
    ),
  });

  if (isLoading) return <Loader />;
  if (!tree) {
    return (
      <EmptyState
        className="m-auto"
        icon={CircleAlert}
        title="Course not found"
        hint="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/courses">Back to courses</Link>
          </Button>
        }
      />
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.id === params.step);
  const step = STEPS[stepIndex]!;
  const nextStep = STEPS[stepIndex + 1];
  const prevStep = STEPS[stepIndex - 1];
  const go = (id: StepId) => set({ step: id });
  const frozen = tree.course.status === "published";

  return (
    <>
      <header className="border-border bg-background shrink-0 border-b">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Button asChild variant="ghost" size="icon" aria-label="Close builder">
            <Link href="/courses">
              <X className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-semibold">{tree.course.title}</p>
            <p className="text-foreground-muted text-xs">
              Step {stepIndex + 1} · {step.label}
            </p>
          </div>
          <div className="hidden sm:block">
            <SaveIndicator />
          </div>
          <CourseStatusBadge status={tree.course.status} />
          {nextStep && (
            <span className="text-foreground-muted hidden text-sm lg:inline">
              Next: {nextStep.label}
            </span>
          )}
          {prevStep && (
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => go(prevStep.id)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          {nextStep && (
            <Button onClick={() => go(nextStep.id)}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
        <nav aria-label="Builder steps" className="flex gap-1 px-4 pb-2 sm:px-6">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={s.id === step.id ? "step" : undefined}
              aria-label={`Step ${i + 1}: ${s.label}`}
              title={s.label}
              className={cn(
                "focus-visible:ring-ring h-1.5 flex-1 rounded-full outline-none focus-visible:ring-2",
                i <= stepIndex ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </nav>
      </header>

      <main id="main" className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full space-y-6 px-4 py-8 sm:px-6",
            step.id === "overview" ? "max-w-3xl" : "max-w-5xl",
          )}
        >
          {frozen && (
            <Notice title="Published, so the structure is fixed">
              Modules, lessons and the title can&apos;t change on a published course. Changing them
              means a new version. The description and the token price stay editable: they only
              affect the next learner, and every published version keeps its own copy.
            </Notice>
          )}
          {step.id === "overview" && (
            <OverviewStep tree={tree} frozen={frozen} onMedia={() => go("media")} />
          )}
          {step.id === "curriculum" && <CurriculumStep tree={tree} frozen={frozen} />}
          {step.id === "pricing" && <PricingStep tree={tree} />}
          {step.id === "media" && <MediaStep tree={tree} frozen={frozen} />}
          {step.id === "review" && <ReviewStep tree={tree} onGo={go} />}
        </div>
      </main>
    </>
  );
};

const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-border bg-muted/50 rounded-lg border px-4 py-3 text-sm">
    <p className="text-foreground font-medium">{title}</p>
    <p className="text-foreground-muted mt-1">{children}</p>
  </div>
);

const StepHeading = ({ title, hint }: { title: string; hint: string }) => (
  <div>
    <h2 className="font-display text-foreground text-2xl font-semibold tracking-tight">{title}</h2>
    <p className="text-foreground-muted mt-1 text-sm">{hint}</p>
  </div>
);

/* --------------------------------- overview --------------------------------- */

const OverviewStep = ({
  tree,
  frozen,
  onMedia,
}: {
  tree: CourseTree;
  frozen: boolean;
  onMedia: () => void;
}) => {
  const update = useUpdateCourse(tree.course.id);
  const { course } = tree;

  return (
    <div className="space-y-8">
      <div>
        <CatalogueCover id={course.id} title={course.title} imageUrl={course.imageUrl} iconTile>
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-3 bottom-3"
            onClick={onMedia}
          >
            <ImageUp className="size-4" />
            {course.imageUrl ? "Update cover" : "Upload a cover"}
          </Button>
        </CatalogueCover>
        {!course.imageUrl && (
          <p className="text-foreground-muted mt-12 text-xs">
            Using a generated cover. Upload your own on the Media step.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {frozen ? (
          <h1 className="font-display text-foreground text-3xl font-semibold tracking-tight">
            {course.title}
          </h1>
        ) : (
          <InlineEdit
            ariaLabel="Course title"
            value={course.title}
            onCommit={(title) => update.mutate({ title })}
            className="font-display text-3xl font-semibold tracking-tight"
          />
        )}
        {frozen ? (
          <p className="text-foreground-muted">{course.summary}</p>
        ) : (
          <InlineEdit
            ariaLabel="One-line summary"
            value={course.summary || "Add a one-line summary"}
            onCommit={(summary) => update.mutate({ summary })}
            className="text-foreground-muted"
          />
        )}
      </div>

      <CourseOverviewEditor course={course} />
    </div>
  );
};

/* -------------------------------- curriculum -------------------------------- */

const CurriculumStep = ({ tree, frozen }: { tree: CourseTree; frozen: boolean }) => {
  const courseId = tree.course.id;
  const addModule = useAddModule(courseId);
  const removeModule = useRemoveModule(courseId);
  const reorderModules = useReorderModules(courseId);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  // A pending drag order wins until the refetch lands; a changed module set
  // makes it stale, so the server list takes over.
  const modules = useMemo(() => {
    if (!pendingOrder) return tree.modules;
    const byId = new Map(tree.modules.map((m) => [m.id, m]));
    const ordered = pendingOrder.flatMap((id) => byId.get(id) ?? []);
    return ordered.length === tree.modules.length ? ordered : tree.modules;
  }, [tree.modules, pendingOrder]);

  const missingExercise = modules.filter((m) => !m.exerciseId);

  const reorder = (idsInOrder: string[]) => {
    setPendingOrder(idsInOrder);
    reorderModules.mutate(
      { moduleIdsInOrder: idsInOrder },
      { onSettled: () => setPendingOrder(null) },
    );
  };

  const submitModule = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newModuleTitle.trim();
    if (!title) return;
    addModule.mutate(
      { title, summary: "", position: modules.length },
      { onSuccess: () => setNewModuleTitle("") },
    );
  };

  return (
    <div className="space-y-6">
      <StepHeading
        title="Curriculum"
        hint="Modules hold lessons. Drag to reorder. Every module ends in an exercise, which gates it."
      />

      {modules.length > 0 && missingExercise.length > 0 && (
        <div
          role="status"
          className="bg-warning-soft text-warning flex gap-2 rounded-lg px-4 py-3 text-sm"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Every module needs an end-of-module exercise before you can submit. Missing on{" "}
            <strong>{missingExercise.map((m) => m.title).join(", ")}</strong>.
          </p>
        </div>
      )}

      {modules.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No modules yet"
          hint="Add your first module to start laying out the course."
        />
      ) : (
        <SortableList ids={modules.map((m) => m.id)} onReorder={reorder}>
          {modules.map((module, index) => (
            <SortableItem key={module.id} id={module.id}>
              {(handle) => (
                <ModuleCard
                  courseId={courseId}
                  module={module}
                  index={index}
                  handle={handle}
                  frozen={frozen}
                  onRemove={() => removeModule.mutate({ moduleId: module.id })}
                />
              )}
            </SortableItem>
          ))}
        </SortableList>
      )}

      {!frozen && (
        <form onSubmit={submitModule} className="flex items-center gap-2">
          <Input
            className="flex-1"
            placeholder="Add a module…"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            aria-label="New module title"
          />
          <Button type="submit" disabled={!newModuleTitle.trim() || addModule.isPending}>
            <Plus className="size-4" />
            Add module
          </Button>
        </form>
      )}
    </div>
  );
};

/* ---------------------------------- pricing --------------------------------- */

const PricingStep = ({ tree }: { tree: CourseTree }) => {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Pricing & access"
        hint="Set what the course costs in tokens. A price applies to the next learner only."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          {/* Not gated on publishing: the price somebody already paid is copied
              onto their redemption, so repricing can't restate history. */}
          <CoursePriceEditor courseId={tree.course.id} />
          <Notice title="Card payments">
            Pricing in naira or dollars arrives with checkout. Until then a course is either free to
            enrol or unlocked with tokens.
          </Notice>
        </div>
        <div className="space-y-2">
          <p className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
            Card preview
          </p>
          <PreviewCard tree={tree} />
        </div>
      </div>
    </div>
  );
};

const PreviewCard = ({ tree }: { tree: CourseTree }) => {
  const prices = parsePrices(tree.course.pricesJson);
  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      <CatalogueThumbnail
        id={tree.course.id}
        title={tree.course.title}
        imageUrl={tree.course.imageUrl}
      />
      <div className="space-y-2 p-4">
        <p className="font-display text-foreground line-clamp-2 text-lg leading-snug font-semibold">
          {tree.course.title}
        </p>
        <p className="text-foreground-muted line-clamp-2 text-sm">
          {tree.course.summary || "No summary yet."}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-primary text-sm font-medium">View course</span>
          {/* Same source as the learner's catalogue card: the course's own prices.
            A token price only shows on the course page. */}
          {prices && <Price pricing={pricingFromPrices(prices)} />}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------- media ---------------------------------- */

const MediaStep = ({ tree, frozen }: { tree: CourseTree; frozen: boolean }) => {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Media"
        hint="One image serves as both the 3:1 cover and the 4:3 card thumbnail, cropped to fit. Without one, a generated cover is used."
      />
      <CourseCover courseId={tree.course.id} imageUrl={tree.course.imageUrl} frozen={frozen} />
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-2">
          <p className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
            Card
          </p>
          <PreviewCard tree={tree} />
        </div>
        <div className="space-y-2">
          <p className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
            Course page header
          </p>
          <CatalogueCover
            id={tree.course.id}
            title={tree.course.title}
            imageUrl={tree.course.imageUrl}
            iconTile
          />
          <p className="font-display text-foreground text-xl font-semibold">{tree.course.title}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------- review ---------------------------------- */

const ReviewStep = ({ tree, onGo }: { tree: CourseTree; onGo: (step: StepId) => void }) => {
  const courseId = tree.course.id;
  const submit = useSubmitForReview(courseId);
  const withdraw = useWithdrawFromReview(courseId);
  const status = tree.course.status;

  const checks: { label: string; ok: boolean; required: boolean; step: StepId }[] = [
    {
      label: "Title and one-line summary",
      ok: !!tree.course.title && !!tree.course.summary,
      required: false,
      step: "overview",
    },
    {
      label: "What learners will achieve",
      ok: tree.course.learningOutcomes.length > 0,
      required: false,
      step: "overview",
    },
    {
      label: "At least one module",
      ok: tree.modules.length > 0,
      required: true,
      step: "curriculum",
    },
    {
      label: "Every module has lessons",
      ok: tree.modules.length > 0 && tree.modules.every((m) => m.lessons.length > 0),
      required: false,
      step: "curriculum",
    },
    {
      label: "Every module ends in an exercise",
      ok: tree.modules.length > 0 && tree.modules.every((m) => m.exerciseId),
      required: true,
      step: "curriculum",
    },
    { label: "Your own cover image", ok: !!tree.course.imageUrl, required: false, step: "media" },
  ];
  const canSubmit = status === "draft" && checks.every((c) => c.ok || !c.required);

  return (
    <div className="space-y-6">
      <StepHeading
        title="Review & submit"
        hint="A reviewer approving the course is what publishes it. You'll be notified either way, and a rejection comes with a reason."
      />

      <ul className="border-border bg-card divide-border divide-y rounded-lg border">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full",
                check.ok
                  ? "bg-success-soft text-success"
                  : check.required
                    ? "bg-warning-soft text-warning"
                    : "bg-muted text-foreground-subtle",
              )}
            >
              {check.ok ? <Check className="size-3.5" /> : <CircleAlert className="size-3.5" />}
            </span>
            <span className="text-foreground min-w-0 flex-1 text-sm">{check.label}</span>
            {!check.ok && (
              <>
                <Badge tone={check.required ? "warning" : "neutral"} appearance="soft" size="sm">
                  {check.required ? "Required" : "Recommended"}
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => onGo(check.step)}>
                  Fix
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      {status === "review" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-foreground-muted text-sm">
            With the review team. You can keep editing; the checks run again when a reviewer
            decides.
          </p>
          <Button variant="outline" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
            {withdraw.isPending ? "Withdrawing…" : "Withdraw to draft"}
          </Button>
        </div>
      ) : status === "draft" ? (
        <Button size="lg" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? "Submitting…" : "Submit for review"}
        </Button>
      ) : (
        <p className="text-foreground-muted text-sm">
          This course is {status}. Structural changes need a new version.
        </p>
      )}
    </div>
  );
};
