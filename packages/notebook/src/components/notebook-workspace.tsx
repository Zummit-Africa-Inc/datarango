"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FileText, Loader2, Pencil, RefreshCw, Trash2, X } from "lucide-react";

import {
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from "@datarango/ui";

import { createNotebook, deleteFile, listFiles, renameFile } from "../contents";
import { type ContentsEntry } from "../types";
import { useKernel } from "../use-kernel";
import { KernelBadge, NotebookEditor } from "./notebook-editor";

/**
 * Creates `Untitled.ipynb` (or the next free name) and opens it. A hook so the
 * page can put "New notebook" in its own header, next to the session controls.
 */
export const useNewNotebook = (sessionId: string, onOpen: (path: string) => void) => {
  const [creating, setCreating] = useState(false);
  const create = useCallback(async () => {
    setCreating(true);
    try {
      const entry = await createNotebook(sessionId, await listFiles(sessionId));
      onOpen(entry.path);
    } finally {
      setCreating(false);
    }
  }, [sessionId, onOpen]);
  return { create, creating };
};

export interface NotebookWorkspaceProps {
  sessionId: string;
  /** The open notebook's path, or null for none. Owned by the page (it lives in the URL). */
  path: string | null;
  onOpen: (path: string | null) => void;
  /** Whether the notebook history panel is open. Owned by the page, whose header has the button. */
  historyOpen: boolean;
  onHistoryOpenChange: (open: boolean) => void;
}

/**
 * The open notebook at full width, with the learner's notebooks in a side
 * panel. One kernel is shared by all of them — the session has exactly one,
 * so switching notebooks keeps the variables, as a single Jupyter kernel would.
 */
export const NotebookWorkspace = ({
  sessionId,
  path,
  onOpen,
  historyOpen,
  onHistoryOpenChange,
}: NotebookWorkspaceProps) => {
  const { kernel, status, error } = useKernel(sessionId);

  return (
    <section className="min-w-0">
      {error && (
        <p className="text-destructive mb-3 text-sm">Could not connect to the kernel: {error}</p>
      )}
      {path ? (
        <NotebookEditor
          key={path}
          sessionId={sessionId}
          path={path}
          kernel={kernel}
          kernelStatus={status}
        />
      ) : (
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <FileText className="text-muted-foreground mx-auto size-7" strokeWidth={1.5} />
          <p className="text-ink mt-3 font-medium">No notebook open</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Start a new notebook, or open one from History.
          </p>
          <div className="mt-3 flex justify-center">
            <KernelBadge status={status} />
          </div>
        </div>
      )}

      <NotebookHistory
        sessionId={sessionId}
        open={historyOpen}
        onOpenChange={onHistoryOpenChange}
        activePath={path}
        onOpen={(next) => {
          onOpen(next);
          if (next) onHistoryOpenChange(false);
        }}
      />
    </section>
  );
};

interface NotebookHistoryProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePath: string | null;
  onOpen: (path: string | null) => void;
}

/** The learner's notebooks, newest first, in a side panel. */
const NotebookHistory = ({
  sessionId,
  open,
  onOpenChange,
  activePath,
  onOpen,
}: NotebookHistoryProps) => {
  const [files, setFiles] = useState<ContentsEntry[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const entries = await listFiles(sessionId);
      setFiles(
        entries
          .filter((e) => e.type === "notebook")
          .sort((a, b) => b.last_modified.localeCompare(a.last_modified)),
      );
      setListError(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Could not list your files");
    }
  }, [sessionId]);

  // Listed on open rather than kept live: saves happen every few seconds and
  // nobody is looking at the list while they do.
  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 gap-0 p-0 sm:max-w-80">
        <SheetHeader className="border-hairline border-b">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>Notebook history</SheetTitle>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Refresh"
              title="Refresh"
              onClick={() => void refresh()}
            >
              <RefreshCw />
            </Button>
          </div>
          <SheetDescription>
            Saved to your home folder — kept when the session ends.
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto">
          {listError ? (
            <p className="text-destructive px-4 py-3 text-xs">{listError}</p>
          ) : !files ? (
            <p className="text-muted-foreground flex items-center gap-2 px-4 py-3 text-xs">
              <Loader2 className="size-3 animate-spin" /> Loading…
            </p>
          ) : files.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">No notebooks yet.</p>
          ) : (
            <ul className="py-1">
              {files.map((file) => (
                <FileRow
                  key={file.path}
                  file={file}
                  active={file.path === activePath}
                  onOpen={() => onOpen(file.path)}
                  onRename={async (to) => {
                    await renameFile(sessionId, file.path, to);
                    await refresh();
                    if (file.path === activePath) onOpen(to);
                  }}
                  onDelete={async () => {
                    await deleteFile(sessionId, file.path);
                    await refresh();
                    if (file.path === activePath) onOpen(null);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const modified = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const FileRow = ({
  file,
  active,
  onOpen,
  onRename,
  onDelete,
}: {
  file: ContentsEntry;
  active: boolean;
  onOpen: () => void;
  onRename: (to: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) => {
  const [mode, setMode] = useState<"view" | "rename" | "confirm-delete">("view");
  const [name, setName] = useState(file.name.replace(/\.ipynb$/, ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "rename") {
    const submit = () => {
      const trimmed = name.trim().replace(/[\\/]/g, "-");
      if (!trimmed || `${trimmed}.ipynb` === file.name) return setMode("view");
      void act(() => onRename(`${trimmed}.ipynb`));
    };
    return (
      <li className="px-3 py-1.5">
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            size="icon-xs"
            variant="ghost"
            type="submit"
            aria-label="Save name"
            disabled={busy}
          >
            <Check />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            type="button"
            aria-label="Cancel"
            onClick={() => setMode("view")}
          >
            <X />
          </Button>
        </form>
        {error && <p className="text-destructive mt-1 text-[11px]">{error}</p>}
      </li>
    );
  }

  return (
    <li className={cn("group flex items-center gap-1 px-3 py-0.5", active && "bg-muted")}>
      <button
        type="button"
        onClick={onOpen}
        className="text-ink hover:text-ink/80 flex min-w-0 flex-1 items-start gap-2 py-1.5 text-left"
      >
        <FileText className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm">{file.name}</span>
          <span className="text-muted-foreground block text-[11px]">
            {modified(file.last_modified)}
          </span>
        </span>
      </button>
      {mode === "confirm-delete" ? (
        <>
          <Button
            size="xs"
            variant="destructive"
            disabled={busy}
            onClick={() => void act(onDelete)}
          >
            Delete
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Cancel"
            onClick={() => setMode("view")}
          >
            <X />
          </Button>
        </>
      ) : (
        <div className="hidden gap-0.5 group-hover:flex">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Rename"
            title="Rename"
            onClick={() => setMode("rename")}
          >
            <Pencil />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Delete"
            title="Delete"
            onClick={() => setMode("confirm-delete")}
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {error && <p className="text-destructive text-[11px]">{error}</p>}
    </li>
  );
};
