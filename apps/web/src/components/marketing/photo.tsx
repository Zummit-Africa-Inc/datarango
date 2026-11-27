import Image from "next/image";
import type { ReactNode } from "react";

import { ACCENT_CLASSES, Circle, HalfMoon, cn, type AccentToken } from "@datarango/ui";

import type { Photo } from "@/content/marketing";

/**
 * A photo in a soft accent frame with a shape peeking out behind it, and an
 * optional product card laid over a corner. The building block of every
 * image-led marketing section.
 */
export const PhotoFrame = ({
  photo,
  accent,
  aspect = "aspect-4/3",
  overlay,
  side = "right",
  priority,
  sizes = "(min-width: 1024px) 45vw, 100vw",
  className,
}: {
  photo: Photo;
  accent: AccentToken;
  aspect?: string;
  overlay?: ReactNode;
  /** Which side the overlay card hangs off (the shape goes opposite). */
  side?: "left" | "right";
  priority?: boolean;
  sizes?: string;
  className?: string;
}) => (
  <div className={cn("relative", className)}>
    {side === "right" ? (
      <HalfMoon accent={accent} className="absolute -bottom-8 -left-8" size={140} />
    ) : (
      <Circle accent={accent} className="absolute -top-8 -right-8" size={140} />
    )}
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-2.5",
        aspect,
        ACCENT_CLASSES[accent].soft,
      )}
    >
      <div className="relative h-full overflow-hidden rounded-2xl">
        <Image
          alt={photo.alt}
          className="object-cover"
          fill
          priority={priority}
          sizes={sizes}
          src={photo.src}
        />
      </div>
    </div>
    {overlay && (
      <div
        aria-hidden
        className={cn(
          "border-border bg-card text-foreground absolute -bottom-8 hidden w-64 rounded-2xl border p-4 shadow-(--shadow-high) sm:block",
          side === "right" ? "-right-6" : "-left-6",
        )}
      >
        {overlay}
      </div>
    )}
  </div>
);

/** Small accent pill above a heading. */
export const Eyebrow = ({ accent, children }: { accent: AccentToken; children: ReactNode }) => (
  <p
    className={cn(
      "inline-flex rounded-full px-3 py-1 text-sm font-medium",
      ACCENT_CLASSES[accent].soft,
    )}
  >
    {children}
  </p>
);
