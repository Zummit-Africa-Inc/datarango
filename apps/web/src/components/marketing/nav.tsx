"use client";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  Database,
  Menu,
  NotebookPen,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ACCENT_CLASSES,
  Button,
  Logo,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ThemeToggle,
  cn,
  type AccentToken,
} from "@datarango/ui";

import { PHOTOS } from "@/content/marketing";

interface ExploreItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  accent: AccentToken;
}

const EXPLORE: { heading: string; items: ExploreItem[] }[] = [
  {
    heading: "Learn",
    items: [
      {
        href: "/courses",
        icon: BookOpen,
        label: "Courses",
        description: "Structured paths with graded notebook exercises",
        accent: "violet",
      },
      {
        href: "/quizzes",
        icon: NotebookPen,
        label: "Quizzes",
        description: "Ten-minute checks that earn you tokens",
        accent: "amber",
      },
    ],
  },
  {
    heading: "Practise",
    items: [
      {
        href: "/datasets",
        icon: Database,
        label: "Datasets",
        description: "Versioned data that mounts into your notebook",
        accent: "sky",
      },
      {
        href: "/competitions",
        icon: Trophy,
        label: "Competitions",
        description: "Score your models against everyone else's",
        accent: "rose",
      },
    ],
  },
];

const LINKS = [
  { href: "/for-teams", label: "For teams" },
  { href: "/for-creators", label: "For creators" },
  { href: "/pricing", label: "Pricing" },
];

const ExploreLink = ({ item, onNavigate }: { item: ExploreItem; onNavigate: () => void }) => (
  <Link
    className="hover:bg-muted focus-visible:ring-ring group flex items-start gap-3 rounded-xl p-2.5 transition-colors outline-none focus-visible:ring-2"
    href={item.href}
    onClick={onNavigate}
  >
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg",
        ACCENT_CLASSES[item.accent].tile,
      )}
    >
      <item.icon className="size-5" strokeWidth={1.75} />
    </span>
    <span>
      <span className="text-foreground flex items-center gap-1 text-sm font-semibold">
        {item.label}
        <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none" />
      </span>
      <span className="text-foreground-muted mt-0.5 block text-xs leading-relaxed">
        {item.description}
      </span>
    </span>
  </Link>
);

/** Sticky marketing navigation: grouped Explore menu with a featured card; disclosure on mobile. */
export const MarketingNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  // Close both menus on navigation.
  useEffect(() => {
    setOpen(false);
    setExploreOpen(false);
  }, [pathname]);

  const exploreActive = EXPLORE.some((group) =>
    group.items.some((item) => pathname?.startsWith(item.href)),
  );

  return (
    <header className="border-border/60 bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link aria-label="Datarango home" href="/">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-x-1 lg:flex">
          <Popover onOpenChange={setExploreOpen} open={exploreOpen}>
            <PopoverTrigger
              className={cn(
                "hover:bg-muted flex items-center gap-x-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors outline-none",
                exploreOpen || exploreActive ? "text-foreground" : "text-foreground-muted",
                exploreOpen && "bg-muted",
              )}
            >
              Explore
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform motion-reduce:transition-none",
                  exploreOpen && "rotate-180",
                )}
              />
            </PopoverTrigger>
            <PopoverContent
              align="center"
              className="w-[min(46rem,calc(100vw-2rem))] gap-0 rounded-3xl p-3"
              sideOffset={10}
            >
              <div className="grid grid-cols-[1fr_1fr_15rem] gap-3">
                {EXPLORE.map((group) => (
                  <div key={group.heading}>
                    <p className="text-foreground-muted px-2.5 pt-1.5 pb-2 text-xs font-medium">
                      {group.heading}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <ExploreLink
                          item={item}
                          key={item.href}
                          onNavigate={() => setExploreOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <Link
                  className="bg-primary-soft text-primary-soft-foreground group relative flex flex-col overflow-hidden rounded-2xl"
                  href="/signup"
                  onClick={() => setExploreOpen(false)}
                >
                  <div className="relative h-32">
                    <Image
                      alt={PHOTOS.campus.alt}
                      className="object-cover"
                      fill
                      sizes="15rem"
                      src={PHOTOS.campus.src}
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-sm font-semibold">New to data?</p>
                    <p className="mt-0.5 text-xs leading-relaxed opacity-85">
                      Start with a free course and your first notebook today.
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold">
                      Start free
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </p>
                  </div>
                </Link>
              </div>
              <div className="border-border text-foreground-muted mt-3 flex items-center justify-between border-t px-2.5 pt-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="size-3.5" /> Every certificate can be checked online
                </span>
                <Link
                  className="text-foreground font-medium hover:underline"
                  href="/about"
                  onClick={() => setExploreOpen(false)}
                >
                  About Datarango
                </Link>
              </div>
            </PopoverContent>
          </Popover>
          {LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "hover:bg-muted rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
                )}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-x-2 lg:flex">
          <ThemeToggle />
          <Button asChild shape="pill" variant="ghost">
            <Link href="/signin">Log in</Link>
          </Button>
          <Button asChild shape="pill">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>

        <div className="flex items-center gap-x-1 lg:hidden">
          <ThemeToggle />
          <button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="hover:bg-muted grid size-10 place-items-center rounded-full"
            onClick={() => setOpen((prev) => !prev)}
            type="button"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-border/60 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t px-4 pt-3 pb-5 lg:hidden",
          !open && "hidden",
        )}
      >
        <nav aria-label="Main" className="space-y-4">
          {EXPLORE.map((group) => (
            <div key={group.heading}>
              <p className="text-foreground-muted px-2.5 pb-1 text-xs font-medium">
                {group.heading}
              </p>
              {group.items.map((item) => (
                <ExploreLink item={item} key={item.href} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          ))}
          <div className="border-border border-t pt-3">
            {LINKS.map((link) => (
              <Link
                className="hover:bg-muted text-foreground block rounded-xl px-2.5 py-2.5 text-sm font-medium"
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild shape="pill" variant="secondary">
            <Link href="/signin">Log in</Link>
          </Button>
          <Button asChild shape="pill">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
