"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useStaffPermission } from "@datarango/auth";
import { PageLayout, Skeleton } from "@datarango/ui";

import { CourseForm } from "@/components/course-form";
import { Notice } from "@/components/people-ui";
import { useStaffCourse, useUpdateCourse } from "@/hooks/courses";

/** Edits a Datarango course's catalogue details. Other owners' courses can't be edited here. */
export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const canManage = useStaffPermission("learning:courses:manage");
  const router = useRouter();
  const { data, isLoading } = useStaffCourse(courseId);
  const update = useUpdateCourse();

  return (
    <PageLayout
      title={data ? `Edit ${data.course.title}` : "Edit course"}
      subtitle="Catalogue details."
    >
      <Link
        href={`/courses/${courseId}`}
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to the course
      </Link>
      {!canManage ? (
        <Notice
          title="You can't edit courses"
          body="This needs the learning:courses:manage permission."
        />
      ) : isLoading ? (
        <Skeleton skeleton="page" />
      ) : !data ? (
        <Notice title="Course not found" body="No course has that id." />
      ) : data.course.owner !== "platform" ? (
        <Notice
          title="Not a Datarango course"
          body="Creators and organisations edit their own courses in Studio."
        />
      ) : (
        <CourseForm
          key={data.course.id}
          initial={{
            title: data.course.title,
            summary: data.course.summary,
            imageUrl: data.course.imageUrl,
            overview: data.overview,
            targetAudience: data.targetAudience,
            learningOutcomes: data.learningOutcomes,
            prerequisites: data.prerequisites,
          }}
          submitLabel={update.isPending ? "Saving…" : "Save changes"}
          busy={update.isPending}
          cancelHref={`/courses/${courseId}`}
          onSubmit={(input) =>
            update.mutate(
              { courseId, ...input },
              { onSuccess: () => router.push(`/courses/${courseId}`) },
            )
          }
        />
      )}
    </PageLayout>
  );
}
