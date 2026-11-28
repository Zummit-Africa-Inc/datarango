"use client";

import { Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Badge,
  Button,
  PageLayout,
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

import { Notice, Pager, formatDate } from "@/components/people-ui";
import {
  SUBSCRIPTION_STATUS_LABEL,
  formatMoney,
  usePlatformOrgs,
  useStaffSubscriptions,
  type PlanAudience,
  type StaffSubscription,
  type SubscriptionStatus,
} from "@/hooks/operations";
import { usePlatformUsers } from "@/hooks/people";

const PAGE_SIZE = 25;

const STATUS_TONE: Record<SubscriptionStatus, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  pastDue: "warning",
  suspended: "danger",
  cancelled: "neutral",
};

/** Every subscription on Datarango, organisations' and individuals'. */
export default function BillingPage() {
  const canView = useStaffPermission("billing:organization:view");

  return (
    <PageLayout
      title="Billing Operations"
      subtitle="Every subscription, newest first. Open an organisation's to change its plan or price."
    >
      {canView ? (
        <Subscriptions />
      ) : (
        <Notice
          title="You can't see billing"
          body="This needs the billing:organization:view permission."
        />
      )}
    </PageLayout>
  );
}

const Subscriptions = () => {
  const canSeeOrgs = useStaffPermission("orgs:organizations:view");
  const canSeeUsers = useStaffPermission("users:accounts:view");
  const [audience, setAudience] = useState<PlanAudience | "">("");
  const [status, setStatus] = useState<SubscriptionStatus | "">("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStaffSubscriptions({
    audience,
    status,
    page,
    pageSize: PAGE_SIZE,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // Names for the rows on this page, from the directories this person may read.
  const orgIds = [...new Set(items.flatMap((s) => (s.orgId ? [s.orgId] : [])))];
  const userIds = [...new Set(items.flatMap((s) => (s.userId && !s.orgId ? [s.userId] : [])))];
  const { data: orgs } = usePlatformOrgs({
    ids: orgIds,
    pageSize: 100,
    enabled: canSeeOrgs && orgIds.length > 0,
  });
  const { data: users } = usePlatformUsers({
    ids: userIds,
    pageSize: 100,
    enabled: canSeeUsers && userIds.length > 0,
  });
  const orgName = new Map(orgs?.items.map((o) => [o.id, o.name]));
  const userName = new Map(users?.items.map((u) => [u.userId, u.displayName]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={audience || "all"}
            onValueChange={(v) => {
              setAudience(v === "all" ? "" : (v as PlanAudience));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Customer type" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="business">Organisations</SelectItem>
              <SelectItem value="consumer">Individuals</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? "" : (v as SubscriptionStatus));
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              {(Object.keys(SUBSCRIPTION_STATUS_LABEL) as SubscriptionStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {SUBSCRIPTION_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/billing/plans">Plans and pricing</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={8} columns={8} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Wallet className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No subscriptions"
          body={audience || status ? "Nothing matches these filters." : "None have started yet."}
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Customer</TableHead>
                <TableHead className="min-w-40">Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Current period</TableHead>
                <TableHead>Renews / ends</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <Row
                  key={s.id}
                  sub={s}
                  name={
                    s.orgId ? orgName.get(s.orgId) : s.userId ? userName.get(s.userId) : undefined
                  }
                  linkUser={canSeeUsers}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pager
          page={page}
          pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          onPage={setPage}
          noun="subscriptions"
        />
      )}
    </div>
  );
};

const Row = ({
  sub,
  name,
  linkUser,
}: {
  sub: StaffSubscription;
  name: string | undefined;
  linkUser: boolean;
}) => {
  const isOrg = !!sub.orgId;
  const href = isOrg ? `/billing/${sub.orgId}` : linkUser ? `/users/${sub.userId}` : null;
  const label = name ?? (isOrg ? "Organisation" : "Individual");

  return (
    <TableRow>
      <TableCell>
        {href ? (
          <Link href={href} className="block hover:underline">
            <span className="text-ink block font-medium">{label}</span>
            <span className="text-muted-foreground block text-xs">
              {isOrg ? "Organisation" : "Individual"}
            </span>
          </Link>
        ) : (
          <>
            <span className="text-ink block font-medium">{label}</span>
            <span className="text-muted-foreground block text-xs">
              {isOrg ? "Organisation" : "Individual"}
            </span>
          </>
        )}
      </TableCell>
      <TableCell>
        <span className="text-ink block text-sm">{sub.planName}</span>
        <span className="text-muted-foreground block font-mono text-xs">{sub.planCode}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge tone={STATUS_TONE[sub.status]}>{SUBSCRIPTION_STATUS_LABEL[sub.status]}</Badge>
          {sub.cancelAtPeriodEnd && <Badge tone="warning">Cancelling</Badge>}
        </div>
      </TableCell>
      <TableCell className="mono-data text-sm whitespace-nowrap">
        {isOrg ? `${sub.consumedSeats} / ${sub.licensedSeats}` : "—"}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        <span className="mono-data">{formatMoney(sub.unitAmountMinor, sub.currency)}</span>
        <span className="text-muted-foreground">
          {isOrg ? " /seat" : ""} /{sub.interval === "yearly" ? "yr" : "mo"}
        </span>
        {sub.priceSource === "override" && (
          <Badge tone="primary" className="ml-1">
            Negotiated
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDate(sub.startedAt)}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
        {formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap">
        {sub.status === "cancelled" ? (
          <span className="text-muted-foreground">Ended</span>
        ) : (
          <>
            <span className="text-muted-foreground">
              {sub.cancelAtPeriodEnd ? "Ends " : "Renews "}
            </span>
            {formatDate(sub.currentPeriodEnd)}
          </>
        )}
      </TableCell>
    </TableRow>
  );
};
