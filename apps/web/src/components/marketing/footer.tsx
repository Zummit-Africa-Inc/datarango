import Link from "next/link";

import { Logo } from "@datarango/ui";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/quizzes", label: "Quizzes" },
      { href: "/competitions", label: "Competitions" },
      { href: "/datasets", label: "Datasets" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "For organizations",
    links: [
      { href: "/for-teams", label: "Teams & schools" },
      { href: "/contact", label: "Book a demo" },
      { href: "/signup?intent=org", label: "Create an organization" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-use", label: "Terms of use" },
    ],
  },
];

/** The ink footer — the closing dark band of every marketing page. */
export const MarketingFooter = () => (
  <footer className="bg-ink text-on-ink">
    <div className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-6 lg:px-8">
      <div className="lg:col-span-2">
        <Logo onInk />
      <p className="text-on-ink-muted mt-4 max-w-xs text-sm leading-relaxed">
          Learn data analytics, AI and ML by doing — courses, notebooks, datasets and competitions
          in one place.
        </p>
      </div>
      {COLUMNS.map((column) => (
        <div key={column.heading}>
          <p className="text-on-ink text-sm font-medium">{column.heading}</p>
          <ul className="mt-4 space-y-2.5">
            {column.links.map((link) => (
              <li key={link.label}>
                <Link
                  className="text-on-ink-muted hover:text-on-ink text-sm transition-colors"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/5">
      <div className="text-on-ink-muted container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs lg:px-8">
        <span>© {new Date().getFullYear()} Datarango. All rights reserved.</span>
        <span>Made for builders, everywhere.</span>
      </div>
    </div>
  </footer>
);
