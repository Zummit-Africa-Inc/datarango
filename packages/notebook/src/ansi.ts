/**
 * ANSI SGR colour codes → styled segments. IPython colours its tracebacks;
 * showing the escape codes raw makes them unreadable, and dropping them loses
 * where the error points. Only colours and bold are kept.
 */

export interface AnsiSegment {
  text: string;
  color?: string;
  bold?: boolean;
}

// Theme-neutral: readable on both light and dark cards.
const COLORS = [
  "#6b7280", // black → grey, so it stays visible on dark
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#2563eb",
  "#9333ea",
  "#0891b2",
  "#9ca3af",
];

// eslint-disable-next-line no-control-regex
const SGR = /\x1b\[([0-9;]*)m/g;
// eslint-disable-next-line no-control-regex
const OTHER_ESCAPES = /\x1b\[[0-9;?]*[A-Za-z]/g;

export const parseAnsi = (input: string): AnsiSegment[] => {
  const segments: AnsiSegment[] = [];
  let color: string | undefined;
  let bold = false;
  let last = 0;

  const push = (text: string) => {
    const clean = text.replace(OTHER_ESCAPES, "");
    if (clean) segments.push({ text: clean, color, bold });
  };

  for (const match of input.matchAll(SGR)) {
    push(input.slice(last, match.index));
    last = match.index + match[0].length;
    const params = match[1] ?? "";
    const codes = params === "" ? [0] : params.split(";").map(Number);
    for (const code of codes) {
      if (code === 0) {
        color = undefined;
        bold = false;
      } else if (code === 1) bold = true;
      else if (code === 22) bold = false;
      else if (code === 39) color = undefined;
      else if (code >= 30 && code <= 37) color = COLORS[code - 30];
      else if (code >= 90 && code <= 97) color = COLORS[code - 90];
    }
  }
  push(input.slice(last));
  return segments;
};

export const stripAnsi = (input: string): string =>
  parseAnsi(input)
    .map((s) => s.text)
    .join("");
