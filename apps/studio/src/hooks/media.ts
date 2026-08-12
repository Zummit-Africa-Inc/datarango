"use client";

import { useCallback, useRef, useState } from "react";

import { ApiError, getApi, useApi } from "@datarango/api";

/**
 * Media types mirror the wire shapes served by the gateway's /platform/media
 * routes (dr.platform.rpc.media.* over NATS).
 *
 * Enums arrive as camelCase names, not ordinals — MediaRpc registers
 * JsonStringEnumConverter for the same reason the catalog does: a renumbered C#
 * enum must not silently change meaning here.
 *
 * Media is **owner-scoped, not org-scoped**. `media_assets_owner` keys on
 * app.current_user, and the RPC layer passes orgId: null when it issues a
 * ticket — the org on the envelope is recorded for attribution and never
 * narrows a read. So every query below passes orgScoped: false, exactly as the
 * catalog hooks do; otherwise switching org would fragment the cache for data
 * that cannot vary by org.
 */

export type MediaKind = "image" | "video" | "file";

/**
 * The upload lifecycle.
 *
 * `uploaded` and `ready` are distinct on purpose and only for video: bytes have
 * arrived but nothing can play them until Mux finishes transcoding. For images
 * and files completion goes straight to `ready`.
 */
export type MediaStatus = "pending" | "uploaded" | "processing" | "ready" | "failed";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  fileName: string;
  contentType: string;
  sizeBytes: number | null;
  /** Null until the provider reports the transcode finished. Video only. */
  muxPlaybackId: string | null;
  durationSeconds: number | null;
  /**
   * An opaque (kind, id) pair, never a lesson row reference — platform.media
   * must not learn what a lesson is. "lesson" is the kind learning recognises.
   */
  attachedToKind: string | null;
  attachedToId: string | null;
  /** Why a `failed` asset failed. An upload that vanishes silently is the worst version of this. */
  error: string | null;
  createdAt: string;
  readyAt: string | null;
}

export interface MediaLibraryPage {
  items: MediaAsset[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * An issued ticket: the asset row that now exists, and where to send bytes.
 *
 * `uploadUrl` is a **different origin** from the gateway — the object store for
 * images and files, Mux for video — and is never stored server-side. It is a
 * signature valid for minutes.
 */
export interface UploadTicket {
  assetId: string;
  uploadUrl: string;
  method: string;
  /** Must be sent back verbatim on the PUT — see `putToTicket`. */
  contentType: string;
  expiresAt: string;
}

export interface CreateUploadInput {
  kind: MediaKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Set to "lesson" + the lesson id to have learning bind the playback id when it is ready. */
  attachedToKind?: string;
  attachedToId?: string;
}

const MEDIA = ["platform-media"];

/* --------------------------- client-side limits ---------------------------- */

/**
 * A mirror of the server's `MediaLimits`, used only to fail fast in the picker.
 *
 * This is an affordance, not a control: the server re-checks the type against
 * its own allowlist before signing anything, and then checks what the store
 * *actually recorded* against what it ticketed. Telling somebody their 4 GB
 * file is too large before they spend an hour sending it is worth duplicating
 * three constants for; nothing here is load-bearing.
 *
 * SVG is deliberately absent from the image list despite being an image — it is
 * a script-bearing format and the store echoes the content type on download.
 */
export const MEDIA_ACCEPT: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  // Audio sits under `video` because that kind means "the provider transcodes
  // it", not "it is moving pictures" — Mux returns an ordinary playback id for
  // an audio-only asset, and an audio lesson plays it through the same field.
  video: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/ogg",
  ],
  file: ["application/pdf", "text/csv", "application/zip", "text/plain"],
};

export const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 5 * 1024 * 1024 * 1024,
  file: 100 * 1024 * 1024,
};

/**
 * Which kind a content type belongs to, or null if no list claims it.
 *
 * The three allowlists are disjoint, so the file's own type determines its
 * kind and there is nothing to ask the uploader. Null is the honest answer for
 * anything outside them — including the empty string a browser reports for a
 * file it cannot identify.
 */
export const kindForContentType = (contentType: string): MediaKind | null => {
  const type = contentType.trim().toLowerCase();
  if (!type) return null;
  const match = (Object.keys(MEDIA_ACCEPT) as MediaKind[]).find((kind) =>
    MEDIA_ACCEPT[kind].includes(type),
  );
  return match ?? null;
};

/** Returns why this file would be refused, or null if it looks acceptable. */
export const describeRejection = (kind: MediaKind, file: File): string | null => {
  // A browser reports an empty type for a file it does not recognise. The
  // server counts a missing type as a mismatch (an omitted header uploads as
  // application/octet-stream, and accepting that would leave the hole the
  // allowlist exists to close), so refuse it here with a readable reason
  // rather than letting the upload fail after the bytes have gone.
  if (!file.type) {
    return "The browser could not identify this file's type. Try re-saving it in a standard format.";
  }
  if (!MEDIA_ACCEPT[kind].includes(file.type.toLowerCase())) {
    return `${file.type} is not an accepted ${kind} type.`;
  }
  if (file.size <= 0) {
    return "This file is empty.";
  }
  if (file.size > MEDIA_MAX_BYTES[kind]) {
    return `${kind} uploads are limited to ${formatBytes(MEDIA_MAX_BYTES[kind])}.`;
  }
  return null;
};

