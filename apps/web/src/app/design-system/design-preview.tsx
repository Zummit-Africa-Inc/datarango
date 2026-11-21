"use client";

import {
  ACCENTS,
  ACCENT_CLASSES,
  AvatarStack,
  Badge,
  BarChart,
  Blob,
  Breadcrumb,
  Button,
  ButtonArrow,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Circle,
  Count,
  CourseCardSkeleton,
  DotGrid,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  HalfMoon,
  Input,
  Label,
  ProgressBar,
  ProgressRing,
  PropertyList,
  Ring,
  Sparkle,
  Squiggle,
  StatCard,
  StatCardSkeleton,
  SteppedProgress,
  Stripe,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThemeToggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  UserAvatar,
  cn,
  type BadgeTone,
} from "@datarango/ui";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Flame,
  FolderOpen,
  Plus,
  Signal,
  Tag,
  Trophy,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

const SWATCHES = [
  ["background", "bg-background"],
  ["background-subtle", "bg-background-subtle"],
  ["surface", "bg-surface"],
  ["muted", "bg-muted"],
  ["border", "bg-border"],
  ["border-strong", "bg-border-strong"],
  ["foreground", "bg-foreground"],
  ["primary", "bg-primary"],
  ["primary-soft", "bg-primary-soft"],
  ["band", "bg-band"],
] as const;

const STATUS_TONES: BadgeTone[] = ["neutral", "primary", "success", "warning", "danger", "info"];

const WEEK = [
  { label: "Mon", value: 32 },
  { label: "Tue", value: 54 },
  { label: "Wed", value: 41 },
  { label: "Thu", value: 76 },
  { label: "Fri", value: 63 },
  { label: "Sat", value: 0, inactive: true },
  { label: "Sun", value: 0, inactive: true },
];

const PEOPLE = [
  { name: "Adaeze Okafor" },
  { name: "Tunde Bello" },
  { name: "Maryam Sani" },
  { name: "Chidi Eze" },
  { name: "Ife Adeyemi" },
  { name: "Kemi Lawal" },
];

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-border space-y-4 border-t pt-6">
    <h2 className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
      {title}
    </h2>
    {children}
  </section>
);

const Row = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>
);

