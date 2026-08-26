"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BookOpen, FileQuestion, ListChecks, Search as SearchIcon } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { useSearch, type SearchHit, type SearchKind } from "@/hooks/search";

const PAGE_SIZE = 12;

/**
 * Platform search results.
 *
 * `useSearchParams` needs a Suspense boundary in the App Router — without one
 * the whole route opts out of static rendering.
 */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <PageLayout title="Search">
          <Skeleton skeleton="list" count={5} />
        </PageLayout>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

const SearchResults = () => {
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const [kind, setKind] = useState<SearchKind>("course");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSearch({ q, kind, page, pageSize: PAGE_SIZE });

  const hits = data?.hits ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const switchKind = (next: SearchKind) => {
    setKind(next);
    setPage(1);
  };

  if (!q.trim()) {
    return (
      <PageLayout title="Search" subtitle="Find courses and quizzes across Datarango.">
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <SearchIcon className="text-muted-foreground mx-auto size-6" />
          <p className="font-heading text-ink mt-3 text-lg">Search for something</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Use the box at the top to search courses and quizzes.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Search: ${q}`} subtitle="Courses and quizzes across Datarango.">
      <div className="flex gap-2">
        <KindTab active={kind === "course"} onClick={() => switchKind("course")} icon={BookOpen}>
          Courses
        </KindTab>
        <KindTab active={kind === "quiz"} onClick={() => switchKind("quiz")} icon={FileQuestion}>
          Quizzes
        </KindTab>
      </div>

      {isLoading ? (
        <Skeleton skeleton="list" count={5} />
      ) : error ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <p className="font-heading text-ink text-lg">Search is unavailable</p>
          {/*
            Search is an index over content that still exists — so the honest
            fallback is "browse instead", not "there's nothing here".
          */}
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            The search index isn&apos;t answering right now. Browsing the catalogue still works.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/courses">Browse courses</Link>
          </Button>
        </div>
      ) : hits.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <p className="font-heading text-ink text-lg">
            No {kind === "course" ? "courses" : "quizzes"} match &ldquo;{q}&rdquo;
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Try fewer words, or {kind === "course" ? "search quizzes" : "search courses"} instead.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {hits.map((hit) => (
            <ResultRow key={hit.id} hit={hit} />
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · about {total} result{total === 1 ? "" : "s"}
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
};

const KindTab = ({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={
      active
        ? "border-primary-500 text-ink inline-flex items-center gap-1.5 rounded-xs border px-3 py-1.5 text-sm font-medium"
        : "border-hairline text-muted-foreground hover:text-ink inline-flex items-center gap-1.5 rounded-xs border px-3 py-1.5 text-sm"
    }
  >
    <Icon className="size-4" />
    {children}
  </button>
);

const ResultRow = ({ hit }: { hit: SearchHit }) => {
  const href =
    hit.kind === "quiz" ? `/dashboard/quizzes/${hit.id}` : `/dashboard/courses/${hit.id}`;

  const moduleCount =
    typeof hit.facets?.moduleCount === "number" ? hit.facets.moduleCount : undefined;
  const questionCount =
    typeof hit.facets?.questionCount === "number" ? hit.facets.questionCount : undefined;
  const imageUrl = typeof hit.facets?.imageUrl === "string" ? hit.facets.imageUrl : null;

  return (
    <li>
      <Link
        href={href}
        className="border-hairline bg-card hover:border-primary-500/40 block rounded-xs border px-4 py-3 transition-colors"
      >
        <div className="flex items-start gap-4">
          {imageUrl && (
            // Creator-supplied URL of unknown host — unoptimized, see the
            // discovery grid for the reasoning.
            <div className="bg-muted relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-xs sm:block">
              <Image src={imageUrl} alt="" fill sizes="96px" className="object-cover" unoptimized />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-ink text-sm font-medium">{hit.title}</p>
              <Badge variant="ghost">{hit.kind === "quiz" ? "Quiz" : "Course"}</Badge>
            </div>

            {hit.summary && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
                {hit.summary}
              </p>
            )}

            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 text-xs">
              {moduleCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3.5" />
                  {moduleCount} module{moduleCount === 1 ? "" : "s"}
                </span>
              )}
              {questionCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="size-3.5" />
                  {questionCount} question{questionCount === 1 ? "" : "s"}
                </span>
              )}
              <span>updated {new Date(hit.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};
