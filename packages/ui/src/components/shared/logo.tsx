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
}

/** Datarango logo — wordmark, or the glyph when collapsed. */
export const Logo = ({ className, collapsed = false, onInk = false }: Props) => {
  const src = onInk ? (collapsed ? iconDark : logoDark) : collapsed ? iconLight : logoLight;
  const sizing = collapsed ? "h-8 w-auto" : "h-7 w-auto";

  return (
    <span className={cn("flex items-center select-none", className)}>
      <Image alt="Datarango" className={sizing} priority src={src} />
    </span>
  );
};
