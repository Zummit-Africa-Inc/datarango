"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Markdown } from "@datarango/ui";

import { parseAnsi } from "../ansi";
import { joinSource, type MimeBundle, type MultilineString, type Output } from "../types";

/**
 * Renders a cell's outputs.
 *
 * HTML (pandas tables, styled frames, anything `IPython.display.HTML` makes) is
 * learner-controlled markup, so it runs in an iframe sandboxed **without**
 * `allow-same-origin`: scripts may run inside it, but it is a unique opaque
 * origin with no access to this page, its storage or the session.
 */
export const OutputArea = ({ outputs }: { outputs: Output[] }) => {
  if (outputs.length === 0) return null;
  return (
    <div className="space-y-2 overflow-x-auto px-3 py-2 text-sm">
      {outputs.map((output, i) => (
        <OutputView key={i} output={output} />
      ))}
    </div>
  );
};

const text = (value: MultilineString | object | undefined) =>
  typeof value === "string" || Array.isArray(value) ? joinSource(value as MultilineString) : "";

const OutputView = ({ output }: { output: Output }) => {
  switch (output.output_type) {
    case "stream":
      return (
        <Ansi
          text={joinSource(output.text)}
          className={output.name === "stderr" ? "bg-destructive/5 -mx-3 px-3" : undefined}
        />
      );
    case "error":
      return (
        <Ansi text={output.traceback.join("\n")} className="bg-destructive/5 -mx-3 px-3 py-1" />
      );
    case "display_data":
    case "execute_result":
      return <RichOutput data={output.data} />;
  }
};

const Ansi = ({ text: raw, className }: { text: string; className?: string }) => (
  <pre
    className={`font-code text-ink text-xs leading-relaxed whitespace-pre-wrap ${className ?? ""}`}
  >
    {parseAnsi(raw).map((segment, i) => (
      <span key={i} style={{ color: segment.color, fontWeight: segment.bold ? 600 : undefined }}>
        {segment.text}
      </span>
    ))}
  </pre>
);

/** Picks the richest MIME type we can show safely, Jupyter-style. */
const RichOutput = ({ data }: { data: MimeBundle }) => {
  if (data["text/html"]) return <HtmlFrame html={text(data["text/html"])} />;
  for (const mime of ["image/png", "image/jpeg", "image/gif"]) {
    if (data[mime]) {
      return (
        <img
          alt="Cell output"
          className="max-w-full"
          src={`data:${mime};base64,${text(data[mime]).replace(/\n/g, "")}`}
        />
      );
    }
  }
  if (data["image/svg+xml"]) {
    // As an <img>, an SVG cannot run script — unlike inline markup.
    return (
      <img
        alt="Cell output"
        className="max-w-full"
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(text(data["image/svg+xml"]))}`}
      />
    );
  }
  if (data["text/markdown"]) return <Markdown>{text(data["text/markdown"])}</Markdown>;
  if (data["application/json"]) {
    return <Ansi text={JSON.stringify(data["application/json"], null, 2)} />;
  }
  return <Ansi text={text(data["text/plain"])} />;
};

// The frame cannot see the app's theme (it may be light on a dark OS), so it
// gets the text colour the app actually renders rather than guessing from
// prefers-color-scheme.
const frameStyle = (color: string) => `
  :root { color-scheme: normal; }
  body { margin: 0; font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; color: ${color}; background: transparent; }
  table { border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { padding: 4px 10px; border-bottom: 1px solid rgba(127,127,127,.25); text-align: right; }
  thead th { border-bottom-width: 2px; }
  tbody tr:nth-child(odd) { background: rgba(127,127,127,.06); }
`;

// Reports the content height so the frame can size itself; the frame has no
// way to reach the parent other than this message.
const RESIZE_SCRIPT = `
  const post = () => parent.postMessage({ type: "dr-output-height", height: document.documentElement.scrollHeight }, "*");
  new ResizeObserver(post).observe(document.documentElement);
  addEventListener("load", post);
`;

const HtmlFrame = ({ html }: { html: string }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(40);
  const [color, setColor] = useState<string | null>(null);

  useLayoutEffect(() => {
    const computed = probe.current ? getComputedStyle(probe.current).color : "";
    // Only a plain CSS colour value goes into the frame's stylesheet.
    setColor(/^[\w\s(),.%#-]+$/.test(computed) ? computed : "#1f2937");
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow) return;
      const data = event.data as { type?: string; height?: number };
      if (data?.type === "dr-output-height" && typeof data.height === "number") {
        setHeight(Math.min(Math.max(data.height, 20), 2000));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div ref={probe} className="text-ink">
      {color && (
        <iframe
          ref={ref}
          title="Cell output"
          sandbox="allow-scripts"
          className="w-full border-0"
          style={{ height }}
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>${frameStyle(color)}</style></head><body>${html}<script>${RESIZE_SCRIPT}</script></body></html>`}
        />
      )}
    </div>
  );
};
