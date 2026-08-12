"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Upload, Volume2 } from "lucide-react";

import { Badge, Button } from "@datarango/ui";

import { MediaUploadDialog } from "@/components/media-upload-dialog";
import { courseTreeKey, type Lesson } from "@/hooks/catalog";

/**
 * The media state of a video or audio lesson, and the way to change it.
 *
 * The upload is attached as the opaque pair `("lesson", lessonId)`. Nothing in
 * platform.media knows what a lesson is; it announces that an asset attached to
 * that pair is playable, and learning's `MediaReadyConsumer` is what recognises
 * the kind and writes the playback id onto the lesson.
 *
 * That consumer runs **as the uploader**, not as a privileged worker — catalog
 * rows are creator-scoped, so a video only binds when the person who uploaded it
 * is the course's creator. Here that holds by construction: the ticket is issued
 * from the creator's own studio session. It is worth knowing anyway, because it
 * is why an upload made by anyone else silently binds nothing.
 */
export const LessonMedia = ({
  courseId,
  lesson,
  frozen,
}: {
  courseId: string;
  lesson: Lesson;
  /** The course is published, so ordinary lesson edits are refused. */
  frozen: boolean;
}) => {
  const queryClient = useQueryClient();
  const [awaiting, setAwaiting] = useState(false);

  const attached = !!lesson.muxPlaybackId;
  const Icon = lesson.kind === "audio" ? Volume2 : Clapperboard;
  const noun = lesson.kind === "audio" ? "audio" : "video";

  /**
   * Uploading is offered on a published lesson **only when nothing is attached
   * yet**, which is precisely the case the backend's publish-freeze exemption
   * exists for: transcoding finishes on the provider's schedule, so a creator
   * who publishes before their video is ready must still be able to complete
   * the lesson they already authored.
   *
   * Replacing an existing video on a published course is a different act — that
   * is editing published content, and it belongs in a new version. The server
   * would permit it (`SetLessonMuxAsync` deliberately carries no status guard),
   * so this is the UI declining to offer something rather than a control; the
   * point is not to quietly turn an exemption for unfinished work into a way to
   * swap out what learners are already watching.
   */
  const canUpload = !frozen || !attached;

  const settled = () => {
    setAwaiting(true);
    // The playback id is not written by this request — it arrives minutes later
    // over JetStream — so this refetch is for the case where it already has.
    void queryClient.invalidateQueries({ queryKey: courseTreeKey(courseId) });
  };

  return (
    <div className="flex items-center gap-2">
      {attached ? (
        <Badge variant="success" className="gap-1">
          <Icon className="size-3" />
          {noun === "audio" ? "Audio" : "Video"} attached
        </Badge>
      ) : awaiting ? (
        <Badge variant="warning">Transcoding…</Badge>
      ) : (
        <Badge variant="outline" className="gap-1">
          <Icon className="size-3" />
          No {noun}
        </Badge>
      )}

      {canUpload && (
        <MediaUploadDialog
          attach={{ kind: "lesson", id: lesson.id }}
          onSettled={settled}
          title={attached ? `Replace the ${noun}` : `Upload ${noun} for this lesson`}
          description={
            attached
              ? `This replaces what learners currently see on "${lesson.title}". The new file becomes playable once transcoding finishes.`
              : `The file goes to the transcoder and attaches itself to "${lesson.title}" when it is ready — you don't have to come back and link it.`
          }
          trigger={
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`${attached ? "Replace" : "Upload"} ${noun} for ${lesson.title}`}
            >
              <Upload className="size-3.5" />
            </Button>
          }
        />
      )}
    </div>
  );
};
