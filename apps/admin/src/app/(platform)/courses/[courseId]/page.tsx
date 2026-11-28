"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useStaffPermission } from "@datarango/auth";
import { Badge, Button, PageLayout, PropertyList, Skeleton } from "@datarango/ui";

import { Notice, formatDate } from "@/components/people-ui";
import {
  COURSE_OWNER_LABEL,
  COURSE_STATUS_LABEL,
  useStaffCourse,
  useSubmitCourse,
} from "@/hooks/courses";

/** One course: what it is, who owns it, and its outline. */
export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const canView = useStaffPermission("learning:courses:view");

  return (
    <PageLayout title="Course" subtitle="Details and outline.">
      <Link
        href="/courses"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All courses
      </Link>
      {canView ? (
        <CourseDetail courseId={courseId} />
      ) : (
        <Notice
          title="You can't see courses"
          body="This needs the learning:courses:view permission."
        />
      )}
    </PageLayout>
  );
}

const CourseDetail = ({ courseId }: { courseId: string }) => {
  const canManage = useStaffPermission("learning:courses:manage");
  const canSeeOrgs = useStaffPermission("orgs:organizations:view");
  const { data, isLoading, error } = useStaffCourse(courseId);
  const submit = useSubmitCourse();

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!data)
    return <Notice title="Course not found" body={error?.message ?? "No course has that id."} />;

  const { course } = data;
  const ours = course.owner === "platform";
  const lessonCount = data.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      <div className="border-hairline bg-card flex flex-wrap items-start justify-between gap-4 rounded-xs border p-5">
        <div className="min-w-0">
          <p className="font-heading text-ink text-xl">{course.title}</p>
          <p className="text-muted-foreground text-sm">{course.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge tone={course.status === "published" ? "success" : "neutral"}>
              {COURSE_STATUS_LABEL[course.status]}
            </Badge>
            <Badge appearance="outline" tone="neutral">
              {COURSE_OWNER_LABEL[course.owner]}
            </Badge>
          </div>
        </div>
        {ours && canManage && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/courses/${course.id}/edit`}>Edit details</Link>
            </Button>
            {course.status === "draft" && (
              <Button
                disabled={submit.isPending || lessonCount === 0}
                title={lessonCount === 0 ? "Add at least one lesson first" : undefined}
                onClick={() => submit.mutate({ courseId: course.id })}
              >
                Send for review
              </Button>
            )}
          </div>
        )}
      </div>

      {!ours && (
        <p className="text-muted-foreground text-sm">
          This course belongs to {course.owner === "organisation" ? "an organisation" : "a creator"}
          , who edits it in Studio. Staff can read it here but not change it.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="border-hairline bg-card rounded-xs border p-5 lg:col-span-1">
          <h2 className="text-ink mb-2 text-sm font-medium">Course</h2>
          <PropertyList
            items={[
              {
                label: "Owner",
                value:
                  course.owner === "organisation" && course.orgId && canSeeOrgs ? (
                    <Link href={`/organizations/${course.orgId}`} className="hover:underline">
                      Organisation
                    </Link>
                  ) : (
                    COURSE_OWNER_LABEL[course.owner]
                  ),
              },
              { label: "Created", value: formatDate(course.createdAt) },
              { label: "Last changed", value: formatDate(course.updatedAt) },
              {
                label: "Published",
                value: course.publishedAt ? formatDate(course.publishedAt) : "Not yet",
              },
              { label: "For", value: data.targetAudience ?? "—" },
              { label: "Slug", value: <span className="font-mono text-xs">{course.slug}</span> },
            ]}
          />
        </section>

        <section className="border-hairline bg-card space-y-4 rounded-xs border p-5 lg:col-span-2">
          <div>
            <h2 className="text-ink text-sm font-medium">Overview</h2>
            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
              {data.overview ?? "No overview yet."}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground text-xs font-medium uppercase">Outcomes</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {data.learningOutcomes.length ? (
                  data.learningOutcomes.map((o) => <li key={o}>{o}</li>)
                ) : (
                  <li className="text-muted-foreground list-none">None listed.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-medium uppercase">
                Before starting
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {data.prerequisites.length ? (
                  data.prerequisites.map((p) => <li key={p}>{p}</li>)
                ) : (
                  <li className="text-muted-foreground list-none">None.</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section className="border-hairline bg-card rounded-xs border p-5">
        <h2 className="text-ink mb-3 text-sm font-medium">
          Outline · {data.modules.length} modules, {lessonCount} lessons
        </h2>
        {data.modules.length === 0 ? (
          <p className="text-muted-foreground text-sm">No modules yet.</p>
        ) : (
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.modules.map((m) => (
              <li key={m.id} className="border-hairline rounded-xs border p-3">
                <p className="text-ink text-sm font-medium">
                  {m.position + 1}. {m.title}
                </p>
                {m.summary && <p className="text-muted-foreground text-xs">{m.summary}</p>}
                <ul className="mt-2 space-y-1 text-sm">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="text-muted-foreground">
                      {l.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
