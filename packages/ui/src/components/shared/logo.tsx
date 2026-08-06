"use client";

import Image from "next/image";

import iconDark from "../../assets/icon_dark.png";
import iconLight from "../../assets/icon_light.png";
import logoDark from "../../assets/logo_dark.png";
import logoLight from "../../assets/logo_light.png";
import { cn } from "../../lib";

interface Props {
  className?: string;
  collapsed?: boolean;
  /** Renders the cream variant for ink surfaces (sidebar, footer). */
  onInk?: boolean;
  type?: "icon" | "wordmark";
}

/** Datarango logo — wordmark, or the glyph when collapsed. */
export const Logo = ({ className, collapsed = false, onInk = false, type = "wordmark" }: Props) => {
  const src = onInk
    ? collapsed || type === "icon"
      ? iconDark
      : logoDark
    : collapsed || type === "icon"
      ? iconLight
      : logoLight;
  const sizing = collapsed || type === "icon" ? "h-10 w-10" : "h-6 aspect-[5.6/1] w-auto";

  return (
    <span className={cn("relative flex items-center select-none", sizing, className)}>
      <Image
        alt="Datarango"
        className="object-cover"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
        src={src}
      />
    </span>
  );
};
