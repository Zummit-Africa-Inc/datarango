"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { memberLabel, useOrgMembers, type OrgMember } from "@/hooks/orgs";
import { useOrgGradingQueue, type GradingQueueItem } from "@/hooks/grading";

const PAGE_SIZE = 20;

/**
 * The org instructor's grading queue.
 *
 * Scoped through assignments, not membership: submissions show up here for
 * courses this organization put in front of the member. Their own personal
 * study stays invisible, the same line the progress report draws.
 */
export default function GradingPage() {
  const { activeOrgId } = useActiveOrg();

  const canGrade = usePermission("org.grading.grade");
  const canViewMembers = usePermission("org.members.view");

  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrgGradingQueue(canGrade ? activeOrgId : null, {
    page,
    pageSize: PAGE_SIZE,
  });
  const { data: members } = useOrgMembers(canViewMembers ? activeOrgId : null);

  const byUserId = useMemo(
    () => new Map((members ?? []).map((m) => [m.userId, m] as const)),
    [members],
  );

  // Checked before rendering rather than letting the call 403: a queue that
  // errors tells an instructor nothing about why.
  if (!canGrade) {
    return (
      <PageLayout
        title="Grading"
        subtitle="Written answers from your members, waiting to be marked."
      >
        <Notice title="You don't have access to grading">
          Marking members&apos; submissions needs the <Code>org.grading.grade</Code> permission,
          which the built-in <Code>instructor</Code> role carries. It is separate from{" "}
          <Code>org.reports.view</Code> on purpose — seeing that somebody scored 40% and reading the
          paragraph they wrote are different levels of access. An owner or admin can grant it from
          Roles.
        </Notice>
      </PageLayout>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageLayout
      title="Grading"
      subtitle="Written answers from your members on courses this organization assigned."
    >
      {isLoading ? (
        <Skeleton skeleton="list" count={4} />
      ) : items.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">Nothing to mark</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-lg text-sm">
            Submissions appear here when a quiz has a question its author set aside for a person to
            mark, and the member took it on a course you assigned. Everything else is graded the
            moment it&apos;s submitted.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/assignments">See assignments</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <QueueRow
              key={item.attemptId}
              item={item}
              member={byUserId.get(item.userId)}
              canViewMembers={canViewMembers}
            />
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} waiting
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

const QueueRow = ({
  item,
  member,
  canViewMembers,
}: {
  item: GradingQueueItem;
  member: OrgMember | undefined;
  canViewMembers: boolean;
}) => {
  const waiting = Date.now() - new Date(item.submittedAt).getTime();
  const days = Math.floor(waiting / 86_400_000);

  return (
    <li>
      <Link
        href={`/grading/${item.attemptId}`}
        className="border-hairline bg-card hover:border-primary-500/40 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xs border px-4 py-3 transition-colors"
      >
        <div className="min-w-0 flex-1">
          {/*
            Names come from the org's own member directory. The fallback says
            *why* it is a short id, so "left the org" and "needs a permission"
            don't look like the same thing.
          */}
          <p className="text-ink truncate text-sm font-medium">
            {member ? memberLabel(member) : `${item.userId.slice(0, 8)}…`}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {item.quizTitle}
            {!member && (
              <span className="ml-1">
                · {canViewMembers ? "not a current member" : "name needs org.members.view"}
              </span>
            )}
          </p>
        </div>

        <Badge variant="outline">
          {item.answersAwaitingReview} answer{item.answersAwaitingReview === 1 ? "" : "s"}
        </Badge>
        <span className="text-muted-foreground text-xs tabular-nums">
          {item.pointsAwaitingReview} pt{item.pointsAwaitingReview === 1 ? "" : "s"} to decide
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <Clock className="size-3.5" />
          {days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`}
        </span>
      </Link>
    </li>
  );
};

const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
    <p className="text-ink font-medium">{title}</p>
    <p className="text-muted-foreground mt-1">{children}</p>
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted rounded-xs px-1 py-0.5 font-mono text-xs">{children}</code>
);
