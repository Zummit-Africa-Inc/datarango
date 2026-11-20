/**
 * The slice of nbformat 4 this client reads and writes. Files are saved as
 * real `.ipynb`, so anything here must round-trip through Jupyter itself.
 */

export type MultilineString = string | string[];

/** MIME type → data. Text types may arrive split into lines. */
export type MimeBundle = Record<string, MultilineString | object>;

export type Output =
  | { output_type: "stream"; name: "stdout" | "stderr"; text: MultilineString }
  | {
      output_type: "display_data";
      data: MimeBundle;
      metadata: Record<string, unknown>;
      transient?: { display_id?: string };
    }
  | {
      output_type: "execute_result";
      data: MimeBundle;
      metadata: Record<string, unknown>;
      execution_count: number | null;
    }
  | { output_type: "error"; ename: string; evalue: string; traceback: string[] };

export interface CodeCell {
  cell_type: "code";
  id: string;
  source: MultilineString;
  metadata: Record<string, unknown>;
  execution_count: number | null;
  outputs: Output[];
}

export interface MarkdownCell {
  cell_type: "markdown";
  id: string;
  source: MultilineString;
  metadata: Record<string, unknown>;
}

export interface RawCell {
  cell_type: "raw";
  id: string;
  source: MultilineString;
  metadata: Record<string, unknown>;
}

export type Cell = CodeCell | MarkdownCell | RawCell;

export interface NotebookDocument {
  nbformat: 4;
  nbformat_minor: number;
  metadata: Record<string, unknown>;
  cells: Cell[];
}

/** A file or directory as the Jupyter contents API lists it. */
export interface ContentsEntry {
  name: string;
  path: string;
  type: "notebook" | "file" | "directory";
  last_modified: string;
  created: string;
  size: number | null;
  writable: boolean;
}

/** What the kernel is doing, plus the connection states around it. */
export type KernelStatus =
  "connecting" | "idle" | "busy" | "starting" | "restarting" | "disconnected" | "dead";

export const joinSource = (source: MultilineString): string =>
  Array.isArray(source) ? source.join("") : source;

/**
 * nbformat stores text as a list of lines, each keeping its newline. Writing
 * it that way keeps saved files diff-friendly and identical to what JupyterLab
 * writes.
 */
export const splitSource = (text: string): string[] => {
  if (text === "") return [];
  const lines = text.split("\n");
  return lines
    .map((line, i) => (i < lines.length - 1 ? `${line}\n` : line))
    .filter((l) => l !== "");
};
