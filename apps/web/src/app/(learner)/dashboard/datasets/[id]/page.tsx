"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { useDataset, useDatasetVersions, useDownloadDatasetFile } from "@/hooks/arena";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

export default function DatasetDetailPage() {
  const datasetId = useParams().id as string;

  const { data: dataset, isLoading } = useDataset(datasetId);
  const { data: listing } = useDatasetVersions(datasetId);
  const download = useDownloadDatasetFile();

  if (isLoading) {
    return (
      <PageLayout title="Dataset" subtitle="Loading…">
        <Skeleton skeleton="page" />
      </PageLayout>
    );
  }

  if (!dataset) {
    return (
      <PageLayout title="Dataset not found" subtitle="It may have been unpublished.">
        <Button asChild variant="outline">
          <Link href="/dashboard/datasets">Back to datasets</Link>
        </Button>
      </PageLayout>
    );
  }

  // The version list is newest first; the files table shows the current
  // version's contents — the thing a download link is for.
  const currentFiles = (listing?.files ?? []).filter(
    (f) => f.versionId === dataset.currentVersionId,
  );
  const currentVersion = (listing?.versions ?? []).find((v) => v.id === dataset.currentVersionId);

  const startDownload = async (fileId: string) => {
    try {
      const ticket = await download.mutateAsync({ fileId });
      window.open(ticket.url, "_blank", "noopener");
    } catch {
      // The hook already toasts; nothing else to say.
    }
  };

  return (
    <PageLayout
      title={dataset.title}
      subtitle={dataset.summary || "No summary yet."}
      actions={[
        <Badge key="license" variant="outline">
          {dataset.license}
        </Badge>,
      ]}
    >
      <Link
        href="/dashboard/datasets"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All datasets
      </Link>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">
          {dataset.downloadCount} download{dataset.downloadCount === 1 ? "" : "s"}
        </span>
        {currentVersion && (
          <span className="text-muted-foreground">
            Version {currentVersion.number}
            {currentVersion.publishedAt &&
              ` · published ${new Date(currentVersion.publishedAt).toLocaleDateString()}`}
          </span>
        )}
        {dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dataset.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {currentFiles.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <p className="font-heading text-ink">No files in this version</p>
          <p className="text-muted-foreground mt-1 text-sm">
            The publisher hasn&apos;t finished uploading this version&apos;s contents.
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-hairline border-b text-left">
                <th className="px-4 py-2.5 font-medium">File</th>
                <th className="px-4 py-2.5 font-medium">Size</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {currentFiles.map((file) => (
                <tr key={file.id} className="border-hairline border-b last:border-b-0">
                  <td className="text-ink px-4 py-3 font-medium">{file.path}</td>
                  <td className="text-muted-foreground px-4 py-3">{formatBytes(file.sizeBytes)}</td>
                  <td className="text-muted-foreground px-4 py-3">{file.contentType}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={download.isPending}
                      onClick={() => startDownload(file.id)}
                    >
                      <Download className="size-3.5" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(listing?.versions.length ?? 0) > 1 && (
        <div className="space-y-2">
          <h2 className="font-heading text-ink text-lg">Version history</h2>
          <ul className="divide-border divide-y">
            {listing!.versions.map((version) => (
              <li key={version.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">
                  Version {version.number}
                  {version.notes && (
                    <span className="text-muted-foreground"> — {version.notes}</span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {version.publishedAt
                    ? new Date(version.publishedAt).toLocaleDateString()
                    : "draft"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageLayout>
  );
}
