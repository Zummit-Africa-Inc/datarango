"use client";

import {
  Building2,
  ClipboardCheck,
  Coins,
  GraduationCap,
  MailWarning,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Button,
  Skeleton,
  StatCard,
  WidgetRenderer,
  type ChartWidget,
  type TableWidget,
} from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import {
  monthLabel,
  useAccountMetrics,
  useBillingMetrics,
  useLearningMetrics,
  useTokenMetrics,
  type CurrencyAmount,
} from "@/hooks/metrics";
import { useDeadLetters } from "@/hooks/notifications";
import { formatMoney } from "@/hooks/operations";
import { useStaffAccounts } from "@/hooks/people";
import { useReviewQueue } from "@/hooks/review";

const RANGES = [6, 12, 24] as const;

/**
 * The admin home: headline numbers, trends and the work waiting. Every panel
 * is requested only when the person holds the permission for its data, so
 * nobody sees a number they aren't allowed to and nothing comes back as a 403.
 */
export default function OverviewPage() {
  const [months, setMonths] = useState<number>(12);
  const can = {
    platform: useStaffPermission("platform:overview:view"),
    billing: useStaffPermission("billing:organization:view"),
    rewards: useStaffPermission("rewards:rules:view"),
    learning: useStaffPermission("learning:courses:view"),
    review: useStaffPermission("creator:courses:approve"),
    notifications: useStaffPermission("notifications:deliveries:view"),
    staff: useStaffPermission("staff:accounts:view"),
  };

  const accounts = useAccountMetrics(months, can.platform);
  const billing = useBillingMetrics(months, can.billing);
  const tokens = useTokenMetrics(months, can.rewards);
  const learning = useLearningMetrics(months, can.learning);

  if (!Object.values(can).some(Boolean)) {
    return (
      <Notice
        title="Nothing to show yet"
        body="Your roles don't include any of the areas summarised here. Ask a Super admin if you need access."
      />
    );
  }

  const withYear = months > 12;
  const labels = (rows: { month: string }[]) => rows.map((r) => monthLabel(r.month, withYear));

  const stats: ReactNode[] = [];
  const charts: ReactNode[] = [];

  if (can.platform) {
    const a = accounts.data;
    stats.push(
      <Stat
        key="users"
        href="/users"
        label="Users"
        loading={accounts.isLoading}
        value={a?.users.total}
        delta={a ? `+${a.users.newLast30Days.toLocaleString()} in 30 days` : undefined}
        sparkline={a?.users.signupsByMonth.map((m) => m.count)}
        icon={Users}
      />,
      <Stat
        key="active"
        href="/users"
        label="Signed in, last 30 days"
        loading={accounts.isLoading}
        value={a?.users.activeLast30Days}
        hint={
          a && a.users.total > 0
            ? `${Math.round((a.users.activeLast30Days / a.users.total) * 100)}% of users`
            : undefined
        }
        icon={UserCheck}
      />,
      <Stat
        key="orgs"
        href="/organizations"
        label="Organisations"
        loading={accounts.isLoading}
        value={a?.orgs.total}
        delta={a ? `+${a.orgs.newLast30Days} in 30 days` : undefined}
        sparkline={a?.orgs.createdByMonth.map((m) => m.count)}
        icon={Building2}
      />,
    );
    charts.push(
      <Chart
        key="signups"
        loading={accounts.isLoading}
        widget={
          a && {
            id: "signups",
            name: "New users and organisations",
            type: "data",
            dataType: "chart",
            chartType: "area",
            data: {
              labels: labels(a.users.signupsByMonth),
              series: [
                { name: "Users", data: a.users.signupsByMonth.map((m) => m.count) },
                { name: "Organisations", data: a.orgs.createdByMonth.map((m) => m.count) },
              ],
            },
          }
        }
      />,
    );
  }

  if (can.billing) {
    const b = billing.data;
    stats.push(
      <Stat
        key="mrr"
        href="/billing"
        label="Monthly recurring revenue"
        loading={billing.isLoading}
        text={b ? money(b.monthlyRecurring.slice(0, 1)) : undefined}
        hint={
          b
            ? [
                b.monthlyRecurring.length > 1 ? `+ ${money(b.monthlyRecurring.slice(1))}` : null,
                `${b.activeOrganisations} organisations · ${b.activeIndividuals} individuals`,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        icon={Wallet}
      />,
    );
    const currencies = [...new Set(b?.byMonth.flatMap((m) => m.paid.map((p) => p.currency)))];
    charts.push(
      ...(currencies.length === 0
        ? [
            <Chart
              key="revenue"
              loading={billing.isLoading}
              empty="No invoices paid in this period."
              widget={b && emptyChart("revenue", "Paid invoices")}
            />,
          ]
        : currencies.map((c) => (
            <Chart
              key={`revenue-${c}`}
              loading={billing.isLoading}
              widget={
                b && {
                  id: `revenue-${c}`,
                  name: `Paid invoices · ${c}`,
                  type: "data",
                  dataType: "chart",
                  chartType: "bar",
                  data: {
                    labels: labels(b.byMonth),
                    series: [
                      {
                        name: c,
                        data: b.byMonth.map(
                          (m) => (m.paid.find((p) => p.currency === c)?.amountMinor ?? 0) / 100,
                        ),
                      },
                    ],
                  },
                }
              }
            />
          ))),
      <Chart
        key="subscriptions"
        loading={billing.isLoading}
        widget={
          b && {
            id: "subscriptions",
            name: "New subscriptions",
            type: "data",
            dataType: "chart",
            chartType: "bar",
            data: {
              labels: labels(b.byMonth),
              series: [
                { name: "Organisations", data: b.byMonth.map((m) => m.newOrganisations) },
                { name: "Individuals", data: b.byMonth.map((m) => m.newIndividuals) },
              ],
            },
          }
        }
      />,
      <Chart
        key="plans"
        loading={billing.isLoading}
        empty={b && b.byPlan.length === 0 ? "No live subscriptions." : undefined}
        widget={
          b && {
            id: "plans",
            name: "Live subscriptions by plan",
            type: "data",
            dataType: "chart",
            chartType: "donut",
            data: {
              labels: b.byPlan.map((p) => p.planName),
              series: [{ name: "Subscriptions", data: b.byPlan.map((p) => p.subscriptions) }],
            },
          }
        }
      />,
    );
  }

  if (can.learning) {
    const l = learning.data;
    stats.push(
      <Stat
        key="learners"
        href="/courses"
        label="Learners"
        loading={learning.isLoading}
        value={l?.enrolments.learners}
        hint={
          l
            ? `${l.enrolments.activeLearnersLast30Days.toLocaleString()} active in 30 days · ${l.enrolments.completed.toLocaleString()} courses finished`
            : undefined
        }
        sparkline={l?.enrolments.byMonth.map((m) => m.enrolments)}
        icon={GraduationCap}
      />,
    );
    charts.push(
      <Chart
        key="enrolments"
        loading={learning.isLoading}
        widget={
          l && {
            id: "enrolments",
            name: "Enrolments and completions",
            type: "data",
            dataType: "chart",
            chartType: "line",
            data: {
              labels: labels(l.enrolments.byMonth),
              series: [
                { name: "Enrolments", data: l.enrolments.byMonth.map((m) => m.enrolments) },
                { name: "Completions", data: l.enrolments.byMonth.map((m) => m.completions) },
              ],
            },
          }
        }
      />,
      <Chart
        key="courses"
        loading={learning.isLoading}
        widget={
          l && {
            id: "courses",
            name: `Courses by status · ${l.courses.total}`,
            type: "data",
            dataType: "chart",
            chartType: "donut",
            data: {
              labels: ["Published", "In review", "Draft", "Archived"],
              series: [
                {
                  name: "Courses",
                  data: [
                    l.courses.byStatus.published,
                    l.courses.byStatus.review,
                    l.courses.byStatus.draft,
                    l.courses.byStatus.archived,
                  ],
                },
              ],
            },
          }
        }
      />,
    );
  }

  if (can.rewards) {
    const t = tokens.data;
    stats.push(
      <Stat
        key="tokens"
        href="/rewards"
        label="Tokens rewarded"
        loading={tokens.isLoading}
        value={t?.tokensRewarded}
        hint={
          t
            ? `${t.tokensRedeemed.toLocaleString()} spent · ${t.peopleRewarded.toLocaleString()} people paid`
            : undefined
        }
        sparkline={t?.byMonth.map((m) => m.rewarded)}
        icon={Coins}
      />,
    );
    charts.push(
      <Chart
        key="tokens"
        loading={tokens.isLoading}
        widget={
          t && {
            id: "tokens",
            name: "Tokens rewarded and spent",
            type: "data",
            dataType: "chart",
            chartType: "bar",
            data: {
              labels: labels(t.byMonth),
              series: [
                { name: "Rewarded", data: t.byMonth.map((m) => m.rewarded) },
                { name: "Spent", data: t.byMonth.map((m) => m.redeemed) },
              ],
            },
          }
        }
      />,
    );
  }

  const work: ReactNode[] = [];
  if (can.review) work.push(<ReviewTile key="review" />);
  if (can.notifications) work.push(<FailedNotificationsTile key="dead" />);
  if (can.staff) work.push(<StaffTile key="staff" />);
  if (can.billing && billing.data) {
    work.push(
      <Stat
        key="pastdue"
        href="/billing"
        label="Past due or cancelling"
        loading={false}
        value={billing.data.pastDue + billing.data.cancellingAtPeriodEnd}
        hint={`${billing.data.pastDue} past due · ${billing.data.cancellingAtPeriodEnd} cancelling · ${money(billing.data.openInvoices)} unpaid`}
        icon={Wallet}
      />,
    );
  }

  return (
    <div className="space-y-6">
      {charts.length > 0 && (
        <div className="flex items-center justify-end gap-1">
          {RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={months === r ? "secondary" : "ghost"}
              onClick={() => setMonths(r)}
            >
              {r} months
            </Button>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{stats}</div>
      )}

      {charts.length > 0 && <div className="grid gap-6 lg:grid-cols-2">{charts}</div>}

      {work.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-ink text-sm font-medium">Waiting on staff</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{work}</div>
        </section>
      )}
    </div>
  );
}

const emptyChart = (id: string, name: string): ChartWidget => ({
  id,
  name,
  type: "data",
  dataType: "chart",
  chartType: "bar",
  data: { labels: [], series: [] },
});

/** Amounts in several currencies, never added together. */
const money = (amounts: CurrencyAmount[]) =>
  amounts.length === 0
    ? formatMoney(0, "NGN")
    : amounts.map((a) => formatMoney(a.amountMinor, a.currency)).join(" · ");

const Stat = ({
  href,
  label,
  value,
  text,
  delta,
  hint,
  sparkline,
  icon,
  loading,
}: {
  href: string;
  label: string;
  value?: number;
  text?: string;
  delta?: string;
  hint?: string;
  sparkline?: number[];
  icon: LucideIcon;
  loading: boolean;
}) =>
  loading ? (
    <Skeleton skeleton="widget" />
  ) : (
    <Link href={href} className="block h-full transition-opacity hover:opacity-90">
      <StatCard
        className="h-full"
        label={label}
        value={text ?? (value ?? 0).toLocaleString()}
        delta={delta}
        positiveIsGood
        hint={hint}
        icon={icon}
        sparkline={sparkline && sparkline.some((n) => n > 0) ? sparkline : undefined}
      />
    </Link>
  );

const Chart = ({
  widget,
  loading,
  empty,
}: {
  widget: ChartWidget | TableWidget | undefined;
  loading: boolean;
  empty?: string;
}) =>
  loading || !widget ? (
    <Skeleton skeleton="widget" />
  ) : empty ? (
    <div className="border-border bg-card flex h-full min-h-64 flex-col rounded-md border p-5">
      <p className="text-ink text-sm font-medium">{widget.name}</p>
      <p className="text-muted-foreground m-auto text-sm">{empty}</p>
    </div>
  ) : (
    <WidgetRenderer widget={widget} />
  );

const ReviewTile = () => {
  const { data, isLoading } = useReviewQueue({ pageSize: 100 });
  const count = data?.length ?? 0;
  return (
    <Stat
      href="/review"
      label="Courses waiting for review"
      value={count}
      hint={count >= 100 ? "100 or more" : undefined}
      icon={ClipboardCheck}
      loading={isLoading}
    />
  );
};

const FailedNotificationsTile = () => {
  const { data, isLoading } = useDeadLetters({ pageSize: 1 });
  return (
    <Stat
      href="/notifications"
      label="Failed notifications"
      value={data?.total}
      icon={MailWarning}
      loading={isLoading}
    />
  );
};

const StaffTile = () => {
  const { data, isLoading } = useStaffAccounts();
  return (
    <Stat
      href="/staff"
      label="Staff"
      value={data?.filter((a) => a.status !== "deactivated").length}
      icon={UserCog}
      loading={isLoading}
    />
  );
};
