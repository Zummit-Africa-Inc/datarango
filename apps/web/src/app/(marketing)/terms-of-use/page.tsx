import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern your use of Datarango.",
};

const SECTIONS = [
  {
    heading: "Your account",
    paragraphs: [
      "You must provide accurate information when creating an account and keep your credentials secure. You are responsible for activity under your account. One person, one account — accounts created to farm token rewards will be closed.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Notebooks run real code, and we give you real freedom — within limits. You may not use compute resources for anything other than learning and competition work (no mining, no attacking other systems, no attempting to escape the sandbox), may not scrape or redistribute platform content, and may not interfere with other users' work.",
    ],
  },
  {
    heading: "Courses, purchases & tokens",
    paragraphs: [
      "Premium content may be accessed through an individual subscription, a one-off purchase of a specific course, or redemption of tokens. A one-off purchase grants a personal, non-transferable license to that course for the purchased version and survives the lapse of any subscription. Subscription access lasts for as long as the subscription is active.",
      "Tokens are an in-platform reward with no cash value; they can be earned through learning activity and redeemed for courses and perks, but not transferred between users or exchanged for money. Reward rules include anti-abuse limits, and we may reverse credits obtained through abuse.",
      "Courses you are enrolled in through an organization remain accessible to you even if that organization's account lapses.",
    ],
  },
  {
    heading: "Competitions",
    paragraphs: [
      "Each competition states its own rules — submission limits, team policies, data usage. Breaking competition rules (private sharing of solutions, multiple accounts, probing the test set) leads to removal from the leaderboard and may lead to account closure.",
    ],
  },
  {
    heading: "Your content",
    paragraphs: [
      "You retain ownership of code, notebooks and datasets you upload. You grant Datarango the license needed to store, execute, grade and display them as part of operating the service. Datasets you publish publicly are shared under the license you select at publication.",
    ],
  },
  {
    heading: "Creators",
    paragraphs: [
      "Creators publishing courses, quizzes or exercises warrant that they hold the rights to their content and grant Datarango the license to distribute it to enrolled learners. Creator payout and revenue-share terms are set out in the separate Creator Agreement.",
    ],
  },
  {
    heading: "Organizations",
    paragraphs: [
      "Organization subscriptions are charged per licensed seat for each billing cycle. A seat is consumed by each active membership; members added mid-cycle are charged pro rata, seats freed by removing a member become available immediately, and reductions in the licensed seat count take effect at the next renewal. Organization owners are responsible for these charges.",
      "Overdue invoices lead to suspension of organization features after the dunning period; members' personal access to courses they are already enrolled in is never revoked.",
    ],
  },
  {
    heading: "Disclaimers & liability",
    paragraphs: [
      "The service is provided as-is. We work hard on availability but do not guarantee uninterrupted access — notebook sessions in particular have idle and duration limits, and unsaved state outside your persistent storage may be lost. To the maximum extent permitted by law, Datarango's liability is limited to the amounts you paid us in the twelve months preceding a claim.",
    ],
  },
  {
    heading: "Changes & termination",
    paragraphs: [
      "We may update these terms as the product evolves; material changes will be announced in advance. You may close your account at any time. We may suspend accounts that violate these terms, with notice where practicable.",
      "Questions about these terms: legal@datarango.com.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <LegalDocument
      title="Terms of Use"
      updated="July 18, 2026"
      intro="These terms govern your use of Datarango — the learning platform, notebooks, competitions, wallet and organization console. By creating an account you agree to them."
      sections={SECTIONS}
    />
  );
}
