"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../lib";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Shows a rows-per-page select when given. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Noun for the count, e.g. "course" → "1–20 of 134 courses". */
  noun?: string;
  /** Plural when it isn't `noun` + "s" (quiz → quizzes). */
  plural?: string;
  className?: string;
}

const PAGE_SIZES = [10, 20, 30, 50];

/** "1–20 of 134" with previous / next (§8). Renders nothing when everything fits on one page and there's no size select. */
export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun,
  plural,
  className,
}: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const label = noun ? ` ${total === 1 ? noun : (plural ?? `${noun}s`)}` : "";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-foreground-muted text-sm tabular-nums">
        {from.toLocaleString("en-GB")}–{to.toLocaleString("en-GB")} of{" "}
        {total.toLocaleString("en-GB")}
        {label}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-foreground-muted px-1 text-sm tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
};
