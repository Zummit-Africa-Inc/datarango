"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Badge,
  Button,
  Input,
  PageLayout,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { useDiscoverDatasets } from "@/hooks/arena";

const PAGE_SIZE = 20;

const updated = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function DatasetsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDiscoverDatasets({
    search: submitted,
    page,
    pageSize: PAGE_SIZE,
  });

  const datasets = data?.datasets ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(search.trim());
    setPage(1);
  };

  return (
    <PageLayout title="Datasets" subtitle="Real data to learn and compete on.">
      <form onSubmit={runSearch} className="flex max-w-md items-center gap-2">
        <Input
          aria-label="Search datasets"
          placeholder="Search datasets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      {isLoading ? (
        <Skeleton skeleton="list" rows={6} />
      ) : datasets.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {submitted ? "Nothing matches that search" : "No datasets published yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {submitted
              ? "Try a different term."
              : "Published datasets show up here, ready to explore."}
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Dataset</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
                <TableHead className="hidden sm:table-cell">License</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Open</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => {
                const href = `/dashboard/datasets/${dataset.id}`;
                return (
                  // The whole row opens the dataset; the title link keeps it
                  // reachable by keyboard and middle-click.
                  <TableRow
                    key={dataset.id}
                    className="cursor-pointer"
                    onClick={() => router.push(href)}
                  >
                    <TableCell className="max-w-md py-3 whitespace-normal">
                      <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="text-ink font-medium hover:underline"
                      >
                        {dataset.title}
                      </Link>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {dataset.summary || "No summary yet."}
                      </p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {dataset.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {dataset.tags.length > 3 && (
                          <span className="text-muted-foreground text-xs">
                            +{dataset.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{dataset.license}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {dataset.downloadCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {updated(dataset.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={href} onClick={(e) => e.stopPropagation()}>
                          View →
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {lastPage > 1 && `Page ${page} of ${lastPage} · `}
            {total} dataset{total === 1 ? "" : "s"}
          </p>
          <div className={lastPage > 1 ? "flex gap-2" : "hidden"}>
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
