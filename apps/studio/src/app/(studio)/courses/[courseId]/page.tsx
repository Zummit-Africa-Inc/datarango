"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import { CourseStatusBadge } from "@/components/course-status-badge";
import { ModuleCard } from "@/components/module-card";
import { SortableItem, SortableList } from "@/components/sortable";
import {
  useAddModule,
  usePublishCourse,
  useRemoveModule,
  useReorderModules,
  useCourseTree,
} from "@/hooks/catalog";

export default function CourseBuilderPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const { data: tree, isLoading } = useCourseTree(courseId);
  const addModule = useAddModule(courseId);
  const removeModule = useRemoveModule(courseId);
  const reorderModules = useReorderModules(courseId);
  const publish = usePublishCourse(courseId);

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  const serverModules = useMemo(() => tree?.modules ?? [], [tree]);

  // Pending drag order wins until the refetch lands; a changed module set means
  // the override is stale, so defer to the server list.
  const modules = useMemo(() => {
    if (!pendingOrder) return serverModules;
    const byId = new Map(serverModules.map((m) => [m.id, m]));
    const ordered = pendingOrder.flatMap((id) => byId.get(id) ?? []);
    return ordered.length === serverModules.length ? ordered : serverModules;
  }, [serverModules, pendingOrder]);

  const frozen = tree?.course.status === "published";
  const modulesMissingExercise = modules.filter((m) => !m.exerciseId);
  const canPublish = !frozen && modules.length > 0 && modulesMissingExercise.length === 0;

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

  if (isLoading) {
    return (
      <PageLayout title="Course" subtitle="Loading…">
        <Skeleton skeleton="table" rows={4} columns={3} />
      </PageLayout>
    );
  }

  if (!tree) {
    return (
      <PageLayout title="Course not found" subtitle="It may have been deleted.">
        <Button asChild variant="outline">
          <Link href="/courses">Back to courses</Link>
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={tree.course.title}
      subtitle={tree.course.summary || "No summary yet."}
      actions={[
        <CourseStatusBadge key="status" status={tree.course.status} />,
        <Button
          key="publish"
          disabled={!canPublish || publish.isPending}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? "Publishing…" : "Publish"}
        </Button>,
      ]}
    >
      <Link
        href="/courses"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All courses
      </Link>

      {frozen && (
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          This course is published and frozen. Editing it means publishing a new version.
        </div>
      )}

      {!frozen && modules.length > 0 && modulesMissingExercise.length > 0 && (
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">Not ready to publish</p>
          <p className="text-muted-foreground mt-1">
            Every module needs an end-of-module exercise. Still missing on{" "}
            {modulesMissingExercise.map((m) => m.title).join(", ")}.
          </p>
        </div>
      )}

      <div>
        {modules.length === 0 ? (
          <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
            <p className="font-heading text-ink text-lg">No modules yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your first module to start laying out the course.
            </p>
          </div>
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
                    frozen={!!frozen}
                    onRemove={() => removeModule.mutate({ moduleId: module.id })}
                  />
                )}
              </SortableItem>
            ))}
          </SortableList>
        )}
      </div>

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
    </PageLayout>
  );
}
