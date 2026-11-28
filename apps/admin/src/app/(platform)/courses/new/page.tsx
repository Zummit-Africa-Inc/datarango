"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useStaffPermission } from "@datarango/auth";
import { PageLayout } from "@datarango/ui";

import { CourseForm } from "@/components/course-form";
import { Notice } from "@/components/people-ui";
import { useCreateCourse } from "@/hooks/courses";

/** A new Datarango course, as a draft. */
export default function NewCoursePage() {
  const canManage = useStaffPermission("learning:courses:manage");
  const router = useRouter();
  const create = useCreateCourse();

  return (
    <PageLayout
      title="New course"
      subtitle="A Datarango course. It starts as a draft and is published through review."
    >
      <Link
        href="/courses"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All courses
      </Link>
      {canManage ? (
        <CourseForm
          submitLabel={create.isPending ? "Creating…" : "Create draft"}
          busy={create.isPending}
          cancelHref="/courses"
          onSubmit={(input) =>
            create.mutate(input, { onSuccess: (r) => router.push(`/courses/${r.course.id}`) })
          }
        />
      ) : (
        <Notice
          title="You can't create courses"
          body="This needs the learning:courses:manage permission."
        />
      )}
    </PageLayout>
  );
}
