"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button, Input, Label, Markdown, Textarea } from "@datarango/ui";

import { useUpdateCourseOverview, type Course } from "@/hooks/catalog";

const MAX_OVERVIEW = 20_000;
const MAX_ENTRY = 240;
const MAX_OUTCOMES = 12;
const MAX_PREREQUISITES = 10;

/**
 * The course description: overview, what you'll learn, prerequisites, audience.
 *
 * Unlike every other control in the builder, this one stays live on a PUBLISHED
 * course. That is not an oversight in the freeze — it is what the freeze was
 * always scoped to. Structure and lesson content are what a learner is working
 * through and must not move underneath them; this is the shop window, read
 * while deciding whether to enrol, and each published version snapshots it. So
 * correcting a description leaves everyone already enrolled with exactly the
 * promise they signed up to. `catalog.published_immutable` still refuses every
 * other edit on this page.
 *
 * Outcomes and prerequisites are lists rather than more markdown: they render as
 * a grid on the learner's page, and a creator's own bullet characters inside a
 * blob are not something a facet or a future recommendation can read.
 */
export const CourseOverviewEditor = ({ course }: { course: Course }) => {
  const save = useUpdateCourseOverview(course.id);

  const [overview, setOverview] = useState(course.overview ?? "");
  const [outcomes, setOutcomes] = useState<string[]>(course.learningOutcomes);
  const [prerequisites, setPrerequisites] = useState<string[]>(course.prerequisites);
  const [audience, setAudience] = useState(course.targetAudience ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");

  // The tree refetches after every mutation, so a change made elsewhere (or a
  // server-side normalisation, like blank entries being dropped) has to win.
  useEffect(() => {
    setOverview(course.overview ?? "");
    setOutcomes(course.learningOutcomes);
    setPrerequisites(course.prerequisites);
    setAudience(course.targetAudience ?? "");
  }, [course.overview, course.learningOutcomes, course.prerequisites, course.targetAudience]);

  const cleaned = (entries: string[]) => entries.map((e) => e.trim()).filter(Boolean);
  const sameList = (a: string[], b: string[]) =>
    a.length === b.length && a.every((entry, i) => entry === b[i]);

  const dirty =
    overview.trim() !== (course.overview ?? "") ||
    audience.trim() !== (course.targetAudience ?? "") ||
    !sameList(cleaned(outcomes), course.learningOutcomes) ||
    !sameList(cleaned(prerequisites), course.prerequisites);

  const tooLong = overview.length > MAX_OVERVIEW;
  const overlong = [...outcomes, ...prerequisites].some((e) => e.trim().length > MAX_ENTRY);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || tooLong || overlong) return;
    // Everything travels every time: absent means "leave alone" on this
    // endpoint, so a cleared field has to be sent as an empty string or an
    // empty array or it would silently keep its old value.
    save.mutate({
      overview: overview.trim(),
      learningOutcomes: cleaned(outcomes),
      prerequisites: cleaned(prerequisites),
      targetAudience: audience.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="border-hairline bg-card space-y-6 rounded-xs border p-4">
      <div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="course-overview">Overview</Label>
          <div className="bg-surface-strong inline-flex rounded-sm p-0.5">
            {(["write", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={
                  m === mode
                    ? "bg-card text-ink rounded-xs px-3 py-1 text-xs font-medium capitalize shadow-xs"
                    : "text-muted-foreground hover:text-ink rounded-xs px-3 py-1 text-xs capitalize transition-colors"
                }
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          What the course covers and who it&apos;s for, in markdown. This is the long read on the
          course page — the summary above is the one line on a card.
        </p>

        {mode === "write" ? (
          <Textarea
            id="course-overview"
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder={
              "## What this course covers\n\nStart with the problem it solves.\n\n- how it's structured\n- what you'll build"
            }
            className="font-code mt-3 min-h-55 text-xs leading-relaxed"
          />
        ) : (
          <div className="border-hairline bg-surface-strong/40 mt-3 max-h-70 overflow-y-auto overscroll-contain rounded-sm border p-4">
            {overview.trim() ? (
              <Markdown>{overview}</Markdown>
            ) : (
              <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
            )}
          </div>
        )}
        <p
          className={`mt-1 text-xs ${tooLong ? "text-destructive" : "text-muted-foreground"}`}
          aria-live="polite"
        >
          {overview.length.toLocaleString()} / {MAX_OVERVIEW.toLocaleString()} characters
        </p>
      </div>

      <BulletField
        id="learning-outcomes"
        label="What you'll learn"
        hint="One outcome per line. These render as a grid at the top of the course page, so lead with the verb — “Build a retrieval pipeline”, not “Retrieval”."
        addLabel="Add outcome"
        max={MAX_OUTCOMES}
        entries={outcomes}
        onChange={setOutcomes}
      />

      <BulletField
        id="prerequisites"
        label="Prerequisites"
        hint="What someone should already know. Leave empty if the course assumes nothing."
        addLabel="Add prerequisite"
        max={MAX_PREREQUISITES}
        entries={prerequisites}
        onChange={setPrerequisites}
      />

      <div>
        <Label htmlFor="target-audience">Who it&apos;s for</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          One line naming the reader. Helps someone rule the course in or out quickly.
        </p>
        <Input
          id="target-audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          maxLength={280}
          placeholder="Analysts moving into machine learning"
          className="mt-3"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {overlong && (
          <p className="text-destructive text-xs">
            Each entry must be {MAX_ENTRY} characters or fewer.
          </p>
        )}
        <Button type="submit" disabled={!dirty || tooLong || overlong || save.isPending}>
          {save.isPending ? "Saving…" : "Save overview"}
        </Button>
      </div>
    </form>
  );
};

/**
 * A small ordered list editor.
 *
 * Blank rows are allowed to exist while typing and are dropped on save — the
 * server drops them too, rather than rejecting the whole submission, so someone
 * who adds a row and changes their mind is not sent hunting for which one.
 */
const BulletField = ({
  id,
  label,
  hint,
  addLabel,
  max,
  entries,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  addLabel: string;
  max: number;
  entries: string[];
  onChange: (next: string[]) => void;
}) => (
  <div>
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={`${id}-0`}>{label}</Label>
      <span className="text-muted-foreground text-xs">
        {entries.filter((e) => e.trim()).length} / {max}
      </span>
    </div>
    <p className="text-muted-foreground mt-1 text-xs">{hint}</p>

    <ul className="mt-3 space-y-2">
      {entries.map((entry, index) => (
        // Index as key is correct here and only here: the rows have no identity
        // of their own, and a value-based key would remount the input on every
        // keystroke and lose the caret.
        <li key={index} className="flex items-center gap-2">
          <Input
            id={`${id}-${index}`}
            value={entry}
            maxLength={MAX_ENTRY}
            onChange={(e) => onChange(entries.map((v, i) => (i === index ? e.target.value : v)))}
            aria-label={`${label} ${index + 1}`}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`Remove ${label} ${index + 1}`}
            onClick={() => onChange(entries.filter((_, i) => i !== index))}
          >
            <X className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>

    {entries.length < max && (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => onChange([...entries, ""])}
      >
        <Plus className="size-3.5" />
        {addLabel}
      </Button>
    )}
  </div>
);
