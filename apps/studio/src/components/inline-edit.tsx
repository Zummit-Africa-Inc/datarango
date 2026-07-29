"use client";

import { useEffect, useState } from "react";

import { Input, cn } from "@datarango/ui";

/**
 * Click-to-rename field. Commits on Enter or blur, reverts on Escape, and does
 * nothing when the value is unchanged or blank — so a stray focus never fires a
 * pointless PATCH.
 */
export const InlineEdit = ({
  value,
  onCommit,
  className,
  ariaLabel,
}: {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  ariaLabel: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Re-sync when the server value changes underneath us (refetch, another tab).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === value) {
      setDraft(value);
      return;
    }
    onCommit(next);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "hover:bg-muted/60 -mx-1 truncate rounded-xs px-1 text-left transition-colors",
          className,
        )}
        aria-label={`${ariaLabel} (click to rename)`}
      >
        {value}
      </button>
    );
  }

  return (
    <Input
      autoFocus
      aria-label={ariaLabel}
      value={draft}
      className={cn("h-7", className)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );
};
