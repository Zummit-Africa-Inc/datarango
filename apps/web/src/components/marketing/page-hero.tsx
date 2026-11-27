import type { ReactNode } from "react";

import { FadeIn, type AccentToken } from "@datarango/ui";

import type { Photo } from "@/content/marketing";

import { Eyebrow, PhotoFrame } from "./photo";

/**
 * Split hero for marketing subpages (§7.1 language): copy and actions on one
 * side, a framed photo with a product card on the other. Headline is one
 * colour.
 */
export const PageHero = ({
  eyebrow,
  title,
  lede,
  photo,
  accent,
  overlay,
  actions,
  footnote,
}: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  photo: Photo;
  accent: AccentToken;
  overlay?: ReactNode;
  actions?: ReactNode;
  footnote?: string;
}) => (
  <section className="container mx-auto grid items-center gap-14 px-4 pt-14 pb-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-20 lg:pb-28">
    <FadeIn>
      <Eyebrow accent={accent}>{eyebrow}</Eyebrow>
      <h1 className="font-display text-foreground mt-5 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="text-foreground-muted mt-6 max-w-lg text-lg leading-relaxed">{lede}</p>
      {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
      {footnote && <p className="text-foreground-muted mt-5 text-sm">{footnote}</p>}
    </FadeIn>
    <FadeIn delay={0.1}>
      <PhotoFrame accent={accent} overlay={overlay} photo={photo} priority />
    </FadeIn>
  </section>
);