export const formatBytes = (bytes: number): string => {
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

/* ------------------------------- the transport ------------------------------ */

/**
 * Sends the bytes to the ticket's URL.
 *
 * Deliberately **not** routed through `@datarango/api`. That client is the only
 * thing allowed to talk to the gateway (§3) and it stamps every request with
 * `Authorization: Bearer <session JWT>`, `X-Org-Id` and an idempotency key. The
 * ticket URL is a *different origin* — Cloudflare R2, MinIO in dev, or Mux —
 * so using it here would hand our session token to the object store on every
 * upload. The presigned URL already carries its own authorisation, in the
 * signature; nothing else belongs on this request.
 *
 * `Content-Type` is the one header that must be present and must match the
 * ticket exactly. The server compares the type the store actually recorded
 * against the type it signed for, and on a mismatch deletes the object and
 * fails the asset — so sending the browser's own guess instead of the ticketed
 * value would throw the upload away after it completed.
 *
 * XHR rather than fetch because fetch has no upload-progress event, and the
 * video limit is 5 GB. A progress bar is not a nicety at that size.
 */
export const putToTicket = (
  ticket: UploadTicket,
  file: File,
  options: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.method, ticket.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", ticket.contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded / event.total);
    };

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new Error(
              xhr.status === 403
                ? "The upload link has expired. Close this and try again."
                : `The storage service refused the upload (HTTP ${xhr.status}).`,
            ),
          );

    // A network-level failure gives us no status at all, which in practice is
    // almost always CORS or a dropped connection rather than anything we can
    // name precisely — so the message says what to do, not what went wrong.
    xhr.onerror = () =>
      reject(new Error("The upload could not reach storage. Check your connection."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(file);
  });

/* --------------------------------- queries --------------------------------- */

/**
 * The owner's library, newest first.
 *
 * Polls only while something on the page is still settling; once everything has
 * reached a terminal state the interval drops away entirely rather than
 * re-requesting a library that cannot change without the user acting.
 */
export const useMediaLibrary = (options: { kind?: MediaKind; page?: number; pageSize?: number }) =>
  useApi.query<MediaLibraryPage>(
    [...MEDIA, options.kind ?? "all", String(options.page ?? 1)],
    "/platform/media",
    {
      orgScoped: false,
      params: { kind: options.kind, page: options.page, pageSize: options.pageSize },
      refetchInterval: (data) => (data?.items.some(isSettling) ? POLL_MS : undefined),
    },
  );

/**
 * One asset, polled until it settles.
 *
 * Watches a single upload without refetching the whole page — which is what the
 * upload dialog wants once it has handed off to the provider.
 */
export const useMediaAsset = (assetId: string | null) =>
  useApi.query<MediaAsset>([...MEDIA, "asset", assetId ?? ""], `/platform/media/${assetId}`, {
    orgScoped: false,
    enabled: !!assetId,
    refetchInterval: (data) => (data && isSettling(data) ? POLL_MS : undefined),
  });

const POLL_MS = 5000;

/**
 * Whether this asset is still waiting on work happening somewhere else.
 *
 * `ready` and `failed` are the two terminal states; everything else is either
 * mid-upload or mid-transcode. A video sits in `processing` until Mux's
 * callback — or the reconciler that covers a missed one — moves it on, and that
 * is a wait measured in minutes with no client-side event to hang off. The
 * notification socket carries inbox entries, not asset state.
 */
const isSettling = (asset: MediaAsset): boolean =>
  asset.status !== "ready" && asset.status !== "failed";

/* -------------------------------- mutations -------------------------------- */

export const useCreateUpload = () =>
  useApi.mutation<CreateUploadInput, UploadTicket>("/platform/media/uploads", {
    // No invalidation: the row exists but holds no bytes yet, and a `pending`
    // asset in the library before the PUT has even started would read as a
    // failure to anybody watching. The list is invalidated on completion.
    toast: { error: false },
  });

/**
 * Tells the server the bytes are sent.
 *
 * The server does not take the client's word for it — it asks the store what it
 * actually holds and compares size and content type against what was ticketed —
 * so this can legitimately answer with a `failed` asset rather than throwing.
 */
export const useCompleteUpload = () =>
  useApi.mutation<{ assetId: string }, MediaAsset>((v) => `/platform/media/${v.assetId}/complete`, {
    invalidates: [MEDIA],
    toast: { error: false },
  });

