"use client";

import { useState } from "react";
import { Download, FileText, Image as ImageIcon, Trash2, Video } from "lucide-react";

import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { MediaStatusBadge } from "@/components/media-status-badge";
import { MediaUploadDialog } from "@/components/media-upload-dialog";
import {
  formatBytes,
  requestDownloadUrl,
  useDeleteAsset,
  useMediaLibrary,
  type MediaAsset,
  type MediaKind,
} from "@/hooks/media";

const PAGE_SIZE = 24;

const FILTERS: { label: string; value: MediaKind | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Video", value: "video" },
  { label: "Images", value: "image" },
  { label: "Files", value: "file" },
];

const KIND_ICON = { video: Video, image: ImageIcon, file: FileText } as const;

export default function MediaPage() {
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMediaLibrary({
    kind: kind === "all" ? undefined : kind,
    page,
    pageSize: PAGE_SIZE,
  });

  const assets = data?.items ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changeFilter = (next: MediaKind | "all") => {
    setKind(next);
    setPage(1);
  };

  return (
    <PageLayout
      title="Media library"
      subtitle="Everything you've uploaded. Video attached to a lesson binds to it automatically once it finishes transcoding."
      actions={[<MediaUploadDialog key="upload" />]}
    >
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            size="sm"
            variant={kind === filter.value ? "default" : "outline"}
            onClick={() => changeFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={4} />
      ) : assets.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {kind === "all" ? "Nothing uploaded yet" : `No ${kind} uploads`}
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            {kind === "all"
              ? "Upload a video here, or straight onto a lesson from the course builder — either way it lands in this library."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="border-hairline bg-card overflow-hidden rounded-xs border">
          <div className="border-hairline text-muted-foreground grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase">
            <span>File</span>
            <span>Used by</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} item{total === 1 ? "" : "s"}
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

const AssetRow = ({ asset }: { asset: MediaAsset }) => {
  const remove = useDeleteAsset();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const Icon = KIND_ICON[asset.kind];

  /**
   * Video has no download: it is played through its playback id and there is no
   * object in our bucket to sign. The server answers `media.not_downloadable`,
   * so the button is simply absent rather than offered and then refused.
   */
  const downloadable = asset.kind !== "video" && asset.status === "ready";

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      // Fetched at the moment of the click rather than cached — the URL expires
      // in minutes, so a stored one would eventually be a dead link handed out
      // by a page that looked fine.
      const { url } = await requestDownloadUrl(asset.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Reported on the row rather than as a toast: this failed for one file
      // among many, and a floating message does not say which.
      setDownloadError("Could not get a download link. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border-hairline grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3 text-sm last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-ink truncate font-medium">{asset.fileName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {asset.sizeBytes ? formatBytes(asset.sizeBytes) : "—"}
            {asset.durationSeconds ? ` · ${formatDuration(asset.durationSeconds)}` : ""}
            {/* The reason a failed upload failed is the only useful thing about
                it, so it goes on the row rather than behind a click. */}
            {asset.status === "failed" && asset.error ? (
              <span className="text-destructive"> · {asset.error}</span>
            ) : null}
            {downloadError ? <span className="text-destructive"> · {downloadError}</span> : null}
          </p>
        </div>
      </div>

      {/* An attachment is an opaque (kind, id) pair — platform.media does not
          know what a lesson is, so this names the kind and nothing more. */}
      <span className="text-muted-foreground text-xs">
        {asset.attachedToKind ? asset.attachedToKind : "Not attached"}
      </span>

      <MediaStatusBadge status={asset.status} />

      <div className="flex justify-end gap-1">
        {downloadable && (
          <Button size="sm" variant="ghost" disabled={downloading} onClick={download}>
            <Download className="size-3.5" />
            <span className="sr-only">Download {asset.fileName}</span>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ assetId: asset.id })}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete {asset.fileName}</span>
        </Button>
      </div>
    </div>
  );
};

const formatDuration = (seconds: number): string => {
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
};
