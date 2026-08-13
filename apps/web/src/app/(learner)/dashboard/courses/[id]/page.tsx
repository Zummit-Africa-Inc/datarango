"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useCourseProgress, useCourseTree, useEnroll, useMyEnrollments } from "@/hooks/learning";
import { Badge, Button, PageLayout, Skeleton, TabList, TabPanel } from "@datarango/ui";
import { Discussions } from "@/components/learning/discussions";
import { Resources } from "@/components/learning/resources";
import { Overview } from "@/components/learning/overview";
import { Syllabus } from "@/components/learning/syllabus";

const TABS = [
  { label: "Overview", value: "overview" },
  { label: "Syllabus", value: "syllabus" },
  { label: "Resources", value: "resources" },
  { label: "Discussions", value: "discussions" },
];

export default function CourseDetailPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const courseId = useParams().id as string;

  const { data: tree, isLoading } = useCourseTree(courseId);
  const { data: enrollments } = useMyEnrollments();

  const enrollment = useMemo(
    () => (enrollments?.enrollments ?? []).find((e) => e.courseId === courseId),
    [enrollments, courseId],
  );
  const isEnrolled = !!enrollment;

  const { data: progress } = useCourseProgress(courseId, isEnrolled);
  const enroll = useEnroll(courseId);

  if (isLoading) {
    return (
      <PageLayout title="Course" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!tree) {
    return (
      <PageLayout title="Course not found" subtitle="It may have been unpublished.">
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">Back to courses</Link>
        </Button>
      </PageLayout>
    );
  }

  const lessonCount = tree.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <PageLayout
      title={tree.course.title}
      subtitle={tree.course.summary || "No summary yet."}
      actions={[
        isEnrolled ? (
          <Badge key="status" variant={progress?.completed ? "success" : "outline"}>
            {progress?.completed ? "Completed" : `${progress?.percentComplete ?? 0}% complete`}
          </Badge>
        ) : (
          <Button key="enroll" disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? "Enrolling…" : "Enrol — free"}
          </Button>
        ),
      ]}
    >
      <Link
        href="/dashboard/courses"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All courses
      </Link>

      {isEnrolled && progress && !progress.completed && (
        <div className="border-hairline bg-card rounded-xs border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">{progress.percentComplete}%</span>
          </div>
          <div className="bg-muted mt-2 h-2 rounded-full">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}
      {progress?.completed && (
        <div className="border-hairline bg-card rounded-xs border p-4 text-sm">
          <p className="text-ink font-medium">Course complete</p>
          <p className="text-muted-foreground mt-1">
            Your certificate is on your{" "}
            <Link className="text-primary-500 underline-offset-4 hover:underline" href="/dashboard">
              dashboard
            </Link>
            .
          </p>
        </div>
      )}
      <div className="space-y-4">
        <TabList activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />
        <TabPanel selected={activeTab} value="overview">
          <Overview courseId={courseId} isEnrolled={isEnrolled} progress={progress} tree={tree} />
        </TabPanel>
        <TabPanel selected={activeTab} value="syllabus">
          <Syllabus
            courseId={courseId}
            isEnrolled={isEnrolled}
            lessonCount={lessonCount}
            progress={progress}
            tree={tree}
          />
        </TabPanel>
        <TabPanel selected={activeTab} value="resources">
          <Resources />
        </TabPanel>
        <TabPanel selected={activeTab} value="discussions">
          <Discussions />
        </TabPanel>
      </div>
    </PageLayout>
  );
}
