"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button, Input } from "@datarango/ui";

export const Pager = ({
  page,
  pages,
  total,
  noun,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) => (
  <div className="flex items-center justify-between">
    <p className="text-muted-foreground text-sm">
      Page {page} of {pages} · {total} {noun}
    </p>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  </div>
);

export const Notice = ({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
}) => (
  <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
    {icon}
    <p className="font-heading text-ink mt-3 text-lg">{title}</p>
    <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">{body}</p>
  </div>
);

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "Never";
  // A bare date ("2026-12-01") is a calendar day, not UTC midnight: read it
  // as local so it doesn't show as the day before west of Greenwich.
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(iso);
  return date.toLocaleDateString();
};

/** `value`, settled for `delay` ms, so a search box doesn't query on every keystroke. */
export const useDebounced = <T,>(value: T, delay = 300) => {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
};

export const SearchBox = ({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) => (
  <div className="relative w-full max-w-sm">
    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
    <Input
      aria-label={label}
      className="pl-9"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

/** "3 days ago"-style text for recent dates, the date itself for older ones. */
export const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
};
