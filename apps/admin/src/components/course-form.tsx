"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, Input, Textarea } from "@datarango/ui";

import { Field, FormActions, FormSection } from "@/components/form";
import { lines, type CourseInput } from "@/hooks/courses";

/**
 * A Datarango course's catalogue details. Used to create a platform course and
 * to edit one; the modules and lessons come after, and the course goes to the
 * review queue like any creator's.
 */
export const CourseForm = ({
  initial,
  submitLabel,
  busy,
  cancelHref,
  onSubmit,
}: {
  initial?: Partial<CourseInput>;
  submitLabel: string;
  busy: boolean;
  cancelHref: string;
  onSubmit: (input: CourseInput) => void;
}) => {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience ?? "");
  const [overview, setOverview] = useState(initial?.overview ?? "");
  const [outcomes, setOutcomes] = useState((initial?.learningOutcomes ?? []).join("\n"));
  const [prerequisites, setPrerequisites] = useState((initial?.prerequisites ?? []).join("\n"));

  const valid = title.trim().length >= 3 && summary.trim().length > 0;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: title.trim(),
          summary: summary.trim(),
          imageUrl: imageUrl.trim() || null,
          overview: overview.trim() || null,
          targetAudience: targetAudience.trim() || null,
          learningOutcomes: lines(outcomes),
          prerequisites: lines(prerequisites),
        });
      }}
    >
      <FormSection title="Course" cols={2}>
        <Field label="Title" htmlFor="course-title">
          <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Who it's for" htmlFor="course-audience" hint="e.g. Analysts new to SQL.">
          <Input
            id="course-audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
          />
        </Field>
        <Field label="Summary" htmlFor="course-summary" hint="One line, shown on catalogue cards.">
          <Input id="course-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <Field label="Cover image URL" htmlFor="course-image" hint="Optional. https:// address.">
          <Input
            id="course-image"
            type="url"
            placeholder="https://"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Description" cols={3}>
        <Field label="Overview" htmlFor="course-overview" span="full">
          <Textarea
            id="course-overview"
            rows={5}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
          />
        </Field>
        <Field
          label="What learners will be able to do"
          htmlFor="course-outcomes"
          hint="One per line."
          span={2}
        >
          <Textarea
            id="course-outcomes"
            rows={5}
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
          />
        </Field>
        <Field label="Before starting" htmlFor="course-prereqs" hint="One per line.">
          <Textarea
            id="course-prereqs"
            rows={5}
            value={prerequisites}
            onChange={(e) => setPrerequisites(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormActions>
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={!valid || busy}>
          {submitLabel}
        </Button>
      </FormActions>
    </form>
  );
};
