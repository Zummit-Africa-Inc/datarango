"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, CreditCard, Minus, Plus, Receipt, Users } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, Input, Label, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import {
  formatDate,
  formatMoney,
  useCancelSubscription,
  useInvoices,
  usePayInvoice,
  usePlans,
  useSeatLedger,
  useSetSeats,
  useSubscribe,
  useSubscription,
  type Invoice,
  type Plan,
  type SeatLedger,
  type Subscription,
} from "@/hooks/billing";

/**
 * Billing.
 *
 * `/billing` was the last route in the console nav that 404'd — the same
 * "built and unreachable" shape `/settings`, `/assignments`, `/progress`,
 * `/grading`, `/competitions` and `/roles` each had before they were built.
 * The economy service now answers for all of it.
 *
 * Two permissions gate this, and they are the first things ever to check them:
 * `org.billing.view` to see any of it, `org.billing.manage` to change anything.
 * The read-only fallback is deliberate rather than a blank refusal — somebody
 * without manage can still need to know what the org is paying.
 */
export default function BillingPage() {
  const { activeOrgId } = useActiveOrg();
  const canView = usePermission("org.billing.view");
  const canManage = usePermission("org.billing.manage");

  const { data: subscriptionData, isLoading } = useSubscription(canView ? activeOrgId : null);
  const { data: seatData } = useSeatLedger(activeOrgId, canView);
  const { data: invoiceData } = useInvoices(activeOrgId, canView);

  const subscription = subscriptionData?.subscription ?? null;
  const seats = seatData?.seats ?? null;
  const invoices = invoiceData?.invoices ?? [];

  if (!activeOrgId) {
    return (
      <PageLayout title="Billing" subtitle="Pick an organisation to see its billing.">
        <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
          No organisation selected.
        </p>
      </PageLayout>
    );
  }

  if (!canView) {
    return (
      <PageLayout title="Billing" subtitle="What this organisation is paying for.">
        <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
          <p className="text-ink font-medium">You can&apos;t see billing here</p>
          <p className="text-muted-foreground mt-1">
            Viewing billing needs the{" "}
            <code className="font-code text-xs">org.billing.view</code> permission — ask an owner
            or admin.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Billing" subtitle="Seats, invoices and what renews when.">
      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : subscription === null ? (
        <NoSubscription canManage={canManage} />
      ) : (
        <>
          <StatusBanner subscription={subscription} invoices={invoices} canManage={canManage} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Statistics
              label="Licensed seats"
              value={String(seats?.licensed ?? subscription.licensedSeats)}
              icon={Users}
              description={
                seats?.pendingLicensed != null
                  ? `${seats.pendingLicensed} from ${formatDate(seats.renewsOn)}`
                  : undefined
              }
            />
            <Statistics
              label="In use"
              value={String(seats?.consumed ?? subscription.consumedSeats)}
              description={`${seats?.available ?? 0} available`}
            />
            <Statistics
              label="Plan"
              value={subscription.planName}
              icon={CreditCard}
              description={`${formatMoney(subscription.unitAmountMinor, subscription.currency)} per seat / ${subscription.interval === "yearly" ? "year" : "month"}`}
            />
            <Statistics
              label="Renews"
              value={formatDate(subscription.currentPeriodEnd)}
              description={
                seats
                  ? formatMoney(seats.renewalAmountMinor, seats.currency)
                  : undefined
              }
            />
          </div>

          {seats && <SeatControl canManage={canManage} seats={seats} />}

          <InvoiceList canManage={canManage} invoices={invoices} />

          <PaymentMethods />

          {canManage && !subscription.cancelAtPeriodEnd && <CancelCard />}
        </>
      )}
    </PageLayout>
  );
}

/**
 * The dunning banner.
 *
 * <b>The copy is the point.</b> `pastDue` still grants access — that is the
 * entire reason the state exists between current and suspended — so the message
 * must say so plainly. Telling somebody their team has lost access when it
 * hasn't produces exactly the panic the grace period was designed to avoid.
 */
