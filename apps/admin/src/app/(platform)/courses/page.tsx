"use client";

import { Library } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  PageLayout,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Notice, Pager, SearchBox, formatDate, useDebounced } from "@/components/people-ui";
import {
  COURSE_OWNER_LABEL,
  COURSE_STATUS_LABEL,
  useStaffCourses,
  type CourseOwner,
  type CourseStatus,
  type StaffCourse,
} from "@/hooks/courses";
import { usePlatformOrgs } from "@/hooks/operations";
import { usePlatformUsers } from "@/hooks/people";

const PAGE_SIZE = 25;

const STATUS_TONE: Record<CourseStatus, "success" | "warning" | "neutral" | "primary"> = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "neutral",
};

/**
 * Every course on Datarango: Datarango's own, creators' and organisations'.
 * Only Datarango's can be created or edited here.
 */
export default function CoursesPage() {
  const canView = useStaffPermission("learning:courses:view");
  const canManage = useStaffPermission("learning:courses:manage");

  return (
    <PageLayout
      title="Courses"
      subtitle="Every course on Datarango. Datarango's own courses are written here; creators and organisations write theirs in Studio."
    >
      {canView ? (
        <CourseList canManage={canManage} />
      ) : (
        <Notice
          title="You can't see courses"
          body="This needs the learning:courses:view permission."
        />
      )}
    </PageLayout>
  );
}

const CourseList = ({ canManage }: { canManage: boolean }) => {
  const canSeeOrgs = useStaffPermission("orgs:organizations:view");
  const canSeeUsers = useStaffPermission("users:accounts:view");
  const [input, setInput] = useState("");
  const query = useDebounced(input.trim());
  const [status, setStatus] = useState<CourseStatus | "">("");
  const [owner, setOwner] = useState<CourseOwner | "">("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStaffCourses({ query, status, owner, page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const orgIds = [...new Set(items.flatMap((c) => (c.orgId ? [c.orgId] : [])))];
  const creatorIds = [
    ...new Set(items.flatMap((c) => (c.creatorId && !c.orgId ? [c.creatorId] : []))),
  ];
  const { data: orgs } = usePlatformOrgs({
    ids: orgIds,
    pageSize: 100,
    enabled: canSeeOrgs && orgIds.length > 0,
  });
  const { data: creators } = usePlatformUsers({
    ids: creatorIds,
    pageSize: 100,
    enabled: canSeeUsers && creatorIds.length > 0,
  });
  const orgName = new Map(orgs?.items.map((o) => [o.id, o.name]));
  const creatorName = new Map(creators?.items.map((u) => [u.userId, u.displayName]));
  const ownerName = (c: StaffCourse) =>
    c.owner === "platform"
      ? "Datarango"
      : c.owner === "organisation"
        ? (orgName.get(c.orgId!) ?? "Organisation")
        : (creatorName.get(c.creatorId!) ?? "Creator");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchBox
            label="Search courses"
            placeholder="Search by title"
            value={input}
            onChange={(v) => {
              setInput(v);
              setPage(1);
            }}
          />
          <Select
            value={owner || "all"}
            onValueChange={(v) => {
              setOwner(v === "all" ? "" : (v as CourseOwner));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Owner" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every owner</SelectItem>
              {(Object.keys(COURSE_OWNER_LABEL) as CourseOwner[]).map((o) => (
                <SelectItem key={o} value={o}>
                  {COURSE_OWNER_LABEL[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? "" : (v as CourseStatus));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {(Object.keys(COURSE_STATUS_LABEL) as CourseStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {COURSE_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/courses/new">New course</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={8} columns={6} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Library className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No courses"
          body={query || status || owner ? "Nothing matches these filters." : "None written yet."}
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Course</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last changed</TableHead>
                <TableHead>Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/courses/${c.id}`} className="block hover:underline">
                      <span className="text-ink block font-medium">{c.title}</span>
                      <span className="text-muted-foreground line-clamp-1 block text-xs">
                        {c.summary}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-ink block">{ownerName(c)}</span>
                    <span className="text-muted-foreground block text-xs">
                      {COURSE_OWNER_LABEL[c.owner]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[c.status]}>{COURSE_STATUS_LABEL[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(c.updatedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {c.publishedAt ? formatDate(c.publishedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager
          page={page}
          pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          onPage={setPage}
          noun="courses"
        />
      )}
    </div>
  );
};
