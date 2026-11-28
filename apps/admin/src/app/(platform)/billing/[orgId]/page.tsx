"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  Input,
  Label,
  PageLayout,
  PropertyList,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Notice, formatDate } from "@/components/people-ui";
import {
  formatMoney,
  useBillingPlans,
  useOrgBilling,
  usePlatformOrg,
  useRemovePriceOverride,
  useSetPriceOverride,
  useSubscribeOrg,
  type OrgSubscription,
} from "@/hooks/operations";

/**
 * One organisation's billing. What each person can do follows their
 * permissions: billing:organization:manage starts a subscription,
 * billing:pricing:override sets or removes a negotiated price. Segregation of
 * duties keeps those two apart, so the price is set by someone other than the
 * person who subscribed the organisation.
 */
export default function OrgBillingPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const canView = useStaffPermission("billing:organization:view");

  return (
    <PageLayout title="Organisation billing" subtitle="Subscription, negotiated price and history.">
      <Link
        href="/billing"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Billing operations
      </Link>
      {canView ? (
        <OrgBilling orgId={orgId} />
      ) : (
        <Notice
          title="You can't see billing"
          body="This needs the billing:organization:view permission."
        />
      )}
    </PageLayout>
  );
}

const OrgBilling = ({ orgId }: { orgId: string }) => {
  const canManage = useStaffPermission("billing:organization:manage");
  const canPrice = useStaffPermission("billing:pricing:override");
  const canSeeOrg = useStaffPermission("orgs:organizations:view");
  const { data: org } = usePlatformOrg(orgId, canSeeOrg);
  const { data, isLoading, error } = useOrgBilling(orgId);

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!data) {
    return <Notice title="Couldn't load billing" body={error?.message ?? "Try again."} />;
  }

  const sub = data.subscription;
  const activeOverride = data.overrides.find((o) => o.active);

  return (
    <div className="space-y-6">
      <div className="border-hairline bg-card rounded-xs border p-5">
        <p className="font-heading text-ink text-xl">{org?.org.name ?? "Organisation"}</p>
        <p className="text-muted-foreground font-mono text-xs">{orgId}</p>
      </div>

      {sub ? (
        <Subscription sub={sub} />
      ) : (
        <section className="border-hairline bg-card rounded-xs border p-5">
          <h2 className="text-ink text-sm font-medium">No subscription</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            This organisation isn&apos;t subscribed to a plan.
          </p>
          {canManage && <SubscribeForm orgId={orgId} />}
        </section>
      )}

      {sub && canPrice && (
        <PriceOverrideForm orgId={orgId} currency={sub.currency} hasOverride={!!activeOverride} />
      )}

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <h2 className="text-ink px-4 pt-4 text-sm font-medium">Negotiated prices</h2>
        {data.overrides.length === 0 ? (
          <p className="text-muted-foreground px-4 pt-1 pb-4 text-sm">None ever set.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Price / seat</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead className="min-w-48">Reason</TableHead>
                <TableHead>Ends</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.overrides.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="mono-data">
                    {formatMoney(o.unitAmountMinor, o.currency)}
                  </TableCell>
                  <TableCell className="mono-data text-muted-foreground">
                    {formatMoney(o.standardUnitAmountMinor, o.currency)}
                  </TableCell>
                  <TableCell className="text-sm">{o.reason}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{o.endsAt}</TableCell>
                  <TableCell>
                    {o.active ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">{o.revokedAt ? "Removed" : "Ended"}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <h2 className="text-ink px-4 pt-4 text-sm font-medium">Billing history</h2>
        {data.audit.length === 0 ? (
          <p className="text-muted-foreground px-4 pt-1 pb-4 text-sm">Nothing recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>On</TableHead>
                <TableHead className="min-w-48">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.action}</TableCell>
                  <TableCell className="text-xs">{a.entity}</TableCell>
                  <TableCell className="text-sm">{a.reason ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
};

const Subscription = ({ sub }: { sub: OrgSubscription }) => (
  <section className="border-hairline bg-card rounded-xs border p-5">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <h2 className="text-ink text-sm font-medium">{sub.planName}</h2>
      <Badge tone={sub.grantsAccess ? "success" : "danger"}>{sub.status}</Badge>
      {sub.priceSource === "override" && <Badge tone="primary">Negotiated price</Badge>}
      {sub.cancelAtPeriodEnd && <Badge tone="warning">Cancels at period end</Badge>}
    </div>
    <PropertyList
      items={[
        {
          label: "Price per seat",
          value: `${formatMoney(sub.unitAmountMinor, sub.currency)} / ${sub.interval}`,
        },
        { label: "Seats", value: `${sub.consumedSeats} used of ${sub.licensedSeats}` },
        {
          label: "Current period",
          value: `${formatDate(sub.currentPeriodStart)} – ${formatDate(sub.currentPeriodEnd)}`,
        },
      ]}
    />
  </section>
);

const SubscribeForm = ({ orgId }: { orgId: string }) => {
  const { data } = useBillingPlans();
  const subscribe = useSubscribeOrg();
  const plans = (data?.plans ?? []).filter((p) => p.audience !== "consumer");
  const [planCode, setPlanCode] = useState("");
  const [seats, setSeats] = useState("10");
  const seatCount = Number.parseInt(seats, 10);

  return (
    <form
      className="mt-4 grid gap-4 md:grid-cols-3 md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        subscribe.mutate({ orgId, planCode, seats: seatCount });
      }}
    >
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Select value={planCode} onValueChange={setPlanCode}>
          <SelectTrigger aria-label="Plan">
            <SelectValue placeholder="Choose a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name} · {formatMoney(p.unitAmountMinor, p.currency)}/{p.interval}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seats">Seats</Label>
        <Input
          id="seats"
          inputMode="numeric"
          value={seats}
          onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <Button type="submit" disabled={!planCode || !(seatCount > 0) || subscribe.isPending}>
        Subscribe
      </Button>
    </form>
  );
};

const PriceOverrideForm = ({
  orgId,
  currency,
  hasOverride,
}: {
  orgId: string;
  currency: string;
  hasOverride: boolean;
}) => {
  const set = useSetPriceOverride();
  const remove = useRemovePriceOverride();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const minor = Math.round(Number.parseFloat(amount) * 100);
  const busy = set.isPending || remove.isPending;

  return (
    <section className="border-hairline bg-card space-y-4 rounded-xs border p-5">
      <div>
        <h2 className="text-ink text-sm font-medium">Negotiated price</h2>
        <p className="text-muted-foreground text-sm">
          A per-seat price for this organisation, instead of the standard one. Always give the
          reason; it goes into the billing history.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="override-amount">Price per seat ({currency})</Label>
          <Input
            id="override-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="override-ends">Ends on (optional)</Label>
          <Input
            id="override-ends"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="override-reason">Reason</Label>
          <Input id="override-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {hasOverride && (
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length < 3}
            onClick={() => remove.mutate({ orgId, reason: reason.trim() })}
          >
            Remove negotiated price
          </Button>
        )}
        <Button
          disabled={busy || !(minor > 0) || reason.trim().length < 3}
          onClick={() =>
            set.mutate({
              orgId,
              unitAmountMinor: minor,
              reason: reason.trim(),
              endsAt: endsAt || null,
            })
          }
        >
          {hasOverride ? "Replace negotiated price" : "Set negotiated price"}
        </Button>
      </div>
    </section>
  );
};