const Gallery = ({ theme }: { theme: "light" | "dark" }) => (
  <div className={cn(theme, "bg-background text-foreground min-w-0 space-y-8 p-6 sm:p-8")}>
    <p className="font-display text-foreground-muted text-sm font-semibold capitalize">{theme}</p>

    <Section title="Typography">
      <div className="space-y-3">
        <p className="font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
          Play. Learn. <span className="text-primary">Build.</span>
        </p>
        <h1 className="text-[2.25rem] leading-[1.15] tracking-[-0.02em]">Heading one</h1>
        <h2 className="text-[1.75rem] leading-[1.2] tracking-[-0.02em]">Heading two</h2>
        <h3 className="relative inline-block text-[1.25rem] leading-[1.3] tracking-[-0.01em]">
          Heading three with a{" "}
          <span className="relative inline-block">
            highlight
            <Squiggle
              accent="amber"
              tone="solid"
              size={96}
              className="absolute -bottom-2 left-0 w-full"
            />
          </span>
        </h3>
        <p className="max-w-prose text-[0.9375rem] leading-[1.6]">
          Body copy in Geist. Interactive courses, real Jupyter notebooks, hosted datasets and live
          competitions.
        </p>
        <p className="text-foreground-muted text-[0.8125rem]">Small and meta text</p>
        <p className="text-foreground-subtle text-xs font-medium tracking-[0.06em] uppercase">
          Overline
        </p>
        <code className="bg-muted rounded-sm px-1.5 py-0.5 font-mono text-sm">
          df.groupby(&quot;region&quot;).mean()
        </code>
      </div>
    </Section>

    <Section title="Colour">
      <div className="grid grid-cols-5 gap-2">
        {SWATCHES.map(([name, cls]) => (
          <div key={name} className="space-y-1">
            <div className={cn("border-border h-10 rounded-sm border", cls)} />
            <p className="text-foreground-muted truncate text-[0.6875rem]">{name}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {ACCENTS.map((accent) => (
          <div key={accent} className="space-y-1">
            <div
              className={cn(
                "flex h-14 items-end rounded-md p-2 text-xs font-semibold capitalize",
                ACCENT_CLASSES[accent].tile,
              )}
            >
              {accent}
            </div>
            <div className={cn("h-3 rounded-full", ACCENT_CLASSES[accent].solid)} />
          </div>
        ))}
      </div>
    </Section>

    <Section title="Buttons">
      <Row>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link</Button>
      </Row>
      <Row>
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="secondary" aria-label="Add">
          <Plus />
        </Button>
        <Button disabled>Disabled</Button>
      </Row>
      <Row>
        <Button shape="pill" size="lg">
          Get started <ButtonArrow />
        </Button>
        <Button shape="pill" size="lg" variant="secondary">
          For teams
        </Button>
      </Row>
    </Section>

    <Section title="Badges">
      {(["solid", "soft", "outline"] as const).map((appearance) => (
        <Row key={appearance} className="gap-2">
          {STATUS_TONES.map((tone) => (
            <Badge key={tone} tone={tone} appearance={appearance} className="capitalize">
              {tone}
            </Badge>
          ))}
        </Row>
      ))}
      <Row className="gap-2">
        {ACCENTS.map((accent) => (
          <Badge key={accent} tone={accent} className="capitalize">
            {accent}
          </Badge>
        ))}
      </Row>
      <Row className="gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          All courses <Count>28</Count>
        </span>
        <Badge variant="success">Published</Badge>
        <Badge variant="warning">In review</Badge>
        <Badge variant="outline">Draft</Badge>
      </Row>
    </Section>

    <Section title="Cards">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plain card</CardTitle>
            <CardDescription>Border only, no shadow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={64} showValue label="Course progress" />
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">
              Continue
            </Button>
          </CardFooter>
        </Card>
        <Card interactive tabIndex={0}>
          <CardHeader>
            <CardTitle>Interactive card</CardTitle>
            <CardDescription>Lifts and darkens its border on hover.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <AvatarStack people={PEOPLE} max={4} size="sm" />
            <span className="text-foreground-muted text-xs">★ 4.9 · 12,000+ learners</span>
          </CardContent>
        </Card>
      </div>
      <div className={cn("relative overflow-hidden rounded-lg p-6", ACCENT_CLASSES.violet.tile)}>
        <Trophy aria-hidden="true" className="mb-6 size-10" />
        <p className="font-display text-xl font-semibold">Competitions</p>
        <p className="text-sm opacity-80">Colour tile with a corner shape.</p>
        <Circle accent="violet" size={120} className="absolute -top-10 -right-10" />
      </div>
    </Section>

    <Section title="Stat cards">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Learning streak"
          value="14 days"
          delta="+3"
          hint="vs last week"
          icon={Flame}
          accent="amber"
        />
        <StatCard
          label="Hours this month"
          value="32.5"
          delta="-8%"
          hint="vs last month"
          icon={Clock}
          accent="sky"
          sparkline={[4, 6, 5, 8, 7, 9, 6]}
        />
      </div>
    </Section>

    <Section title="Progress">
      <Row className="gap-6">
        <ProgressRing value={72} />
        <ProgressRing value={40} accent="teal" size={80} thickness={8} />
        <ProgressRing value={100} accent="lime" size={48} thickness={5} />
      </Row>
      <ProgressBar value={35} accent="violet" showValue label="Module progress" />
      <SteppedProgress value={60} label="Course milestones" />
    </Section>

    <Section title="Avatars">
      <Row>
        <UserAvatar name="Adaeze Okafor" size="lg" />
        <UserAvatar name="Tunde Bello" />
        <UserAvatar name="Maryam Sani" size="sm" />
        <AvatarStack people={PEOPLE} max={5} />
      </Row>
    </Section>

    <Section title="Tabs">
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">
            Content <Count>12</Count>
          </TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="text-foreground-muted text-sm">
          Underline tabs for page sections.
        </TabsContent>
        <TabsContent value="content" className="text-foreground-muted text-sm">
          Twelve lessons.
        </TabsContent>
        <TabsContent value="discussion" className="text-foreground-muted text-sm">
          No posts yet.
        </TabsContent>
      </Tabs>
      <Tabs variant="pill" defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="progress">In progress</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
    </Section>

    <Section title="Navigation and details">
      <Breadcrumb
        items={[
          { label: "Courses", href: "#" },
          { label: "Machine learning", href: "#" },
          { label: "Regression modelling" },
        ]}
      />
      <PropertyList
        items={[
          { label: "Owner", icon: User, value: "Adaeze Okafor" },
          {
            label: "Category",
            icon: FolderOpen,
            value: <Badge tone="violet">Machine learning</Badge>,
          },
          { label: "Level", icon: Signal, value: "Intermediate" },
          { label: "Tags", icon: Tag },
          { label: "Due", icon: CalendarDays },
        ]}
      />
    </Section>

    <Section title="Form controls">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${theme}-email`}>Email</Label>
          <Input id={`${theme}-email`} placeholder="you@example.com" />
        </div>
        <div className="flex items-end gap-6 pb-2">
          <div className="flex items-center gap-2">
            <Switch id={`${theme}-switch`} defaultChecked />
            <Label htmlFor={`${theme}-switch`}>Reminders</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${theme}-check`} defaultChecked />
            <Label htmlFor={`${theme}-check`}>Remember me</Label>
          </div>
        </div>
      </div>
      <Row>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Hover for tooltip</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltips use the dark band surface.</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>
      <p className="text-foreground-subtle text-xs">
        Menus and tooltips open in a portal, so they follow the page theme rather than this panel.
      </p>
    </Section>

    <Section title="Chart">
      <Card>
        <CardHeader>
          <CardTitle>Minutes learned</CardTitle>
          <CardDescription>This week</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart data={WEEK} label="Minutes learned this week" />
        </CardContent>
      </Card>
    </Section>

    <Section title="Empty and loading">
      <Card>
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          hint="Courses you enrol in will appear here."
          action={<Button size="sm">Browse courses</Button>}
        />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCardSkeleton />
        <CourseCardSkeleton />
      </div>
    </Section>

    <Section title="Shapes">
      <Row className="gap-4">
        <Blob accent="violet" size={64} />
        <Circle accent="lime" size={48} />
        <HalfMoon accent="amber" size={56} />
        <Ring accent="sky" size={52} />
        <Sparkle accent="rose" size={48} />
        <Squiggle accent="teal" size={96} />
        <DotGrid accent="primary" size={56} />
        <Stripe accent="violet" size={56} />
      </Row>
    </Section>
  </div>
);

/** Every primitive in light and dark, side by side (§3, §5). */
export const DesignPreview = () => (
  <main className="bg-background min-h-screen">
    <header className="border-border bg-background/90 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
      <div>
        <h1 className="text-lg">Design system</h1>
        <p className="text-foreground-muted text-xs">Primitives in both themes</p>
      </div>
      <ThemeToggle />
    </header>
    <div className="divide-border grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <Gallery theme="light" />
      <Gallery theme="dark" />
    </div>
  </main>
);
