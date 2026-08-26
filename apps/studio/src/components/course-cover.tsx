"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Button, Input, Label } from "@datarango/ui";

import { useUpdateCourse } from "@/hooks/catalog";

/**
 * Cover image editor for the course builder.
 *
 * A URL rather than a media-library pick on purpose: media assets are private
 * and their download URLs expire after ten minutes, so anything rendered on a
 * public catalogue card needs a stable public origin. The creator pastes one;
 * the server validates scheme and length (`catalog.image_url_invalid`,
 * `catalog.image_url_too_long`) and an empty submission clears the cover.
 */
export const CourseCover = ({
  courseId,
  imageUrl,
  frozen,
}: {
  courseId: string;
  imageUrl: string | null;
  /** Published courses are frozen — the preview stays, the controls go. */
  frozen: boolean;
}) => {
  const update = useUpdateCourse(courseId);
  const [url, setUrl] = useState(imageUrl ?? "");

  // The tree refetches after every mutation; keep the field honest when the
  // change came from elsewhere (or was cleared server-side).
  useEffect(() => {
    setUrl(imageUrl ?? "");
  }, [imageUrl]);

  const trimmed = url.trim();
  const unchanged = trimmed === (imageUrl ?? "");

  const save = () => {
    if (unchanged) return;
    // Absent leaves the cover alone, so clearing has to travel explicitly.
    update.mutate({ imageUrl: trimmed });
  };

  return (
    <div className="border-hairline bg-card rounded-xs border p-4">
      <Label htmlFor="course-cover">Cover image</Label>
      <p className="text-muted-foreground mt-1 text-xs">
        Shown on catalogue cards and the course page. An absolute http(s) URL — covers are public
        images, so a private media-library asset won&apos;t work here.
      </p>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row">
        {imageUrl ? (
          <div className="bg-muted relative h-32 w-full shrink-0 overflow-hidden rounded-xs border sm:w-56">
            {/* Creator-supplied host, unknowable ahead of time — unoptimized
                keeps next/image from proxying arbitrary URLs server-side. */}
            <Image src={imageUrl} alt="" fill sizes="224px" className="object-cover" unoptimized />
          </div>
        ) : (
          !frozen && (
            <div className="border-hairline text-muted-foreground bg-muted/40 hidden h-32 w-full shrink-0 items-center justify-center rounded-xs border border-dashed text-xs sm:flex sm:w-56">
              No cover yet
            </div>
          )
        )}

        {!frozen && (
          <div className="flex flex-1 flex-col gap-2">
            <Input
              id="course-cover"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              disabled={update.isPending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={save}
                disabled={unchanged || update.isPending || trimmed.length === 0}
              >
                {update.isPending ? "Saving…" : "Save cover"}
              </Button>
              {imageUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUrl("");
                    update.mutate({ imageUrl: "" });
                  }}
                  disabled={update.isPending}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
