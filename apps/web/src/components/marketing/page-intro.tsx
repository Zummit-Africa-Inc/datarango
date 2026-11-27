import { FadeIn } from "@datarango/ui";

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: string;
}

/** Centred text header for marketing subpages without a photo (legal, blog, careers). */
export const PageIntro = ({ eyebrow, title, lede }: Props) => (
  <section className="container mx-auto px-4 pt-16 pb-12 lg:px-8 lg:pt-24">
    <FadeIn className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="bg-primary-soft text-primary-soft-foreground inline-flex rounded-full px-3 py-1 text-sm font-medium">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-foreground mt-5 text-4xl font-semibold tracking-tight lg:text-6xl">
        {title}
      </h1>
      {lede && <p className="text-foreground-muted mt-5 text-lg leading-relaxed">{lede}</p>}
    </FadeIn>
  </section>
);
