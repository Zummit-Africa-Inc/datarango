"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Badge, Button, Input, PageLayout, PropertyList, Skeleton } from "@datarango/ui";

import { Field, FormActions, FormSection } from "@/components/form";
import { Notice, formatDate } from "@/components/people-ui";
import {
  formatMoney,
  toMinor,
  usePriceBook,
  useRepricePlan,
  useSetPlanEnabled,
  type PriceBookPlan,
} from "@/hooks/operations";

/** One plan: its terms, and, for billing:plans:manage, a new price or taking it off sale. */
export default function PlanPage() {
  const { code } = useParams<{ code: string }>();
  const canView = useStaffPermission("billing:organization:view");
  const canManage = useStaffPermission("billing:plans:manage");
  const { data, isLoading } = usePriceBook(canView || canManage);
  const plan = data?.plans.find((p) => p.code === code);
  const successor = plan?.effectiveTo
    ? data?.plans.find(
        (p) =>
          p.effectiveFrom === plan.effectiveTo &&
          p.tier === plan.tier &&
          p.interval === plan.interval &&
          p.currency === plan.currency,
      )
    : undefined;

  return (
    <PageLayout title={plan?.name ?? "Plan"} subtitle={plan ? plan.code : undefined}>
      <Link
        href="/billing/plans"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Plans and pricing
      </Link>
      {!(canView || canManage) ? (
        <Notice
          title="You can't see pricing"
          body="This needs billing:organization:view or billing:plans:manage."
        />
      ) : isLoading ? (
        <Skeleton skeleton="page" />
      ) : !plan ? (
        <Notice title="Plan not found" body="No plan has that code." />
      ) : (
        <div className="space-y-6">
          <section className="border-hairline bg-card rounded-xs border p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {plan.effectiveTo ? (
                <Badge tone="neutral">Replaced</Badge>
              ) : plan.enabled ? (
                <Badge tone="success">On sale</Badge>
              ) : (
                <Badge tone="warning">Off sale</Badge>
              )}
              {successor && (
                <Link href={`/billing/plans/${successor.code}`} className="text-sm hover:underline">
                  Replaced by {successor.code}
                </Link>
              )}
            </div>
            <PropertyList
              items={[
                {
                  label: "Price",
                  value: `${formatMoney(plan.unitAmountMinor, plan.currency)}${plan.kind === "perSeat" ? " per seat" : ""} per ${plan.interval === "yearly" ? "year" : "month"}`,
                },
                {
                  label: "For",
                  value: plan.audience === "business" ? "Organisations" : "Individuals",
                },
                { label: "Tier", value: <span className="capitalize">{plan.tier}</span> },
                { label: "Subscribers", value: String(plan.subscribers) },
                { label: "On sale from", value: formatDate(plan.effectiveFrom) },
                { label: "Until", value: plan.effectiveTo ? formatDate(plan.effectiveTo) : "—" },
                { label: "Description", value: plan.description || "—" },
              ]}
            />
          </section>

          {canManage && !plan.effectiveTo && <Manage key={plan.id} plan={plan} />}
        </div>
      )}
    </PageLayout>
  );
}

const Manage = ({ plan }: { plan: PriceBookPlan }) => {
  const router = useRouter();
  const reprice = useRepricePlan();
  const setEnabled = useSetPlanEnabled();
  const [price, setPrice] = useState(String(plan.unitAmountMinor / 100));
  const [newCode, setNewCode] = useState(`${plan.code}-${new Date().getFullYear() + 1}`);
  const [name, setName] = useState(plan.name);
  const [reason, setReason] = useState("");
  const [saleReason, setSaleReason] = useState("");
  const minor = toMinor(price);
  const valid =
    minor !== null &&
    (plan.kind === "free" ? minor === 0 : minor > 0) &&
    /^[a-z0-9][a-z0-9-]{2,79}$/.test(newCode) &&
    reason.trim().length >= 3 &&
    (minor !== plan.unitAmountMinor || name.trim() !== plan.name);

  return (
    <>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          reprice.mutate(
            {
              code: plan.code,
              newCode,
              unitAmountMinor: minor ?? 0,
              name: name.trim() === plan.name ? null : name.trim(),
              description: null,
              reason: reason.trim(),
            },
            { onSuccess: () => router.push(`/billing/plans/${newCode}`) },
          );
        }}
      >
        <FormSection
          title="Change the price"
          description={`Publishes a new version from now and retires this one. The ${plan.subscribers} current subscriber${plan.subscribers === 1 ? "" : "s"} keep this price.`}
          cols={3}
        >
          <Field
            label={`New price${plan.kind === "perSeat" ? " per seat" : ""} (${plan.currency})`}
            htmlFor="reprice-amount"
          >
            <Input
              id="reprice-amount"
              inputMode="decimal"
              disabled={plan.kind === "free"}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
          <Field label="New code" htmlFor="reprice-code" hint="Codes are never reused.">
            <Input
              id="reprice-code"
              className="font-mono"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
          </Field>
          <Field label="Name" htmlFor="reprice-name">
            <Input id="reprice-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Reason" htmlFor="reprice-reason" span="full">
            <Input id="reprice-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </FormSection>
        <FormActions>
          <Button type="submit" disabled={!valid || reprice.isPending}>
            Publish new price
          </Button>
        </FormActions>
      </form>

      <FormSection
        title={plan.enabled ? "Take off sale" : "Put back on sale"}
        description={
          plan.enabled
            ? "Stops new subscriptions to this plan. Nobody already on it is affected."
            : "New customers can choose this plan again."
        }
        cols={3}
      >
        <Field label="Reason" htmlFor="sale-reason" span={2}>
          <Input
            id="sale-reason"
            value={saleReason}
            onChange={(e) => setSaleReason(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button
            variant={plan.enabled ? "destructive" : "secondary"}
            disabled={saleReason.trim().length < 3 || setEnabled.isPending}
            onClick={() =>
              setEnabled.mutate(
                { code: plan.code, enabled: !plan.enabled, reason: saleReason.trim() },
                { onSuccess: () => setSaleReason("") },
              )
            }
          >
            {plan.enabled ? "Take off sale" : "Put on sale"}
          </Button>
        </div>
      </FormSection>
    </>
  );
};
