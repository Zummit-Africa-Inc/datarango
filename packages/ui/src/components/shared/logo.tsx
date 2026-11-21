"use client";

import Image, { type StaticImageData } from "next/image";

import iconDark from "../../assets/icon_dark.png";
import iconLight from "../../assets/icon_light.png";
import logoDark from "../../assets/logo_dark.png";
import logoLight from "../../assets/logo_light.png";
import { cn } from "../../lib";

interface Props {
  className?: string;
  collapsed?: boolean;
  /** Always the light-on-dark variant, for band surfaces whatever the theme. */
  onInk?: boolean;
  type?: "icon" | "wordmark";
}

const LogoImage = ({ src, className }: { src: StaticImageData; className?: string }) => (
  <Image
    alt="Datarango"
    className={cn("object-cover", className)}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    priority
    src={src}
  />
);

/** Datarango logo — wordmark, or the glyph when collapsed. Follows the theme unless `onInk`. */
export const Logo = ({ className, collapsed = false, onInk = false, type = "wordmark" }: Props) => {
  const glyph = collapsed || type === "icon";
  const light = glyph ? iconLight : logoLight;
  const dark = glyph ? iconDark : logoDark;
  const sizing = glyph ? "h-10 w-10" : "h-6 aspect-[5.6/1] w-auto";

  return (
    <span className={cn("relative flex items-center select-none", sizing, className)}>
      {onInk ? (
        <LogoImage src={dark} />
      ) : (
        <>
          <LogoImage src={light} className="dark:hidden" />
          <LogoImage src={dark} className="hidden dark:block" />
        </>
      )}
    </span>
  );
};
