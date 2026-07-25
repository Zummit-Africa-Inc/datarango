"use client";

import Image, { type StaticImageData } from "next/image";

import business from "../../assets/illustrations/business.svg";
import credit from "../../assets/illustrations/credit.svg";
import investment from "../../assets/illustrations/investment.svg";
import onchain from "../../assets/illustrations/onchain.svg";
import { cn } from "../../lib";

export type IllustrationName = "business" | "credit" | "investment" | "onchain";

const ART: Record<IllustrationName, StaticImageData> = {
  business,
  credit,
  investment,
  onchain,
};

interface Props {
  name: IllustrationName;
  className?: string;
  /**
   * Accessible label. Omit for decorative art (the default) — the image is
   * then hidden from assistive tech. Provide text only when the illustration
   * carries meaning not present elsewhere.
   */
  alt?: string;
  priority?: boolean;
}

/**
 * Flat brand illustrations (business / credit / investment / onchain).
 *
 * The source art is drawn to bleed past its viewBox, so it's meant to sit in a
 * clipping container (a card with `overflow-hidden`) and be anchored to an
 * edge. Size and position it from the parent, e.g.:
 *
 *   <div className="relative overflow-hidden rounded-2xl">
 *     <Illustration name="business" className="absolute bottom-0 right-0 w-1/2" />
 *   </div>
 */
export const Illustration = ({ name, className, alt, priority }: Props) => (
  <Image
    src={ART[name]}
    alt={alt ?? ""}
    aria-hidden={alt ? undefined : true}
    priority={priority}
    className={cn("h-auto w-full select-none", className)}
  />
);

export const BusinessIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="business" {...props} />
);
export const CreditIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="credit" {...props} />
);
export const InvestmentIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="investment" {...props} />
);
export const OnchainIllustration = (props: Omit<Props, "name">) => (
  <Illustration name="onchain" {...props} />
);
