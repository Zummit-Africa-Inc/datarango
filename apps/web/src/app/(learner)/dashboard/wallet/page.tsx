"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Coins, Trophy, Undo2 } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { useDiscoverCompetitions } from "@/hooks/arena";
import {
  TRANSACTION_LABELS,
  useRedemptions,
  useWalletStatement,
  type Redemption,
  type StatementLine,
} from "@/hooks/economy";

/**
 * The wallet.
 *
 * Live as of 2026-08-27 — the balance, the statement and the unlock history all
 * come from `datarango-economy`'s wallet module. The page that stood here
 * before said, correctly, that there was no ledger to read; there is one now,
 * so the honest thing to show is what it says.
 *
 * One request drives the top of the page: the statement carries the balance
 * alongside the entries, because a wallet screen that shows both should not ask
 * twice. The competition pool below stays what it always was — reward *intent*
 * recorded against real competitions, which is a different thing from tokens
 * anybody holds, and is labelled as such rather than folded into the balance.
 */
export default function WalletPage() {
  const { data: statement, isLoading } = useWalletStatement({ pageSize: 50 });
  const { data: redemptionData } = useRedemptions();
  const { data: competitionData } = useDiscoverCompetitions({ pageSize: 50 });

  const entries = statement?.entries ?? [];
  const balance = statement?.balance ?? 0;
  const redemptions = redemptionData?.redemptions ?? [];

  const earned = entries
    .filter((entry) => entry.amount > 0 && entry.kind === "reward")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const staked = (competitionData?.competitions ?? [])
    .filter((competition) => competition.tokenRewardTotal > 0)
    .reduce((sum, competition) => sum + competition.tokenRewardTotal, 0);

  return (
    <PageLayout title="Wallet" subtitle="What you've earned, and what you've spent it on.">
      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Statistics
              label="Your balance"
              value={balance.toLocaleString()}
              icon={Coins}
              description={balance === 0 ? "Pass a rewarded quiz to earn" : "tokens"}
            />
            <Statistics
              label="Earned all time"
              value={earned.toLocaleString()}
              description={`${entries.length} ledger entr${entries.length === 1 ? "y" : "ies"}`}
            />
            <Statistics
              label="Staked in competitions"
              value={staked.toLocaleString()}
              icon={Trophy}
              // Named as somebody else's tokens on purpose — this number has
              // never been in anybody's balance and must not read as if it were.
              description="Prize pools, not your tokens"
            />
          </div>

          {entries.length === 0 ? (
            <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
              <Coins className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
              <p className="font-heading text-ink mt-3 text-lg">Nothing in the wallet yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Tokens arrive when you pass a quiz its creator has attached a reward to. Spend them
                to unlock courses.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/dashboard/courses">Browse courses</Link>
              </Button>
            </div>
          ) : (
            <div className="border-hairline bg-card rounded-xs border">
              <h2 className="border-hairline text-ink border-b px-4 py-3 text-sm font-medium">
                Statement
              </h2>
              <ul>
                {entries.map((entry) => (
                  <StatementRow entry={entry} key={entry.id} />
                ))}
              </ul>
            </div>
          )}

          {redemptions.length > 0 && (
            <div className="border-hairline bg-card rounded-xs border">
              <h2 className="border-hairline text-ink border-b px-4 py-3 text-sm font-medium">
                Unlocks
              </h2>
              <ul>
                {redemptions.map((redemption) => (
                  <RedemptionRow key={redemption.id} redemption={redemption} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}

/**
 * One statement line. The sign comes from the ledger rather than from the kind
 * — a release is a positive amount on a redemption, and inferring the direction
 * from the label would render a refund as a charge.
 */
const StatementRow = ({ entry }: { entry: StatementLine }) => {
  const incoming = entry.amount > 0;
  const Icon = entry.kind === "redemptionRelease" ? Undo2 : incoming ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0">
      <Icon
        className={`size-4 shrink-0 ${incoming ? "text-emerald-600" : "text-muted-foreground"}`}
        strokeWidth={1.5}
      />

      <div className="min-w-0 flex-1">
        <p className="text-ink truncate font-medium">{entry.memo || TRANSACTION_LABELS[entry.kind]}</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {TRANSACTION_LABELS[entry.kind]} ·{" "}
          {new Date(entry.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>

      <span
        className={`mono-data shrink-0 font-medium ${incoming ? "text-emerald-600" : "text-ink"}`}
      >
        {incoming ? "+" : ""}
        {entry.amount.toLocaleString()}
      </span>
      <span className="mono-data text-muted-foreground w-20 shrink-0 text-right text-xs">
        {entry.balanceAfter.toLocaleString()}
      </span>
    </li>
  );
};

/**
 * An unlock. A compensated one is shown rather than hidden: somebody whose
 * redemption failed needs to see that it did and that the tokens came back,
 * which is the whole reason the server keeps the row instead of rolling it
 * away.
 */
const RedemptionRow = ({ redemption }: { redemption: Redemption }) => (
  <li className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0">
    <span className="text-ink min-w-0 flex-1 truncate font-medium">
      {redemption.status === "compensated" ? "Unlock did not complete" : "Course unlocked"}
    </span>

    <Badge variant={redemption.status === "committed" ? "success" : "outline"}>
      {redemption.status}
    </Badge>

    <span className="text-muted-foreground mono-data shrink-0">
      {redemption.amount.toLocaleString()} tokens
    </span>

    {redemption.status === "committed" ? (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/dashboard/courses/${redemption.courseId}`}>Open</Link>
      </Button>
    ) : (
      <span className="text-muted-foreground shrink-0 text-xs">Refunded in full</span>
    )}
  </li>
);
