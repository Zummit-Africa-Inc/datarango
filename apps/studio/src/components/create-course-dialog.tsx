"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@datarango/ui";

import { useCreateCourse } from "@/hooks/catalog";

/** Lowercases, strips punctuation and collapses runs of spaces into hyphens. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);

export const CreateCourseDialog = () => {
  const router = useRouter();
  const create = useCreateCourse();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  // Tracked separately so a creator who edits the slug isn't fighting the
  // title-derived default on every keystroke.
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const canSubmit = title.trim().length > 0 && effectiveSlug.length > 0;

  const reset = () => {
    setTitle("");
    setSummary("");
    setSlug("");
    setSlugTouched(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    create.mutate(
      {
        slug: effectiveSlug,
        title: title.trim(),
        summary: summary.trim(),
        prices: [],
        creatorRevenueShareBps: 0,
      },
      {
        onSuccess: (course) => {
          setOpen(false);
          reset();
          router.push(`/courses/${course.id}`);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>New course</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a course</DialogTitle>
            <DialogDescription>
              You can rename it later. The slug has to be unique across your own courses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="course-title">Title</Label>
              <Input
                id="course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Machine Learning"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course-slug">Slug</Label>
              <Input
                id="course-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="introduction-to-machine-learning"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="course-summary">Summary</Label>
              <Textarea
                id="course-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What a learner walks away with."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || create.isPending}>
              {create.isPending ? "Creating…" : "Create course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