const StatusBanner = ({
  subscription,
  invoices,
  canManage,
}: {
  subscription: Subscription;
  invoices: Invoice[];
  canManage: boolean;
}) => {
  const pay = usePayInvoice();
  const unpaid = invoices.find((i) => i.status === "open" || i.status === "uncollectible");

  if (subscription.status === "active" && !subscription.cancelAtPeriodEnd) {
    return null;
  }

  if (subscription.cancelAtPeriodEnd) {
    return (
      <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
        <p className="text-ink font-medium">Cancelled — active until {formatDate(subscription.currentPeriodEnd)}</p>
        <p className="text-muted-foreground mt-1">
          This period is paid for, so nothing changes until then. Members keep their access and
          their seats for the rest of it.
        </p>
      </div>
    );
  }

  const suspended = subscription.status === "suspended";

  return (
    <div
      className={`rounded-xs border px-4 py-3 text-sm ${
        suspended ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"
      }`}
    >
      <p className="text-ink flex items-center gap-2 font-medium">
        <AlertTriangle className={`size-4 ${suspended ? "text-red-600" : "text-amber-600"}`} />
        {suspended ? "Subscription suspended" : "Payment didn't go through"}
      </p>
      <p className="text-muted-foreground mt-1">
        {suspended ? (
          <>
            We tried four times over a fortnight and couldn&apos;t collect, so seat access has
            stopped. Paying the outstanding invoice reinstates it immediately — nobody has to be
            re-invited, and courses your members already started stay theirs.
          </>
        ) : (
          <>
            <strong className="text-ink">Your members keep working.</strong> Nothing has been
            switched off — we&apos;ll retry automatically over the next two weeks, and paying now
            stops the retries.
          </>
        )}
      </p>

      {canManage && unpaid && (
        <Button
          className="mt-3"
          disabled={pay.isPending}
          onClick={() => pay.mutate({ invoiceId: unpaid.id })}
          size="sm"
          variant="outline"
        >
          {pay.isPending
            ? "Retrying…"
            : `Retry ${formatMoney(unpaid.totalMinor, unpaid.currency)}`}
        </Button>
      )}
    </div>
  );
};

const NoSubscription = ({ canManage }: { canManage: boolean }) => {
  const { data } = usePlans("business");
  const subscribe = useSubscribe();
  const [seats, setSeats] = useState("5");

  const plans = data?.plans ?? [];
  const seatCount = Number(seats);
  const valid = Number.isInteger(seatCount) && seatCount >= 1;

  return (
    <>
      <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
        <p className="text-ink font-medium">This organisation is on the free tier</p>
        <p className="text-muted-foreground mt-1">
          Members can join and learn freely. A paid plan licenses seats — a seat is consumed per
          active membership, and joiners take a free one whenever the org has spare capacity.
        </p>
      </div>

      {!canManage ? (
        <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
          Starting a subscription needs{" "}
          <code className="font-code text-xs">org.billing.manage</code>.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.code}
              onSubscribe={() => subscribe.mutate({ planCode: plan.code, seats: seatCount })}
              pending={subscribe.isPending}
              plan={plan}
              seatInput={
                plan.kind === "perSeat" ? (
                  <div className="w-24 space-y-1.5">
                    <Label htmlFor={`seats-${plan.code}`}>Seats</Label>
                    <Input
                      id={`seats-${plan.code}`}
                      min={1}
                      onChange={(e) => setSeats(e.target.value)}
                      type="number"
                      value={seats}
                    />
                  </div>
                ) : null
              }
              valid={plan.kind !== "perSeat" || valid}
            />
          ))}
        </div>
      )}
    </>
  );
};

