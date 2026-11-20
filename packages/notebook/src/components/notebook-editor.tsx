"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Code2,
  Loader2,
  Play,
  PlayCircle,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Type,
} from "lucide-react";

import { Badge, Button, Markdown, cn } from "@datarango/ui";

import { readNotebook, saveNotebook } from "../contents";
import { type KernelClient } from "../kernel";
import {
  joinSource,
  splitSource,
  type Cell,
  type KernelStatus,
  type NotebookDocument,
  type Output,
} from "../types";
import { CodeEditor } from "./code-editor";
import { OutputArea } from "./output-area";

/** A cell as the editor holds it: source as one string, plus run state. */
interface EditorCell {
  id: string;
  type: Cell["cell_type"];
  source: string;
  metadata: Record<string, unknown>;
  outputs: Output[];
  executionCount: number | null;
  run: "idle" | "queued" | "running";
}

const newCellId = () => crypto.randomUUID().slice(0, 8);

const blankCell = (type: EditorCell["type"] = "code"): EditorCell => ({
  id: newCellId(),
  type,
  source: "",
  metadata: {},
  outputs: [],
  executionCount: null,
  run: "idle",
});

const fromDocument = (doc: NotebookDocument): EditorCell[] => {
  const cells = doc.cells.map((cell) => ({
    id: cell.id || newCellId(),
    type: cell.cell_type,
    source: joinSource(cell.source),
    metadata: cell.metadata ?? {},
    outputs: cell.cell_type === "code" ? cell.outputs : [],
    executionCount: cell.cell_type === "code" ? cell.execution_count : null,
    run: "idle" as const,
  }));
  return cells.length ? cells : [blankCell()];
};

const toDocument = (base: NotebookDocument | null, cells: EditorCell[]): NotebookDocument => ({
  nbformat: 4,
  nbformat_minor: Math.max(base?.nbformat_minor ?? 5, 5),
  metadata: base?.metadata ?? {},
  cells: cells.map((cell): Cell => {
    const common = { id: cell.id, source: splitSource(cell.source), metadata: cell.metadata };
    return cell.type === "code"
      ? {
          ...common,
          cell_type: "code",
          outputs: cell.outputs,
          execution_count: cell.executionCount,
        }
      : { ...common, cell_type: cell.type };
  }),
});

/** Consecutive prints arrive as many stream messages; Jupyter shows them as one block. */
const appendOutput = (outputs: Output[], next: Output): Output[] => {
  const last = outputs[outputs.length - 1];
  if (last?.output_type === "stream" && next.output_type === "stream" && last.name === next.name) {
    return [
      ...outputs.slice(0, -1),
      { ...last, text: joinSource(last.text) + joinSource(next.text) },
    ];
  }
  return [...outputs, next];
};

type SaveState = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 2_000;

export interface NotebookEditorProps {
  sessionId: string;
  path: string;
  kernel: KernelClient | null;
  kernelStatus: KernelStatus;
}

