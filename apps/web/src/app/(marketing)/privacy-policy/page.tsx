import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Datarango collects, uses and protects your personal information.",
};

const SECTIONS = [
  {
    heading: "Information we collect",
    paragraphs: [
      "Account information: your name, email address and password when you register, and optionally a phone number and profile details. If you sign in with Google or GitHub, we receive the name and email address those providers share.",
      "Learning activity: courses you enroll in, lesson progress, quiz attempts and scores, notebook files you create, competition submissions, and tokens earned or redeemed. This is the core of the service — it is how progress, certificates and rewards work.",
      "Organization data: if you join an organization (a company or school), that organization's administrators can see your membership, role, and progress in courses they assigned to you. They can never open your personal notebooks or see activity from your personal context.",
      "Payment information: payments are processed by our payment providers. We store records of your transactions but never your full card details.",
    ],
  },
  {
    heading: "How we use your information",
    paragraphs: [
      "To operate the platform: delivering courses, running notebooks, scoring competitions, issuing certificates, crediting token rewards, and generating the progress reports organizations rely on.",
      "To communicate with you: transactional email (verification, password reset, grading results, invoices) and, with your consent, product updates. You can change notification preferences at any time in settings.",
      "To keep the platform safe: detecting abuse, enforcing quotas and sandbox rules, and protecting other users' data.",
    ],
  },
  {
    heading: "What we never do",
    paragraphs: [
      "We do not sell your personal information. We do not share it with third parties for their marketing. Learner code and notebook content is never used for anything other than running and grading your work.",
    ],
  },
  {
    heading: "Data retention & deletion",
    paragraphs: [
      "You can request deletion of your account at any time from settings or by contacting support. Deletion anonymizes your personal information while preserving aggregate records the platform is required to keep consistent (for example, financial ledgers and competition results), which are retained without any link to your identity.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "Data is encrypted in transit and at rest. Access to production systems is restricted, logged and audited. Learner code executes in isolated sandboxes that cannot reach other users' data.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "Subject to the Nigeria Data Protection Act (NDPA) and, where applicable, the GDPR, you may request access to, correction of, or deletion of your personal information, and you may object to or restrict certain processing. Contact privacy@datarango.com to exercise these rights.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about this policy or your data: privacy@datarango.com. We will update this policy as the product evolves and note the date of the latest revision above.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="July 18, 2026"
      intro="This policy describes what Datarango collects, why, and the choices you have. The short version: we collect what the product needs to work, we never sell it, and your learning record belongs to you."
      sections={SECTIONS}
    />
  );
}
