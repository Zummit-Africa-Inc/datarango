"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Database,
  FileQuestion,
  ListChecks,
  Search as SearchIcon,
  Trophy,
} from "lucide-react";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { useSearch, type SearchHit, type SearchKind } from "@/hooks/search";

const PAGE_SIZE = 12;

/** One row per indexed kind: tab, labels and where a hit links. */
const KINDS: {
  kind: SearchKind;
  label: string;
  plural: string;
  icon: typeof BookOpen;
  href: (id: string) => string;
}[] = [
  {
    kind: "course",
    label: "Course",
    plural: "courses",
    icon: BookOpen,
    href: (id) => `/dashboard/courses/${id}`,
  },
  {
    kind: "quiz",
    label: "Quiz",
    plural: "quizzes",
    icon: FileQuestion,
    href: (id) => `/dashboard/quizzes/${id}`,
  },
  {
    kind: "dataset",
    label: "Dataset",
    plural: "datasets",
    icon: Database,
    href: (id) => `/dashboard/datasets/${id}`,
  },
  {
    kind: "competition",
    label: "Competition",
    plural: "competitions",
    icon: Trophy,
    href: (id) => `/dashboard/competitions/${id}`,
  },
];

const kindOf = (kind: string) => KINDS.find((k) => k.kind === kind) ?? KINDS[0]!;

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
      <PageLayout
        title="Search"
        subtitle="Find courses, quizzes, datasets and competitions across Datarango."
      >
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <SearchIcon className="text-muted-foreground mx-auto size-6" />
          <p className="font-heading text-ink mt-3 text-lg">Search for something</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Use the box at the top to search courses, quizzes, datasets and competitions.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Search: ${q}`}
      subtitle="Courses, quizzes, datasets and competitions across Datarango."
    >
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <KindTab
            key={k.kind}
            active={kind === k.kind}
            onClick={() => switchKind(k.kind)}
            icon={k.icon}
          >
            {k.plural.charAt(0).toUpperCase() + k.plural.slice(1)}
          </KindTab>
        ))}
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
            No {kindOf(kind).plural} match &ldquo;{q}&rdquo;
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Try fewer words, or another tab above.
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
  const meta = kindOf(hit.kind);
  const href = meta.href(hit.id);

  const facets = hit.facets ?? {};
  const count = (key: string) => {
    const value = facets[key];
    return typeof value === "number" ? value : undefined;
  };
  const text = (key: string) => {
    const value = facets[key];
    return typeof value === "string" ? value : undefined;
  };

  const moduleCount = count("moduleCount");
  const questionCount = count("questionCount");
  const fileCount = count("fileCount");
  const endsAt = count("endsAt");
  const status = text("status");
  const metric = text("metric");
  const imageUrl = text("imageUrl") ?? null;
  const rawTags = facets.tags;
  const tags = Array.isArray(rawTags) ? rawTags : [];

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
              <div className="flex shrink-0 gap-1.5">
                {status === "closed" && <Badge variant="ghost">Closed</Badge>}
                <Badge variant="ghost">{meta.label}</Badge>
              </div>
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
              {fileCount !== undefined && (
                <span>
                  {fileCount} file{fileCount === 1 ? "" : "s"}
                </span>
              )}
              {metric && <span>scored by {metric}</span>}
              {endsAt !== undefined && status !== "closed" && (
                <span>ends {new Date(endsAt * 1000).toLocaleDateString()}</span>
              )}
              {tags.slice(0, 4).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
              <span>updated {new Date(hit.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};