const PlanCard = ({
  plan,
  seatInput,
  valid,
  pending,
  onSubscribe,
}: {
  plan: Plan;
  seatInput: React.ReactNode;
  valid: boolean;
  pending: boolean;
  onSubscribe: () => void;
}) => (
  <div className="border-hairline bg-card flex flex-col gap-3 rounded-xs border p-4">
    <div>
      <h2 className="font-heading text-ink text-lg">{plan.name}</h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{plan.description}</p>
    </div>
    <p className="text-ink mono-data text-xl">
      {formatMoney(plan.unitAmountMinor, plan.currency)}
      <span className="text-muted-foreground ml-1 text-sm">
        {plan.kind === "perSeat" ? "per seat / " : ""}
        {plan.interval === "yearly" ? "year" : "month"}
      </span>
    </p>
    {seatInput}
    <Button className="mt-auto" disabled={!valid || pending} onClick={onSubscribe}>
      {pending ? "Starting…" : "Choose plan"}
    </Button>
  </div>
);

/**
 * Seat changes.
 *
 * The asymmetry is spelled out in the copy because it is genuinely surprising
 * and entirely deliberate: adding applies now and is prorated for the rest of
 * the period; removing waits for renewal, because the seat is already paid for
 * and still usable, so taking it away early would mean either refunding it or
 * confiscating something bought.
 */
const SeatControl = ({ seats, canManage }: { seats: SeatLedger; canManage: boolean }) => {
  const setSeats = useSetSeats();
  const [value, setValue] = useState(String(seats.licensed));

  useEffect(() => {
    setValue(String(seats.pendingLicensed ?? seats.licensed));
  }, [seats.licensed, seats.pendingLicensed]);

  const next = Number(value);
  const valid = Number.isInteger(next) && next >= 0;
  const changed = valid && next !== (seats.pendingLicensed ?? seats.licensed);
  const belowConsumed = valid && next < seats.consumed;

  return (
    <div className="border-hairline bg-card rounded-xs border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="text-muted-foreground size-4" strokeWidth={1.5} />
        <h2 className="font-heading text-ink text-sm font-medium">Seats</h2>
        <span className="text-muted-foreground text-xs">
          {seats.consumed} of {seats.licensed} in use
        </span>
      </div>

      {canManage ? (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <Button
              aria-label="One fewer seat"
              disabled={!valid || next <= 0}
              onClick={() => setValue(String(Math.max(0, next - 1)))}
              size="sm"
              variant="outline"
            >
              <Minus className="size-3.5" />
            </Button>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="licensed-seats">Licensed</Label>
              <Input
                id="licensed-seats"
                min={0}
                onChange={(e) => setValue(e.target.value)}
                type="number"
                value={value}
              />
            </div>
            <Button
              aria-label="One more seat"
              disabled={!valid}
              onClick={() => setValue(String(next + 1))}
              size="sm"
              variant="outline"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              disabled={!changed || belowConsumed || setSeats.isPending}
              onClick={() => setSeats.mutate({ seats: next })}
              size="sm"
            >
              {setSeats.isPending ? "Saving…" : "Update seats"}
            </Button>
          </div>

          <p className="text-muted-foreground mt-2 text-xs">
            {belowConsumed ? (
              <span className="text-red-600">
                {seats.consumed} seat{seats.consumed === 1 ? " is" : "s are"} in use. Remove members
                before reducing below that.
              </span>
            ) : next > seats.licensed ? (
              <>Adding seats takes effect now, charged pro-rata for the rest of this period.</>
            ) : next < seats.licensed ? (
              <>
                Reducing takes effect on {formatDate(seats.renewsOn)}. The seats you have are paid
                for until then, so nobody loses one early.
              </>
            ) : (
              <>
                Adding takes effect immediately and is prorated; reducing applies at renewal on{" "}
                {formatDate(seats.renewsOn)}.
              </>
            )}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-xs">
          Changing seats needs <code className="font-code">org.billing.manage</code>.
        </p>
      )}

      {seats.pendingLicensed != null && (
        <p className="text-muted-foreground border-hairline mt-3 border-t pt-3 text-xs">
          Queued: dropping to <strong className="text-ink">{seats.pendingLicensed}</strong> seats on{" "}
          {formatDate(seats.renewsOn)} —{" "}
          {formatMoney(seats.renewalAmountMinor, seats.currency)} at renewal.
        </p>
      )}
    </div>
  );
};

