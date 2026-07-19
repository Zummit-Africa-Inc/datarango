"use client";

import { BookOpen, ChevronDown, Database, Menu, NotebookPen, Trophy, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Button, Logo, Popover, PopoverContent, PopoverTrigger, cn } from "@datarango/ui";

const EXPLORE_ITEMS = [
  {
    href: "/courses",
    icon: BookOpen,
    label: "Courses",
    description: "Structured learning with graded notebook exercises",
  },
  {
    href: "/quizzes",
    icon: NotebookPen,
    label: "Quizzes",
    description: "Bite-sized challenges that earn you tokens",
  },
  {
    href: "/datasets",
    icon: Database,
    label: "Datasets",
    description: "Versioned, hosted datasets ready to mount in notebooks",
  },
  {
    href: "/competitions",
    icon: Trophy,
    label: "Competitions",
    description: "Leaderboard-scored challenges on real-world problems",
  },
];

const LINKS = [
  { href: "/for-teams", label: "For Teams" },
  { href: "/for-creators", label: "For Creators" },
  { href: "/pricing", label: "Pricing" },
];

/** Sticky marketing navigation with mobile disclosure. */
export const MarketingNav = () => {
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" aria-label="Datarango home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-x-8 lg:flex">
          <Popover open={exploreOpen} onOpenChange={setExploreOpen}>
            <PopoverTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-x-1 text-sm font-medium transition-colors outline-none">
              Explore
              <ChevronDown className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-2">
              {EXPLORE_ITEMS.map((item) => (
                <Link
                  className="hover:bg-accent flex items-start gap-x-3 rounded-xs px-3 py-2.5 transition-colors"
                  href={item.href}
                  key={item.href}
                  onClick={() => setExploreOpen(false)}
                >
                  <item.icon
                    className="text-primary-500 mt-0.5 size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="text-foreground text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </PopoverContent>
          </Popover>
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
          <p className="text-muted-foreground px-3 pt-1 pb-0.5 text-xs font-semibold tracking-widest uppercase">
            Explore
          </p>
          {EXPLORE_ITEMS.map((item) => (
            <Link
              className="hover:bg-accent flex items-center gap-x-2.5 rounded-xs px-3 py-2 text-sm font-medium"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              <item.icon className="text-primary-500 size-4 shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
          <div className="my-1 border-t" />
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
