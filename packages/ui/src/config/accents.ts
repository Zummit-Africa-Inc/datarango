export const ACCENTS = ["violet", "lime", "amber", "sky", "rose", "teal"] as const;

export type AccentToken = (typeof ACCENTS)[number];

/** Static class strings per accent, so Tailwind can see every utility. */
export const ACCENT_CLASSES: Record<
  AccentToken,
  { soft: string; tile: string; shape: string; solid: string; text: string }
> = {
  violet: {
    soft: "bg-violet-soft text-violet-soft-foreground",
    tile: "bg-violet-tile text-violet-tile-foreground",
    shape: "text-violet-shape",
    solid: "bg-violet-solid text-white",
    text: "text-violet-soft-foreground",
  },
  lime: {
    soft: "bg-lime-soft text-lime-soft-foreground",
    tile: "bg-lime-tile text-lime-tile-foreground",
    shape: "text-lime-shape",
    solid: "bg-lime-solid text-lime-tile-foreground",
    text: "text-lime-soft-foreground",
  },
  amber: {
    soft: "bg-amber-soft text-amber-soft-foreground",
    tile: "bg-amber-tile text-amber-tile-foreground",
    shape: "text-amber-shape",
    solid: "bg-amber-solid text-amber-tile-foreground",
    text: "text-amber-soft-foreground",
  },
  sky: {
    soft: "bg-sky-soft text-sky-soft-foreground",
    tile: "bg-sky-tile text-sky-tile-foreground",
    shape: "text-sky-shape",
    solid: "bg-sky-solid text-white",
    text: "text-sky-soft-foreground",
  },
  rose: {
    soft: "bg-rose-soft text-rose-soft-foreground",
    tile: "bg-rose-tile text-rose-tile-foreground",
    shape: "text-rose-shape",
    solid: "bg-rose-solid text-white",
    text: "text-rose-soft-foreground",
  },
  teal: {
    soft: "bg-teal-soft text-teal-soft-foreground",
    tile: "bg-teal-tile text-teal-tile-foreground",
    shape: "text-teal-shape",
    solid: "bg-teal-solid text-white",
    text: "text-teal-soft-foreground",
  },
};

/** Default accent per catalogue category (§2.3). Keys are matched case-insensitively. */
export const CATEGORY_ACCENTS: Record<string, AccentToken> = {
  "machine learning": "violet",
  ai: "violet",
  "artificial intelligence": "violet",
  "deep learning": "violet",
  "data analysis": "lime",
  beginner: "lime",
  statistics: "amber",
  rewards: "amber",
  "data engineering": "sky",
  sql: "sky",
  databases: "sky",
  visualisation: "rose",
  visualization: "rose",
  competitions: "rose",
  python: "teal",
  notebooks: "teal",
};

/** Stable 32-bit FNV-1a hash, used to pick an accent for unknown keys. */
export const hashString = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Accent for a free-form key: deterministic, so the same id always gets the same colour. */
export const accentFromKey = (key: string): AccentToken =>
  ACCENTS[hashString(key) % ACCENTS.length] ?? "violet";

/**
 * Resolves an accent: explicit accent → category mapping → hash of the fallback key (§6.3).
 */
export const resolveAccent = ({
  accent,
  category,
  fallbackKey,
}: {
  accent?: AccentToken | null;
  category?: string | null;
  fallbackKey: string;
}): AccentToken => {
  if (accent && ACCENTS.includes(accent)) return accent;
  const mapped = category ? CATEGORY_ACCENTS[category.trim().toLowerCase()] : undefined;
  return mapped ?? accentFromKey(fallbackKey);
};

/**
 * Light-theme accent colours as hex, for renderers that can't read CSS
 * variables (next/og images, emails). Mirrors tokens.css; keep them in step.
 */
export const ACCENT_HEX: Record<
  AccentToken,
  { soft: string; tile: string; shape: string; solid: string }
> = {
  violet: { soft: "#ede9fe", tile: "#ddd6fe", shape: "#c4b5fd", solid: "#8b5cf6" },
  lime: { soft: "#d9f99d", tile: "#bef264", shape: "#bef264", solid: "#84cc16" },
  amber: { soft: "#fef3c7", tile: "#fde68a", shape: "#fcd34d", solid: "#f59e0b" },
  sky: { soft: "#e0f2fe", tile: "#bae6fd", shape: "#7dd3fc", solid: "#0ea5e9" },
  rose: { soft: "#ffe4e6", tile: "#fecdd3", shape: "#fda4af", solid: "#f43f5e" },
  teal: { soft: "#ccfbf1", tile: "#99f6e4", shape: "#5eead4", solid: "#14b8a6" },
};
