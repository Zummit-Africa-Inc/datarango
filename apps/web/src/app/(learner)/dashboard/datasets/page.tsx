"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Badge,
  Button,
  listParam,
  ListToolbar,
  Pagination,
  PageLayout,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useListParams,
} from "@datarango/ui";

import { useDiscoverDatasets } from "@/hooks/arena";

const PAGE_SIZE = 20;

const updated = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function DatasetsPage() {
  return (
    <Suspense fallback={<Skeleton skeleton="table" rows={6} />}>
      <DatasetsList />
    </Suspense>
  );
}

const DatasetsList = () => {
  const router = useRouter();
  const { params, set } = useListParams({ q: listParam.string(), page: listParam.number(1) });
  const { q: submitted, page } = params;

  const { data, isLoading } = useDiscoverDatasets({
    search: submitted,
    page,
    pageSize: PAGE_SIZE,
  });

  const datasets = data?.datasets ?? [];
  const total = data?.total ?? 0;

  return (
    <PageLayout title="Datasets" subtitle="Real data to learn and compete on.">
      <ListToolbar
        search={{ value: submitted, onChange: (q) => set({ q }), placeholder: "Search datasets…" }}
      />

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
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        noun="dataset"
        onPageChange={(next) => set({ page: next })}
      />
    </PageLayout>
  );
};
