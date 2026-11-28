"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PageLayout,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@datarango/ui";

import { Field } from "@/components/form";
import { Notice, formatDate } from "@/components/people-ui";
import {
  formatMoney,
  toMinor,
  usePriceBook,
  useRepriceBand,
  type PriceBookBand,
  type PriceBookPlan,
} from "@/hooks/operations";

const AUDIENCE_LABEL = { business: "Organisations", consumer: "Individuals" } as const;

/**
 * The price book. Prices are never edited in place: repricing publishes a new
 * version under a new code and retires the old one from the same moment, so
 * everyone already subscribed keeps the price they agreed to.
 */
export default function PlansPage() {
  const canView = useStaffPermission("billing:organization:view");
  const canManage = useStaffPermission("billing:plans:manage");

  return (
    <PageLayout
      title="Plans and pricing"
      subtitle="What Datarango charges. New prices apply to new sales; existing subscribers keep theirs."
    >
      <Link
        href="/billing"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Billing operations
      </Link>
      {canView || canManage ? (
        <PriceBookView canManage={canManage} />
      ) : (
        <Notice
          title="You can't see pricing"
          body="This needs billing:organization:view or billing:plans:manage."
        />
      )}
    </PageLayout>
  );
}

const planStatus = (p: PriceBookPlan) =>
  p.effectiveTo ? (
    <Badge tone="neutral">Replaced</Badge>
  ) : !p.enabled ? (
    <Badge tone="warning">Off sale</Badge>
  ) : p.onSale ? (
    <Badge tone="success">On sale</Badge>
  ) : (
    <Badge tone="neutral">Scheduled</Badge>
  );

const PriceBookView = ({ canManage }: { canManage: boolean }) => {
  const { data, isLoading } = usePriceBook();
  const [showRetired, setShowRetired] = useState(false);
  const [band, setBand] = useState<PriceBookBand | null>(null);

  if (isLoading) return <Skeleton skeleton="page" />;
  if (!data) return <Notice title="Couldn't load the price book" body="Try again." />;

  const plans = data.plans.filter((p) => showRetired || !p.effectiveTo);
  const bands = data.bands.filter((b) => showRetired || !b.effectiveTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" variant="outline" onClick={() => setShowRetired((v) => !v)}>
          {showRetired ? "Hide replaced prices" : "Show replaced prices"}
        </Button>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/billing/plans/new">New plan</Link>
          </Button>
        )}
      </div>

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <h2 className="text-ink px-4 pt-4 text-sm font-medium">Plans</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">Plan</TableHead>
              <TableHead>For</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Until</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/billing/plans/${p.code}`} className="block hover:underline">
                    <span className="text-ink block font-medium">{p.name}</span>
                    <span className="text-muted-foreground block font-mono text-xs">{p.code}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{AUDIENCE_LABEL[p.audience]}</TableCell>
                <TableCell className="text-sm capitalize">{p.tier}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  <span className="mono-data">{formatMoney(p.unitAmountMinor, p.currency)}</span>
                  <span className="text-muted-foreground">
                    {p.kind === "perSeat" ? " /seat" : ""} /{p.interval === "yearly" ? "yr" : "mo"}
                  </span>
                </TableCell>
                <TableCell className="mono-data">{p.subscribers}</TableCell>
                <TableCell>{planStatus(p)}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(p.effectiveFrom)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {p.effectiveTo ? formatDate(p.effectiveTo) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <div className="px-4 pt-4">
          <h2 className="text-ink text-sm font-medium">Enterprise seat bands</h2>
          <p className="text-muted-foreground text-sm">
            Per-seat monthly prices by organisation size. A band with no price is quoted by sales.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Band</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Price / seat / month</TableHead>
              <TableHead>Lowest quote</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bands.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-sm">
                  {b.code} · {b.currency}
                </TableCell>
                <TableCell className="mono-data text-sm">
                  {b.minSeats.toLocaleString()}
                  {b.maxSeats ? ` – ${b.maxSeats.toLocaleString()}` : "+"}
                </TableCell>
                <TableCell className="mono-data text-sm">
                  {b.unitAmountMinor !== null
                    ? formatMoney(b.unitAmountMinor, b.currency)
                    : "Quoted by sales"}
                </TableCell>
                <TableCell className="mono-data text-muted-foreground text-sm">
                  {b.floorAmountMinor !== null ? formatMoney(b.floorAmountMinor, b.currency) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(b.effectiveFrom)}
                </TableCell>
                <TableCell>
                  {b.effectiveTo ? (
                    <Badge tone="neutral">Replaced</Badge>
                  ) : (
                    <Badge tone="success">Current</Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    {!b.effectiveTo && (
                      <Button size="sm" variant="outline" onClick={() => setBand(b)}>
                        Reprice
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
        <h2 className="text-ink px-4 pt-4 text-sm font-medium">Price changes</h2>
        {data.history.length === 0 ? (
          <p className="text-muted-foreground px-4 pt-1 pb-4 text-sm">
            No changes since prices became editable here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="min-w-64">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(h.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.action}</TableCell>
                  <TableCell className="text-sm">{h.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {band && <BandDialog band={band} onClose={() => setBand(null)} />}
    </div>
  );
};

const BandDialog = ({ band, onClose }: { band: PriceBookBand; onClose: () => void }) => {
  const reprice = useRepriceBand();
  const [quoted, setQuoted] = useState(band.unitAmountMinor === null);
  const [price, setPrice] = useState(
    band.unitAmountMinor !== null ? String(band.unitAmountMinor / 100) : "",
  );
  const [floor, setFloor] = useState(
    band.floorAmountMinor !== null ? String(band.floorAmountMinor / 100) : "",
  );
  const [reason, setReason] = useState("");
  const unit = quoted ? null : toMinor(price);
  const floorMinor = floor.trim() ? toMinor(floor) : null;
  const valid = (quoted || (unit !== null && unit > 0)) && reason.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Reprice {band.code} ({band.currency})
          </DialogTitle>
          <DialogDescription>
            The new price applies to new enterprise sales from now. Organisations already in this
            band keep their price until renewal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Price per seat (${band.currency})`} htmlFor="band-price">
            <Input
              id="band-price"
              inputMode="decimal"
              disabled={quoted}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
          <Field label="Lowest quote (optional)" htmlFor="band-floor">
            <Input
              id="band-floor"
              inputMode="decimal"
              value={floor}
              onChange={(e) => setFloor(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={quoted} onChange={(e) => setQuoted(e.target.checked)} />
            Quoted by sales (no list price)
          </label>
          <Field label="Reason" htmlFor="band-reason" span="full">
            <Textarea
              id="band-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || reprice.isPending}
            onClick={() =>
              reprice.mutate(
                {
                  bandId: band.id,
                  unitAmountMinor: unit,
                  floorAmountMinor: floorMinor,
                  reason: reason.trim(),
                },
                { onSuccess: onClose },
              )
            }
          >
            Publish new price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
