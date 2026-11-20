/**
 * @datarango/notebook — the Jupyter notebook client (FRONTEND-HANDOFF §6).
 *
 * A typed kernel protocol client over the gateway's kernel proxy, the
 * contents API for `.ipynb` files on the learner's home volume, CodeMirror 6
 * cells and output rendering (HTML in sandboxed iframes). Mounted by `web`.
 * Still to come: exercise mode and studio exercise authoring.
 */
export { NotebookWorkspace, useNewNotebook } from "./components/notebook-workspace";
export type { NotebookWorkspaceProps } from "./components/notebook-workspace";
export { KernelBadge, NotebookEditor } from "./components/notebook-editor";
export type { NotebookEditorProps } from "./components/notebook-editor";
export { OutputArea } from "./components/output-area";
export { CodeEditor } from "./components/code-editor";
export { KernelClient } from "./kernel";
export type { ExecuteHandlers, ExecuteResult } from "./kernel";
export { useKernel } from "./use-kernel";
export * from "./contents";
export * from "./types";
export { parseAnsi, stripAnsi } from "./ansi";
