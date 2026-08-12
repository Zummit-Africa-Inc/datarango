"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@datarango/ui";

import { UploadProgress } from "@/components/upload-progress";
import {
  MEDIA_ACCEPT,
  formatBytes,
  kindForContentType,
  useMediaUpload,
  type MediaAsset,
  type UploadAttachment,
} from "@/hooks/media";

/** Every type the server will sign for, across all three kinds. */
const ACCEPT = Object.values(MEDIA_ACCEPT).flat().join(",");

/**
 * Uploads a file into the creator's media library.
 *
 * The kind is **inferred from the file's own content type** rather than picked
 * from a dropdown. The three allowlists are disjoint, so asking would be asking
 * somebody to restate what the file already says — and getting it wrong would
 * mean an upload refused after the picker, for a reason that reads like a bug.
 *
 * @param attach - Optional (kind, id) pair recorded on the asset. Set to
 *   `{ kind: "lesson", id }` and learning binds the playback id to that lesson
 *   when the transcode finishes.
 */
export const MediaUploadDialog = ({
  attach,
  trigger,
  title = "Upload media",
  description,
  onSettled,
}: {
  attach?: UploadAttachment;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onSettled?: (asset: MediaAsset) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = useMediaUpload();
  const busy =
    upload.phase === "requesting" || upload.phase === "sending" || upload.phase === "completing";

  const kind = file ? kindForContentType(file.type) : null;

  const close = (next: boolean) => {
    // Closing mid-send would leave the request running with nothing watching
    // it, so the cancel path is taken explicitly — which also deletes the
    // pending row rather than orphaning it.
    if (!next && busy) upload.cancel();
    if (!next) {
      setFile(null);
      upload.reset();
      if (input.current) input.current.value = "";
    }
    setOpen(next);
  };

  const send = async () => {
    if (!file || !kind) return;
    const settled = await upload.start(kind, file, attach);
    if (settled) onSettled?.(settled);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Upload className="size-4" />
            Upload
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ??
              "Images and files are stored directly. Video is sent to the transcoder and becomes playable a few minutes later."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              upload.reset();
            }}
            className="border-hairline file:bg-muted file:text-ink hover:file:bg-muted/70 block w-full rounded-xs border px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-xs file:border-0 file:px-3 file:py-1.5 file:text-sm disabled:opacity-60"
          />

          {file && (
            <p className="text-muted-foreground text-xs">
              {formatBytes(file.size)}
              {/* The file's own type, not the kind it maps to: an mp3 is
                  uploaded as kind `video` because that is the kind the
                  transcoder handles, and printing "video" against an audio file
                  reads as a bug. */}
              {kind ? ` · ${file.type}` : ""}
              {/* A type outside every allowlist is named here rather than at
                  submit: the file picker's `accept` is a hint the OS is free to
                  ignore, and a drag-and-drop bypasses it entirely. */}
              {!kind && (
                <span className="text-destructive">
                  {" "}
                  · {file.type || "unknown type"} is not an accepted upload type
                </span>
              )}
            </p>
          )}

          {upload.phase === "sending" && (
            <UploadProgress fraction={upload.progress} onCancel={upload.cancel} />
          )}

          {upload.phase === "completing" && (
            <p className="text-muted-foreground text-sm">Confirming the upload…</p>
          )}

          {upload.error && (
            <p className="text-destructive flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {upload.error}
            </p>
          )}

          {upload.phase === "settled" && upload.asset && <Outcome asset={upload.asset} />}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => close(false)}>
            {upload.phase === "settled" ? "Done" : "Cancel"}
          </Button>
          <Button
            type="button"
            disabled={!file || !kind || busy || upload.phase === "settled"}
            onClick={send}
          >
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * What happened, once the server has had its say.
 *
 * Completion can legitimately settle as `failed` — the server compares what the
 * store actually recorded against what it ticketed, and deletes the object on a
 * mismatch — so this is not an error path in the request sense but it is very
 * much a bad outcome, and it carries the reason.
 */
const Outcome = ({ asset }: { asset: MediaAsset }) => {
  if (asset.status === "failed") {
    return (
      <div className="border-destructive/40 bg-destructive/5 rounded-xs border px-3 py-2">
        <p className="text-destructive flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="size-4" />
          Rejected
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {asset.error ?? "The stored file did not match what was declared."}
        </p>
      </div>
    );
  }

  if (asset.status === "processing") {
    return (
      <div className="border-hairline bg-card rounded-xs border px-3 py-2">
        <p className="text-ink text-sm font-medium">Sent — now transcoding</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This finishes on the transcoder&apos;s schedule, not yours. You can close this; the
          library updates itself, and an attached lesson picks the video up automatically.
        </p>
      </div>
    );
  }

  return (
    <p className="text-ink flex items-center gap-2 text-sm">
      <CheckCircle2 className="size-4 text-green-600" />
      {asset.fileName} is ready.
    </p>
  );
};