/**
 * Removes an asset and its bytes.
 *
 * @param options.silent - Suppresses both toasts. Used for the cleanup of a
 *   `pending` row after a cancelled or failed upload, where the deletion is
 *   housekeeping the user did not ask for: telling them "Deleted" right after
 *   they cancelled describes the wrong event, and an error toast about tidying
 *   up would bury whatever actually went wrong with the upload.
 */
export const useDeleteAsset = (options: { silent?: boolean } = {}) =>
  useApi.mutation<{ assetId: string }, { deleted: boolean }>(
    (v) => `/platform/media/${v.assetId}`,
    {
      method: "DELETE",
      invalidates: [MEDIA],
      toast: options.silent ? { error: false } : { success: "Deleted" },
    },
  );

/**
 * Fetches a short-lived download URL, imperatively.
 *
 * Deliberately not a `useApi.query`: the URL expires in minutes, so caching one
 * would eventually hand somebody a dead link from a cache that looked fresh.
 * Asking for it at the moment of the click is both correct and cheaper.
 *
 * Video has no answer here — it is played through its playback id, and there is
 * no object in our bucket to sign.
 */
export const requestDownloadUrl = (assetId: string) =>
  getApi().get<{ assetId: string; url: string; expiresAt: string }>(
    `/platform/media/${assetId}/download`,
  );

/* ------------------------------ the whole flow ------------------------------ */

/**
 * Where an upload has got to.
 *
 * `sending` is the only phase that takes real time, and the only one with a
 * meaningful fraction attached — the other two are single round trips.
 */
export type UploadPhase = "idle" | "requesting" | "sending" | "completing" | "settled" | "error";

export interface UploadAttachment {
  /** "lesson" is the kind learning's MediaReadyConsumer recognises. */
  kind: string;
  id: string;
}

/**
 * Drives an upload: ticket → bytes → completion.
 *
 * All three steps are here rather than in the component because the sequence is
 * the part that is easy to get wrong, and it is needed in two places — the
 * library's own dialog, and the lesson attach in the course builder.
 *
 * On cancellation or a failed send the pending row is deleted. That row was
 * created before the bytes existed (the server has to own the storage key, so
 * it cannot wait), and leaving it behind would fill the library with entries
 * that will never hold anything. The cleanup is best-effort and never reported:
 * whatever went wrong with the upload is the thing worth telling somebody, and
 * a second error about tidying up would bury it.
 */
export const useMediaUpload = () => {
  const createUpload = useCreateUpload();
  const completeUpload = useCompleteUpload();
  const deleteAsset = useDeleteAsset({ silent: true });

  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<MediaAsset | null>(null);

  const abort = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abort.current = null;
    setPhase("idle");
    setProgress(0);
    setError(null);
    setAsset(null);
  }, []);

  const cancel = useCallback(() => abort.current?.abort(), []);

  const start = useCallback(
    async (kind: MediaKind, file: File, attach?: UploadAttachment): Promise<MediaAsset | null> => {
      const rejection = describeRejection(kind, file);
      if (rejection) {
        setPhase("error");
        setError(rejection);
        return null;
      }

      const controller = new AbortController();
      abort.current = controller;
      setError(null);
      setProgress(0);
      setPhase("requesting");

      let ticket: UploadTicket;
      try {
        ticket = await createUpload.mutateAsync({
          kind,
          fileName: file.name,
          // Lower-cased to match what the server allowlists and signs. A
          // browser can report "Image/JPEG", and the comparison downstream is
          // exact.
          contentType: file.type.toLowerCase(),
          sizeBytes: file.size,
          attachedToKind: attach?.kind,
          attachedToId: attach?.id,
        });
      } catch (cause) {
        setPhase("error");
        setError(messageFor(cause, "The upload could not be started."));
        return null;
      }

      setPhase("sending");
      try {
        await putToTicket(ticket, file, {
          onProgress: setProgress,
          signal: controller.signal,
        });
      } catch (cause) {
        void deleteAsset.mutateAsync({ assetId: ticket.assetId }).catch(() => {});
        const cancelled = cause instanceof DOMException && cause.name === "AbortError";
        setPhase(cancelled ? "idle" : "error");
        setError(cancelled ? null : messageFor(cause, "The upload failed."));
        return null;
      }

      setPhase("completing");
      try {
        // The server re-checks size and content type against what the store
        // actually recorded, so this can come back `failed` rather than
        // throwing. That is a settled outcome, not an exception — the asset
        // carries the reason and the UI reads it off the row.
        const settled = await completeUpload.mutateAsync({ assetId: ticket.assetId });
        setAsset(settled);
        setPhase("settled");
        return settled;
      } catch (cause) {
        setPhase("error");
        setError(messageFor(cause, "The upload could not be confirmed."));
        return null;
      }
    },
    [createUpload, completeUpload, deleteAsset],
  );

  return { start, cancel, reset, phase, progress, error, asset };
};

const messageFor = (cause: unknown, fallback: string): string =>
  cause instanceof ApiError || cause instanceof Error ? cause.message : fallback;
