"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Button,
  Input,
  PageLayout,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@datarango/ui";

import { Field, FormActions, FormSection } from "@/components/form";
import { Notice } from "@/components/people-ui";
import {
  formatMoney,
  toMinor,
  usePublishPlan,
  type PlanAudience,
  type PlanInterval,
  type PlanKind,
  type PlanTier,
} from "@/hooks/operations";

const TIERS: Record<PlanAudience, PlanTier[]> = {
  business: ["free", "teams", "enterprise"],
  consumer: ["free", "individual", "student"],
};

const CODE = /^[a-z0-9][a-z0-9-]{2,79}$/;

/** A brand-new plan. To change an existing plan's price, reprice it instead. */
export default function NewPlanPage() {
  const canManage = useStaffPermission("billing:plans:manage");

  return (
    <PageLayout title="New plan" subtitle="Add a plan to the price book.">
      <Link
        href="/billing/plans"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Plans and pricing
      </Link>
      {canManage ? (
        <NewPlanForm />
      ) : (
        <Notice title="You can't publish plans" body="This needs billing:plans:manage." />
      )}
    </PageLayout>
  );
}

const NewPlanForm = () => {
  const router = useRouter();
  const publish = usePublishPlan();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<PlanAudience>("business");
  const [tier, setTier] = useState<PlanTier>("teams");
  const [interval, setBilled] = useState<PlanInterval>("monthly");
  const [currency, setCurrency] = useState("NGN");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");

  const kind: PlanKind = tier === "free" ? "free" : audience === "business" ? "perSeat" : "flat";
  const minor = kind === "free" ? 0 : toMinor(price);
  const valid =
    name.trim().length > 0 &&
    CODE.test(code) &&
    minor !== null &&
    (kind === "free" || minor > 0) &&
    reason.trim().length >= 3;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        publish.mutate(
          {
            code,
            name: name.trim(),
            description: description.trim() || null,
            audience,
            kind,
            tier,
            interval,
            currency,
            unitAmountMinor: minor ?? 0,
            reason: reason.trim(),
          },
          { onSuccess: () => router.push(`/billing/plans/${code}`) },
        );
      }}
    >
      <FormSection title="Plan" cols={3}>
        <Field label="Name" htmlFor="plan-name">
          <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field
          label="Code"
          htmlFor="plan-code"
          hint="Lower-case letters, digits and dashes. Never reused, even after the plan is retired."
        >
          <Input
            id="plan-code"
            className="font-mono"
            placeholder="teams-monthly-ngn-2027"
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
        </Field>
        <Field label="For" htmlFor="plan-audience">
          <Select
            value={audience}
            onValueChange={(v) => {
              const next = v as PlanAudience;
              setAudience(next);
              setTier(TIERS[next][1] ?? "free");
            }}
          >
            <SelectTrigger id="plan-audience" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Organisations (per seat)</SelectItem>
              <SelectItem value="consumer">Individuals (flat price)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description" htmlFor="plan-description" span="full">
          <Textarea
            id="plan-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Price" cols={3}>
        <Field label="Tier" htmlFor="plan-tier">
          <Select value={tier} onValueChange={(v) => setTier(v as PlanTier)}>
            <SelectTrigger id="plan-tier" className="w-full capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIERS[audience].map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Billed" htmlFor="plan-interval">
          <Select value={interval} onValueChange={(v) => setBilled(v as PlanInterval)}>
            <SelectTrigger id="plan-interval" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Currency" htmlFor="plan-currency">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="plan-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">NGN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={kind === "perSeat" ? `Price per seat (${currency})` : `Price (${currency})`}
          htmlFor="plan-price"
          hint={
            kind === "free"
              ? "Free plans cost nothing."
              : minor
                ? `${formatMoney(minor, currency)} ${kind === "perSeat" ? "per seat " : ""}per ${interval === "yearly" ? "year" : "month"}`
                : undefined
          }
        >
          <Input
            id="plan-price"
            inputMode="decimal"
            disabled={kind === "free"}
            value={kind === "free" ? "0" : price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </Field>
        <Field label="Reason" htmlFor="plan-reason" span={2} hint="Goes into the price history.">
          <Input id="plan-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </FormSection>

      <FormActions>
        <Button asChild variant="ghost">
          <Link href="/billing/plans">Cancel</Link>
        </Button>
        <Button type="submit" disabled={!valid || publish.isPending}>
          {publish.isPending ? "Publishing…" : "Publish plan"}
        </Button>
      </FormActions>
    </form>
  );
};
