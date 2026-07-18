"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Button, Logo, cn } from "@datarango/ui";

const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/competitions", label: "Competitions" },
  { href: "/datasets", label: "Datasets" },
  { href: "/for-teams", label: "For Teams" },
  { href: "/pricing", label: "Pricing" },
];

/** Sticky marketing navigation with mobile disclosure. */
export const MarketingNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" aria-label="Datarango home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-x-8 lg:flex">
          {LINKS.map((link) => (
            <Link
              className="text-muted-foreground link before:bg-ink hover:text-foreground text-sm font-medium transition-colors"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-x-3 lg:flex">
          <Button asChild variant="ghost">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Join for free</Link>
          </Button>
        </div>
        <button
          aria-label="Toggle menu"
          className="lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div className={cn("border-border/60 border-t px-4 pt-2 pb-4 lg:hidden", !open && "hidden")}>
        <nav className="flex flex-col gap-y-1">
          {LINKS.map((link) => (
            <Link
              className="hover:bg-accent rounded-xs px-3 py-2 text-sm font-medium"
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Join for free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
