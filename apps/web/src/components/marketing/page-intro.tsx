import { FadeIn } from "@datarango/ui";

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: string;
}

/** Shared oversized header for marketing subpages. */
export const PageIntro = ({ eyebrow, title, lede }: Props) => (
  <section className="container mx-auto px-4 pt-20 pb-16 lg:px-8 lg:pt-28">
    <FadeIn className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-primary-500 text-xs font-semibold tracking-widest uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading mt-4 text-5xl tracking-tight lg:text-7xl">{title}</h1>
      {lede && <p className="text-muted-foreground mt-6 text-lg leading-relaxed">{lede}</p>}
    </FadeIn>
  </section>
);
