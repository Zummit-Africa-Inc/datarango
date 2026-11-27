"use client";

import type { ReactNode } from "react";

import { Button } from "@datarango/ui";

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

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString() : "Never";
