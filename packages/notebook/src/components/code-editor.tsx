"use client";

import { useEffect, useRef } from "react";

import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";

export interface CodeEditorProps {
  value: string;
  language: "python" | "markdown";
  onChange: (value: string) => void;
  /** Shift+Enter: run, then move to the next cell. */
  onRunAndAdvance?: () => void;
  /** Ctrl/Cmd+Enter: run in place. */
  onRun?: () => void;
  onFocus?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

const theme = EditorView.theme({
  "&": { fontSize: "13px", backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  "&, .cm-content, .cm-tooltip": { fontFamily: "var(--font-mono, ui-monospace, monospace)" },
  ".cm-content": { padding: "8px 0" },
  ".cm-line": { padding: "0 12px" },
  ".cm-gutters": { display: "none" },
  ".cm-placeholder": { color: "var(--foreground-subtle)" },
});

/**
 * One CodeMirror 6 editor per cell. Uncontrolled after mount: the document
 * lives in CodeMirror and is reported up through `onChange`, so typing never
 * round-trips through React state into the editor.
 */
export const CodeEditor = ({
  value,
  language,
  onChange,
  onRunAndAdvance,
  onRun,
  onFocus,
  autoFocus,
  placeholder,
}: CodeEditorProps) => {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Handlers change every render; the editor is built once. Read them through refs.
  const handlers = useRef({ onChange, onRunAndAdvance, onRun, onFocus });
  handlers.current = { onChange, onRunAndAdvance, onRun, onFocus };

  useEffect(() => {
    if (!host.current) return;
    const run = (which: "onRun" | "onRunAndAdvance") => () => {
      handlers.current[which]?.();
      return true;
    };
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          keymap.of([
            { key: "Shift-Enter", run: run("onRunAndAdvance") },
            { key: "Mod-Enter", run: run("onRun") },
            ...closeBracketsKeymap,
            ...historyKeymap,
            indentWithTab,
            ...defaultKeymap,
          ]),
          history(),
          closeBrackets(),
          bracketMatching(),
          indentOnInput(),
          indentUnit.of("    "),
          autocompletion({ activateOnTyping: false }),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          language === "python" ? python() : markdown(),
          EditorView.lineWrapping,
          placeholder ? placeholderExt(placeholder) : [],
          theme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) handlers.current.onChange(update.state.doc.toString());
            if (update.focusChanged && update.view.hasFocus) handlers.current.onFocus?.();
          }),
        ],
      }),
    });
    view.current = editor;
    if (autoFocus) editor.focus();
    return () => {
      editor.destroy();
      view.current = null;
    };
    // Built once per cell; later `value` changes come from the editor itself.
  }, [language]);

  // A value set from outside (e.g. a notebook reloaded from disk) replaces the doc.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="min-h-9" />;
};
