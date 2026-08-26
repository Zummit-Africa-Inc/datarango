"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import Link from "next/link";

import { Badge, Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import { useDiscoverDatasets } from "@/hooks/arena";

const PAGE_SIZE = 12;

export default function DatasetsPage() {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <div
              className="border-hairline bg-card hover:border-primary-500/40 flex flex-col rounded-xs border transition-colors"
              key={dataset.id}
            >
              <div className="bg-primary-500 flex h-24 w-full items-end justify-end p-3">
                <Badge variant="outline">{dataset.license}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h2 className="font-heading text-ink truncate text-xl leading-snug">
                  {dataset.title}
                </h2>
                <p className="text-muted-foreground line-clamp-2 flex-1 text-sm leading-relaxed">
                  {dataset.summary || "No summary yet."}
                </p>
                {dataset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dataset.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Download className="size-3.5" />
                    {dataset.downloadCount} download{dataset.downloadCount === 1 ? "" : "s"}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/datasets/${dataset.id}`}>View →</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} dataset{total === 1 ? "" : "s"}
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
