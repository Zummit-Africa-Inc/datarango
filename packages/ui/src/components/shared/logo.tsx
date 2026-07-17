"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

import { useGlobalStore } from "@/store";
import { cn } from "@/lib";

interface Props {
  className?: string;
}

export const Logo = ({ className }: Props) => {
  const { isCollapsed } = useGlobalStore();
  const { theme } = useTheme();

  const image = isCollapsed
    ? "/asset/favicon.png"
    : theme === "dark"
      ? "/assets/converge-dark.jpeg"
      : "/assets/converge-light.jpeg";

  return (
    <div
      className={cn(
        "relative",
        isCollapsed ? "aspect-square size-8" : "aspect-[4.7/1] w-40",
        className,
      )}
    >
      <Image alt="logo" fill sizes="100%" src={image} />
    </div>
  );
};