const InvoiceList = ({ invoices, canManage }: { invoices: Invoice[]; canManage: boolean }) => {
  const pay = usePayInvoice();

  return (
    <div className="border-hairline bg-card rounded-xs border">
      <h2 className="border-hairline text-ink flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
        <Receipt className="text-muted-foreground size-4" strokeWidth={1.5} />
        Invoices
      </h2>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          No invoices yet.
        </p>
      ) : (
        <ul>
          {invoices.map((invoice) => (
            <li
              className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
              key={invoice.id}
            >
              <code className="text-muted-foreground font-code shrink-0 text-xs">
                DR-{String(invoice.number).padStart(6, "0")}
              </code>
              <span className="text-ink min-w-0 flex-1 truncate">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </span>
              <InvoiceBadge status={invoice.status} />
              <span className="text-ink mono-data shrink-0 font-medium">
                {formatMoney(invoice.totalMinor, invoice.currency)}
              </span>
              {canManage && (invoice.status === "open" || invoice.status === "uncollectible") && (
                <Button
                  disabled={pay.isPending}
                  onClick={() => pay.mutate({ invoiceId: invoice.id })}
                  size="sm"
                  variant="outline"
                >
                  Pay
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const InvoiceBadge = ({ status }: { status: Invoice["status"] }) => {
  // `noCharge` is a zero invoice, which the free tier produces every period. It
  // reads as "nothing to pay" rather than as a failure, because it isn't one.
  const label: Record<Invoice["status"], string> = {
    open: "Due",
    paid: "Paid",
    uncollectible: "Unpaid",
    void: "Void",
    noCharge: "No charge",
  };

  const variant = status === "paid" ? "success" : status === "uncollectible" ? "destructive" : "outline";

  return (
    <Badge variant={variant}>
      {status === "paid" && <Check className="mr-1 size-3" />}
      {label[status]}
    </Badge>
  );
};

/**
 * Payment methods.
 *
 * <b>Says what is true rather than showing an empty card list.</b> No payment
 * provider is connected yet — billing runs against a development provider that
 * collects everything — so there is no card on file to display, and a "no cards
 * added" empty state would imply somebody could add one. The confirmed shape is
 * Paystack for NGN and Stripe for everything else, behind an interface that is
 * already wired; what is missing is the API keys and the two adapters.
 */
const PaymentMethods = () => (
  <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
    <p className="text-ink flex items-center gap-2 font-medium">
      <CreditCard className="text-muted-foreground size-4" strokeWidth={1.5} />
      Payment methods aren&apos;t connected yet
    </p>
    <p className="text-muted-foreground mt-1">
      Invoices are issued, collected and chased on the real schedule, but against a development
      processor — so there is no card on file to show you, and nothing here is charging anyone.
      Card and bank details arrive with the payment provider.
    </p>
  </div>
);

const CancelCard = () => {
  const cancel = useCancelSubscription();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="border-hairline bg-card rounded-xs border p-4">
      <h2 className="font-heading text-ink text-sm font-medium">Cancel subscription</h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Cancelling stops the next renewal. This period is already paid for, so members keep their
        seats and their access until {""}
        it ends — cancelling is never a way to lose something you have bought.
      </p>

      {confirming ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(undefined, { onSuccess: () => setConfirming(false) })}
            size="sm"
            variant="destructive"
          >
            {cancel.isPending ? "Cancelling…" : "Yes, cancel at period end"}
          </Button>
          <Button onClick={() => setConfirming(false)} size="sm" variant="ghost">
            Keep it
          </Button>
        </div>
      ) : (
        <Button className="mt-3" onClick={() => setConfirming(true)} size="sm" variant="outline">
          Cancel subscription
        </Button>
      )}
    </div>
  );
};