export const NotebookEditor = ({ sessionId, path, kernel, kernelStatus }: NotebookEditorProps) => {
  const [cells, setCells] = useState<EditorCell[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingMarkdown, setEditingMarkdown] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");

  const base = useRef<NotebookDocument | null>(null);
  const cellsRef = useRef<EditorCell[]>([]);
  cellsRef.current = cells ?? [];
  // Runs go through one promise chain so cells execute in the order queued.
  const queue = useRef<Promise<void>>(Promise.resolve());
  // Bumped by interrupt/restart: queued runs from an older generation are dropped.
  const generation = useRef(0);

  // ── load ──
  useEffect(() => {
    let cancelled = false;
    setCells(null);
    setLoadError(null);
    readNotebook(sessionId, path)
      .then((doc) => {
        if (cancelled) return;
        base.current = doc;
        const loaded = fromDocument(doc);
        setCells(loaded);
        setSelected(loaded[0]?.id ?? null);
        setSaveState("saved");
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Could not open the notebook");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, path]);

  // ── save ──
  const save = useCallback(async () => {
    if (!cellsRef.current.length) return;
    setSaveState("saving");
    try {
      await saveNotebook(sessionId, path, toDocument(base.current, cellsRef.current));
      setSaveState((s) => (s === "saving" ? "saved" : s));
    } catch {
      setSaveState("error");
    }
  }, [sessionId, path]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => void save(), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [saveState, cells, save]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // ── cell edits ──
  const update = useCallback(
    (id: string, change: (cell: EditorCell) => EditorCell, dirty = true) => {
      setCells(
        (current) => current?.map((cell) => (cell.id === id ? change(cell) : cell)) ?? current,
      );
      if (dirty) setSaveState("dirty");
    },
    [],
  );

  const insertAfter = (id: string | null, type: EditorCell["type"] = "code") => {
    const cell = blankCell(type);
    setCells((current) => {
      if (!current) return current;
      const at = id ? current.findIndex((c) => c.id === id) + 1 : current.length;
      return [...current.slice(0, at), cell, ...current.slice(at)];
    });
    setSelected(cell.id);
    if (type === "markdown") setEditingMarkdown(cell.id);
    setSaveState("dirty");
    return cell.id;
  };

  const remove = (id: string) => {
    setCells((current) => {
      if (!current) return current;
      const next = current.filter((c) => c.id !== id);
      return next.length ? next : [blankCell()];
    });
    setSaveState("dirty");
  };

  const move = (id: string, delta: -1 | 1) => {
    setCells((current) => {
      if (!current) return current;
      const from = current.findIndex((c) => c.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [cell] = next.splice(from, 1);
      if (cell) next.splice(to, 0, cell);
      return next;
    });
    setSaveState("dirty");
  };

  const setType = (id: string, type: EditorCell["type"]) => {
    update(id, (cell) => ({ ...cell, type, outputs: [], executionCount: null }));
    if (type === "markdown") setEditingMarkdown(id);
  };

  // ── running ──
  const execute = useCallback(
    async (id: string, gen: number) => {
      if (!kernel || gen !== generation.current) {
        update(id, (c) => ({ ...c, run: "idle" }), false);
        return;
      }
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || cell.type !== "code") return;

      let clearOnNext = false;
      update(id, (c) => ({ ...c, run: "running", outputs: [], executionCount: null }), false);
      await kernel.execute(cell.source, {
        onOutput: (output) =>
          update(
            id,
            (c) => {
              const outputs = clearOnNext ? [] : c.outputs;
              clearOnNext = false;
              return { ...c, outputs: appendOutput(outputs, output) };
            },
            false,
          ),
        onClear: (wait) => {
          if (wait) clearOnNext = true;
          else update(id, (c) => ({ ...c, outputs: [] }), false);
        },
        onExecutionCount: (count) => update(id, (c) => ({ ...c, executionCount: count }), false),
      });
      update(id, (c) => ({ ...c, run: "idle" }));
    },
    [kernel, update],
  );

  const enqueue = useCallback(
    (ids: string[]) => {
      const gen = generation.current;
      const code = ids.filter((id) => cellsRef.current.find((c) => c.id === id)?.type === "code");
      setCells(
        (current) =>
          current?.map((c) => (code.includes(c.id) ? { ...c, run: "queued" as const } : c)) ??
          current,
      );
      for (const id of code) queue.current = queue.current.then(() => execute(id, gen));
    },
    [execute],
  );

  const runCell = (id: string, advance: boolean) => {
    const cell = cellsRef.current.find((c) => c.id === id);
    if (cell?.type === "markdown") setEditingMarkdown(null);
    else enqueue([id]);
    if (!advance) return;
    const index = cellsRef.current.findIndex((c) => c.id === id);
    const next = cellsRef.current[index + 1];
    if (next) setSelected(next.id);
    else insertAfter(id);
  };

  const stopQueued = () => {
    generation.current += 1;
    setCells(
      (current) =>
        current?.map((c) => (c.run === "queued" ? { ...c, run: "idle" as const } : c)) ?? current,
    );
  };

  const interrupt = async () => {
    stopQueued();
    await kernel?.interrupt();
  };

  const restart = async () => {
    stopQueued();
    await kernel?.restart();
    setCells((current) => current?.map((c) => ({ ...c, run: "idle" as const })) ?? current);
  };

  if (loadError) {
    return (
      <div className="border-hairline bg-card rounded-xs border p-6 text-sm">
        <p className="text-destructive font-medium">Could not open {path}</p>
        <p className="text-muted-foreground mt-1">{loadError}</p>
      </div>
    );
  }

  if (!cells) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
        <Loader2 className="size-4 animate-spin" /> Opening {path}…
      </div>
    );
  }

  const ready = !!kernel && (kernelStatus === "idle" || kernelStatus === "busy");
  const anyRunning = cells.some((c) => c.run !== "idle");

  return (
    <div className="space-y-3">
      <div className="border-hairline bg-card sticky top-0 z-10 flex flex-wrap items-center gap-1.5 rounded-xs border px-2 py-1.5">
        <Button
          size="sm"
          variant="ghost"
          disabled={!ready}
          onClick={() => enqueue(cells.map((c) => c.id))}
        >
          <PlayCircle /> Run all
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!kernel || !anyRunning}
          onClick={() => void interrupt()}
        >
          <Square /> Interrupt
        </Button>
        <Button size="sm" variant="ghost" disabled={!kernel} onClick={() => void restart()}>
          <RotateCcw /> Restart
        </Button>
        <span className="bg-hairline mx-1 h-5 w-px" />
        <Button size="sm" variant="ghost" onClick={() => insertAfter(selected, "code")}>
          <Code2 /> Code
        </Button>
        <Button size="sm" variant="ghost" onClick={() => insertAfter(selected, "markdown")}>
          <Type /> Text
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator state={saveState} onSave={() => void save()} />
          <KernelBadge status={kernelStatus} />
        </div>
      </div>

      <div className="space-y-2">
        {cells.map((cell, index) => (
          <CellView
            key={cell.id}
            cell={cell}
            index={index}
            total={cells.length}
            selected={cell.id === selected}
            editing={cell.id === editingMarkdown}
            canRun={ready}
            onSelect={() => setSelected(cell.id)}
            onEditMarkdown={() => setEditingMarkdown(cell.id)}
            onChange={(source) => update(cell.id, (c) => ({ ...c, source }))}
            onRun={(advance) => runCell(cell.id, advance)}
            onMove={(delta) => move(cell.id, delta)}
            onDelete={() => remove(cell.id)}
            onSetType={(type) => setType(cell.id, type)}
          />
        ))}
      </div>

      <div className="flex justify-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => insertAfter(null, "code")}>
          <Code2 /> Add code
        </Button>
        <Button size="sm" variant="outline" onClick={() => insertAfter(null, "markdown")}>
          <Type /> Add text
        </Button>
      </div>
    </div>
  );
};

interface CellViewProps {
  cell: EditorCell;
  index: number;
  total: number;
  selected: boolean;
  editing: boolean;
  canRun: boolean;
  onSelect: () => void;
  onEditMarkdown: () => void;
  onChange: (source: string) => void;
  onRun: (advance: boolean) => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
  onSetType: (type: EditorCell["type"]) => void;
}

const CellView = ({
  cell,
  index,
  total,
  selected,
  editing,
  canRun,
  onSelect,
  onEditMarkdown,
  onChange,
  onRun,
  onMove,
  onDelete,
  onSetType,
}: CellViewProps) => {
  const isCode = cell.type === "code";
  const showRendered = cell.type === "markdown" && !editing;

  return (
    <div
      onMouseDown={onSelect}
      className={cn(
        "group bg-card relative rounded-xs border transition-colors",
        selected ? "border-ink/40" : "border-hairline",
      )}
    >
      <div className="flex">
        <div className="text-muted-foreground font-code flex w-14 shrink-0 flex-col items-end gap-1 pt-2 pr-2 text-[11px]">
          {isCode ? (
            <>
              <button
                type="button"
                aria-label="Run cell"
                disabled={!canRun}
                onClick={() => onRun(false)}
                className="hover:text-ink rounded p-0.5 disabled:opacity-40"
              >
                {cell.run === "running" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
              <span>
                [
                {cell.run === "queued"
                  ? "*"
                  : cell.run === "running"
                    ? "*"
                    : (cell.executionCount ?? " ")}
                ]
              </span>
            </>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {showRendered ? (
            <div className="cursor-text px-3 py-2" onDoubleClick={onEditMarkdown}>
              {cell.source.trim() ? (
                <Markdown>{cell.source}</Markdown>
              ) : (
                <p className="text-muted-foreground text-sm italic">Double-click to write text</p>
              )}
            </div>
          ) : (
            <div className={cn(isCode && "bg-muted/40")}>
              <CodeEditor
                value={cell.source}
                language={isCode ? "python" : "markdown"}
                onChange={onChange}
                onRun={() => onRun(false)}
                onRunAndAdvance={() => onRun(true)}
                onFocus={onSelect}
                autoFocus={selected && cell.source === ""}
                placeholder={
                  isCode ? "Python — Shift+Enter to run" : "Markdown — Shift+Enter to render"
                }
              />
            </div>
          )}
          {isCode && <OutputArea outputs={cell.outputs} />}
        </div>
      </div>

      <div
        className={cn(
          "bg-card border-hairline absolute -top-3 right-2 flex items-center gap-0.5 rounded-xs border px-1 shadow-xs",
          selected ? "flex" : "hidden group-hover:flex",
        )}
      >
        <IconButton
          label={isCode ? "Make text cell" : "Make code cell"}
          onClick={() => onSetType(isCode ? "markdown" : "code")}
        >
          {isCode ? <Type /> : <Code2 />}
        </IconButton>
        <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp />
        </IconButton>
        <IconButton label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown />
        </IconButton>
        <IconButton label="Delete cell" onClick={onDelete}>
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
};

const IconButton = ({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Button
    size="icon-xs"
    variant="ghost"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);

const SaveIndicator = ({ state, onSave }: { state: SaveState; onSave: () => void }) => (
  <button
    type="button"
    onClick={onSave}
    title="Save (Ctrl+S)"
    className={cn(
      "flex items-center gap-1 text-xs",
      state === "error" ? "text-destructive" : "text-muted-foreground hover:text-ink",
    )}
  >
    {state === "saving" ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
    {state === "saved" && "Saved"}
    {state === "dirty" && "Unsaved"}
    {state === "saving" && "Saving…"}
    {state === "error" && "Save failed — retry"}
  </button>
);

const KERNEL_LABEL: Record<
  KernelStatus,
  { label: string; variant: "success" | "outline" | "warning" | "destructive" }
> = {
  connecting: { label: "Connecting", variant: "outline" },
  starting: { label: "Starting", variant: "outline" },
  idle: { label: "Kernel idle", variant: "success" },
  busy: { label: "Kernel busy", variant: "warning" },
  restarting: { label: "Restarting", variant: "outline" },
  disconnected: { label: "Reconnecting", variant: "warning" },
  dead: { label: "Kernel unavailable", variant: "destructive" },
};

export const KernelBadge = ({ status }: { status: KernelStatus }) => {
  const meta = KERNEL_LABEL[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
};
