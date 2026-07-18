interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface Props {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** Shared renderer for legal documents (privacy policy, terms of use). */
export const LegalDocument = ({ title, updated, intro, sections }: Props) => (
  <main className="container mx-auto max-w-3xl px-4 py-20 lg:py-28">
    <p className="text-primary-500 text-xs font-semibold tracking-widest uppercase">Legal</p>
    <h1 className="font-heading mt-4 text-4xl tracking-tight lg:text-6xl">{title}</h1>
    <p className="text-muted-foreground mt-3 text-sm">Last updated: {updated}</p>
    <p className="text-muted-foreground mt-8 leading-relaxed">{intro}</p>
    <div className="mt-12 space-y-10">
      {sections.map((section, index) => (
        <section key={section.heading}>
          <h2 className="font-heading text-xl">
            {index + 1}. {section.heading}
          </h2>
          <div className="text-muted-foreground mt-3 space-y-3 leading-relaxed">
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  </main>
);
