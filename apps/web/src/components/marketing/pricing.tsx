"use client";

import { Building2, Check, GraduationCap, User } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  FadeIn,
  Stagger,
  StaggerItem,
  cn,
} from "@datarango/ui";

/* ---------------------------------- plans ---------------------------------- */

const PLANS = [
  {
    icon: User,
    name: "Individuals",
    price: "Free",
    period: "to start, no card",
    description:
      "Stay on the free tier as long as you like. When you want the premium catalogue, pick whichever route suits you — subscribe, buy a single course, or spend tokens you earned.",
    features: [
      "Free tier: free-marked courses, standard quizzes, public competitions",
      "Jupyter notebooks in the browser, with a monthly hour allowance",
      "Subscribe for unlimited access to every premium course",
      "Or buy a single course outright — no subscription needed",
      "Or redeem tokens earned from quizzes, streaks and competitions",
      "Verifiable certificates on completion",
    ],
    cta: { label: "Start free", href: "/signup" },
    highlight: false,
  },
  {
    icon: Building2,
    name: "Teams & Schools",
    price: "Per seat",
    period: "per member, monthly",
    description:
      "One subscription, one seat per active member. Seated members get the whole catalogue — assigning courses is how you steer them, not how you're charged.",
    features: [
      "Everything individuals get, for every seated member",
      "Org console: invites, roles, assignments, progress reporting",
      "Private competitions for your organization",
      "Add people mid-cycle — new seats are prorated",
      "Remove someone and their seat frees up immediately",
      "Members keep their certificates and wallet, always",
    ],
    cta: { label: "Create an organization", href: "/signup?intent=org" },
    highlight: true,
  },
  {
    icon: GraduationCap,
    name: "Enterprise & Institutions",
    price: "Custom",
    period: "let's talk",
    description:
      "Rolling Datarango out across a company, university or school system? We'll shape the contract around you.",
    features: [
      "Org SSO (Entra ID, Google Workspace) & MFA policy",
      "Custom roles from the permission catalog",
      "Negotiated per-seat rate, billing cycle and invoicing terms",
      "Org-funded token rewards for your members",
      "Priority support & onboarding",
    ],
    cta: { label: "Book a demo", href: "/contact" },
    highlight: false,
  },
];

export const PricingPlans = () => (
  <section className="container mx-auto px-4 pb-24 lg:px-8">
    <Stagger className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <StaggerItem
          className={cn(
            "flex flex-col rounded-xs border p-8",
            plan.highlight
              ? "bg-ink border-transparent text-white shadow-(--shadow-high)"
              : "border-border bg-card",
          )}
          key={plan.name}
        >
          <plan.icon
            className={cn("size-8", plan.highlight ? "text-primary-300" : "text-primary-500")}
            strokeWidth={1.5}
          />
          <h2 className={cn("font-heading mt-5 text-xl", plan.highlight && "text-white")}>
            {plan.name}
          </h2>
          <p className="mt-4">
            <span className="mono-data text-3xl">{plan.price}</span>{" "}
            <span
              className={cn("text-sm", plan.highlight ? "text-white/60" : "text-muted-foreground")}
            >
              {plan.period}
            </span>
          </p>
          <p
            className={cn(
              "mt-4 text-sm leading-relaxed",
              plan.highlight ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {plan.description}
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li className="flex items-start gap-x-2.5 text-sm" key={feature}>
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    plan.highlight ? "text-primary-300" : "text-primary-500",
                  )}
                />
                <span className={plan.highlight ? "text-white/85" : undefined}>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            className={cn(
              "mt-8 h-11 w-full",
              plan.highlight && "bg-primary-500 hover:bg-primary-400 text-white",
            )}
            variant={plan.highlight ? "default" : "outline"}
          >
            <Link href={plan.cta.href}>{plan.cta.label}</Link>
          </Button>
        </StaggerItem>
      ))}
    </Stagger>
    <FadeIn className="text-muted-foreground mx-auto mt-10 max-w-2xl text-center text-sm">
      Individual course prices are set by their creators. Tokens earned from quizzes, streaks and
      competitions can be redeemed against any token-priced course, whether or not you subscribe.
    </FadeIn>
  </section>
);

/* ----------------------------------- FAQ ------------------------------------ */

const FAQS = [
  {
    question: "What is Datarango?",
    answer:
      "Datarango is a learning platform for data analytics, AI and ML — structured courses with graded exercises, real Jupyter notebooks in the browser, hosted datasets, and live competitions with leaderboards.",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes, and you can stay on it indefinitely. It covers free-marked courses, standard quizzes, public competitions, and a monthly allowance of notebook hours. Premium courses need one of three things: a subscription, a one-off purchase of that course, or tokens you earned on the platform.",
  },
  {
    question: "Should I subscribe or just buy the one course?",
    answer:
      "Subscribe if you expect to work through several courses — it unlocks the whole premium catalogue for a flat monthly price. Buy a single course if there's one specific thing you're after; it stays yours whether or not you ever subscribe. Tokens are a third route that costs no money at all: earn them by passing quizzes, holding streaks and placing in competitions, then redeem them against token-priced courses.",
  },
  {
    question: "How do tokens work?",
    answer:
      "Learning activity — passing quizzes, keeping streaks, placing in competitions — credits tokens to your wallet at rates set by course creators and the platform. Tokens are redeemable for courses and perks inside Datarango; they are not a cryptocurrency and cannot be cashed out.",
  },
  {
    question: "How does billing work for organizations?",
    answer:
      "A per-seat monthly subscription. You license a number of seats and each active member consumes one. Seated members get unlimited access to the catalogue, so assigning a course is how you direct and track their learning — it never adds to the bill. Adding people mid-cycle prorates the new seats; removing someone frees their seat straight away, and a reduction in seat count takes effect at your next renewal.",
  },
  {
    question: "What happens if our organization stops paying?",
    answer:
      "Org features freeze — new assignments, invites, dashboards — but members keep personal access to the courses they were already enrolled in. Their learning history, certificates and wallet always remain theirs, and reinstating the subscription restores everything intact.",
  },
  {
    question: "Do I need programming experience?",
    answer:
      "No. Courses span complete-beginner to advanced tracks. Every course states its prerequisites up front, and notebook exercises come with template code so you're never starting from a blank file.",
  },
  {
    question: "Can I get a certificate?",
    answer:
      "Completing a course — all lessons plus every end-of-module exercise — issues a certificate with a public verification URL you can put on your CV or LinkedIn.",
  },
  {
    question: "How do I teach on Datarango?",
    answer:
      "External creators are welcome. You author courses, quizzes and notebook exercises in Datarango Studio, submit them for review, and set your own prices and token rewards per exercise.",
  },
];

export const PricingFaq = () => (
  <section className="border-border/60 border-t">
    <div className="container mx-auto grid gap-12 px-4 py-24 lg:grid-cols-3 lg:px-8">
      <FadeIn>
        <h2 className="font-heading text-3xl tracking-tight lg:text-4xl">
          Frequently asked questions
        </h2>
        <p className="text-muted-foreground mt-4">
          Something else on your mind?{" "}
          <Link className="text-primary-500 underline-offset-4 hover:underline" href="/contact">
            Talk to us.
          </Link>
        </p>
      </FadeIn>
      <FadeIn className="lg:col-span-2" delay={0.1}>
        <Accordion collapsible type="single">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </div>
  </section>
);
