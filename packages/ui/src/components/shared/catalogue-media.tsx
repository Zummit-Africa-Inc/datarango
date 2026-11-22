"use client";

import { BookOpen, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ACCENT_CLASSES, hashString, resolveAccent, type AccentToken } from "../../config/accents";
import { cn } from "../../lib";
import { Blob, Circle, DotGrid, HalfMoon, Ring, Sparkle } from "./shapes";

/** What every catalogue entity needs to render media (§6.1). */
export interface CatalogueMediaProps {
  /** Seeds the fallback accent and layout, so the same entity always looks the same. */
  id: string;
  /** Used for the image alt text. */
  title: string;
  imageUrl?: string | null;
  accent?: AccentToken | null;
  category?: string | null;
  icon?: LucideIcon;
  className?: string;
  /** Overlays such as a lesson-count chip or bookmark button. */
  children?: ReactNode;
}

const GRADIENTS: Record<AccentToken, string> = {
  violet: "from-violet-soft to-violet-tile",
  lime: "from-lime-soft to-lime-tile",
  amber: "from-amber-soft to-amber-tile",
  sky: "from-sky-soft to-sky-tile",
  rose: "from-rose-soft to-rose-tile",
  teal: "from-teal-soft to-teal-tile",
};

const CORNER_SHAPES = [Blob, Circle, HalfMoon, Ring, Sparkle] as const;

/** Loads an image and reports failure, so a broken URL falls back like a missing one (§6.3). */
const useImage = (src: string | null | undefined) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return { show: Boolean(src) && !failed, onError: () => setFailed(true) };
};

const MediaImage = ({ src, onError }: { src: string; onError: () => void }) => (
  // Creator-supplied URLs can name any host, so this is a plain <img>: next/image
  // would need every host allowlisted, or fetch attacker-chosen URLs server-side.
  <img
    src={src}
    alt=""
    loading="lazy"
    decoding="async"
    onError={onError}
    className="absolute inset-0 size-full object-cover"
  />
);

/**
 * 4:3 thumbnail for cards, rows and search results (§6.2). Without an image it
 * renders the generated fallback: soft accent ground, dot texture, an icon
 * tile and one corner shape. Never contains text — the title sits beside it.
 */
export const CatalogueThumbnail = ({
  id,
  title,
  imageUrl,
  accent,
  category,
  icon: Icon = BookOpen,
  className,
  children,
}: CatalogueMediaProps) => {
  const image = useImage(imageUrl);
  const tone = resolveAccent({ accent, category, fallbackKey: id });
  const seed = hashString(id);
  const Corner = CORNER_SHAPES[seed % CORNER_SHAPES.length] ?? Blob;
  const cornerRight = seed % 2 === 0;

  return (
    <div
      role="img"
      aria-label={title}
      className={cn(
        "relative isolate aspect-4/3 w-full overflow-hidden",
        ACCENT_CLASSES[tone].soft,
        className,
      )}
    >
      {image.show ? (
        <MediaImage src={imageUrl!} onError={image.onError} />
      ) : (
        <>
          <DotGrid
            accent={tone}
            size="100%"
            radius={1}
            className="absolute inset-0 opacity-40"
            preserveAspectRatio="xMidYMid slice"
          />
          <Corner
            accent={tone}
            size="45%"
            className={cn("absolute -bottom-[12%]", cornerRight ? "-right-[10%]" : "-left-[10%]")}
          />
          <span
            className={cn(
              "absolute top-1/2 left-1/2 grid size-[28%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg shadow-sm",
              ACCENT_CLASSES[tone].solid,
            )}
          >
            <Icon aria-hidden="true" className="size-1/2" strokeWidth={1.75} />
          </span>
        </>
      )}
      {children}
    </div>
  );
};

/**
 * 3:1 cover for the course header and builder (§6.2). The fallback is an accent
 * gradient with 2–3 shapes placed from the id, so it stays stable per course.
 * Pass `iconTile` to get the icon tile overlapping the bottom-left edge.
 */
export const CatalogueCover = ({
  id,
  title,
  imageUrl,
  accent,
  category,
  icon: Icon = BookOpen,
  className,
  children,
  iconTile = false,
}: CatalogueMediaProps & { iconTile?: boolean }) => {
  const image = useImage(imageUrl);
  const tone = resolveAccent({ accent, category, fallbackKey: id });
  const seed = hashString(id);
  const First = CORNER_SHAPES[seed % CORNER_SHAPES.length] ?? Blob;
  const Second = CORNER_SHAPES[(seed >>> 3) % CORNER_SHAPES.length] ?? Circle;
  const third = seed % 3 === 0;

  return (
    <div className={cn("relative", iconTile && "mb-8", className)}>
      <div
        role="img"
        aria-label={title}
        className={cn(
          "relative isolate aspect-3/1 w-full overflow-hidden rounded-lg bg-linear-to-r",
          GRADIENTS[tone],
        )}
      >
        {image.show ? (
          <MediaImage src={imageUrl!} onError={image.onError} />
        ) : (
          <>
            <First
              accent={tone}
              size="38%"
              className="absolute top-[-35%] right-[4%]"
              style={{ transform: `rotate(${seed % 90}deg)` }}
            />
            <Second accent={tone} size="20%" className="absolute right-[30%] bottom-[-25%]" />
            {third && (
              <Sparkle
                accent={tone}
                tone="solid"
                size="7%"
                className="absolute top-[18%] left-[42%]"
              />
            )}
          </>
        )}
        {children}
      </div>
      {iconTile && (
        <span
          aria-hidden="true"
          className={cn(
            "ring-background absolute bottom-0 left-6 grid size-16 translate-y-1/2 place-items-center rounded-lg shadow-md ring-4",
            ACCENT_CLASSES[tone].solid,
          )}
        >
          <Icon className="size-8" strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
};
