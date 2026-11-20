import { getApi } from "@datarango/api";

import { type ContentsEntry, type NotebookDocument } from "./types";

/**
 * The learner's files, through the Jupyter contents API of their own kernel.
 *
 * They live on the per-user home volume, so they outlive the session: a new
 * kernel next week sees the same notebooks. That is also why there is no
 * datarango-side "notebooks" table — the volume is the source of truth.
 */

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

export const kernelBase = (sessionId: string) => `/notebook/kernels/${sessionId}`;

// The root has no trailing slash: Jupyter answers `/api/contents/` with an
// empty listing of a different directory, while `/api/contents` is the root.
const contentsUrl = (sessionId: string, path: string) =>
  `${kernelBase(sessionId)}/api/contents${path ? `/${encodePath(path)}` : ""}`;

export const listFiles = async (sessionId: string, dir = ""): Promise<ContentsEntry[]> => {
  const res = await getApi().get<{ content: ContentsEntry[] }>(contentsUrl(sessionId, dir), {
    params: { content: 1 },
  });
  return res.content;
};

export const readNotebook = async (sessionId: string, path: string): Promise<NotebookDocument> => {
  const res = await getApi().get<{ content: NotebookDocument }>(contentsUrl(sessionId, path), {
    params: { type: "notebook", content: 1 },
  });
  return res.content;
};

export const saveNotebook = (sessionId: string, path: string, content: NotebookDocument) =>
  getApi().put<ContentsEntry>(contentsUrl(sessionId, path), {
    type: "notebook",
    format: "json",
    content,
  });

export const emptyNotebook = (): NotebookDocument => ({
  nbformat: 4,
  nbformat_minor: 5,
  metadata: {
    kernelspec: { name: "python3", display_name: "Python 3", language: "python" },
    language_info: { name: "python" },
  },
  cells: [
    {
      cell_type: "code",
      id: crypto.randomUUID().slice(0, 8),
      source: [],
      metadata: {},
      execution_count: null,
      outputs: [],
    },
  ],
});

/**
 * Creates `Untitled.ipynb`, `Untitled1.ipynb`, … — the first free name — with
 * one empty cell. Name choice is done here rather than by Jupyter's
 * "create untitled" call so the file starts with a proper kernelspec.
 */
export const createNotebook = async (sessionId: string, existing: ContentsEntry[]) => {
  const taken = new Set(existing.map((e) => e.name));
  let n = 0;
  while (taken.has(n === 0 ? "Untitled.ipynb" : `Untitled${n}.ipynb`)) n += 1;
  const name = n === 0 ? "Untitled.ipynb" : `Untitled${n}.ipynb`;
  return saveNotebook(sessionId, name, emptyNotebook());
};

export const renameFile = (sessionId: string, from: string, to: string) =>
  getApi().patch<ContentsEntry>(contentsUrl(sessionId, from), { path: to });

export const deleteFile = (sessionId: string, path: string) =>
  getApi().delete<void>(contentsUrl(sessionId, path));
