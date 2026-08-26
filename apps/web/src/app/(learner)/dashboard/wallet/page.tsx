"use client";

import Link from "next/link";
import { Coins, Trophy } from "lucide-react";

import { Badge, Button, PageLayout, Skeleton, Statistics } from "@datarango/ui";

import { useDiscoverCompetitions } from "@/hooks/arena";

/**
 * The wallet.
 *
 * There is no balance to show, and this page says so rather than inventing one:
 * `datarango-economy` has module folders and **no RPC subjects and no gateway
 * routes at all**, so there is no balance, no ledger and no payout anywhere in
 * the platform to read. A zero would be a claim about an account that does not
 * exist.
 *
 * What *is* real is reward intent. Competitions store a token total and the
 * number of placements that share it (`tokenRewardTotal` / `placements`) — the
 * schema-now-logic-later shape, so the Phase 5 payout rule attaches to real
 * rows. So this page shows what is actually staked and where, read live from
 * arena, instead of a stub or a fabricated balance.
 */
export default function WalletPage() {
  const { data, isLoading } = useDiscoverCompetitions({ pageSize: 50 });

  const rewarded = (data?.competitions ?? [])
    .filter((c) => c.tokenRewardTotal > 0)
    .sort((a, b) => b.tokenRewardTotal - a.tokenRewardTotal);

  const pool = rewarded.reduce((sum, c) => sum + c.tokenRewardTotal, 0);
  const placements = rewarded.reduce((sum, c) => sum + c.tokenRewardPlacements, 0);
  const open = rewarded.filter((c) => c.status === "open");

  return (
    <PageLayout
      title="Wallet"
      subtitle="Token rewards across the platform, and where they're staked."
    >
      <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
        <p className="text-ink font-medium">Balances aren&apos;t live yet</p>
        <p className="text-muted-foreground mt-1">
          Nothing pays out today — the ledger that would hold a balance doesn&apos;t exist yet, so
          you won&apos;t find a zero here pretending to be one. The rewards below are real and
          recorded against real competitions; what&apos;s missing is the rule that settles them at
          close.
        </p>
      </div>

      {isLoading ? (
        <Skeleton skeleton="page" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Statistics
              label="Staked across the platform"
              value={pool.toLocaleString()}
              icon={Coins}
              description={`${placements} paying place${placements === 1 ? "" : "s"}`}
            />
            <Statistics
              label="Rewarded competitions"
              value={String(rewarded.length)}
              icon={Trophy}
              description={`${open.length} open now`}
            />
            <Statistics label="Your balance" value="—" description="Not available yet" />
          </div>

          {rewarded.length === 0 ? (
            <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
              No competition is currently offering a token reward.
            </p>
          ) : (
            <div className="border-hairline bg-card rounded-xs border">
              <h2 className="border-hairline text-ink border-b px-4 py-3 text-sm font-medium">
                Where the tokens are
              </h2>
              <ul>
                {rewarded.map((competition) => (
                  <li
                    className="border-hairline flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                    key={competition.id}
                  >
                    <span className="text-ink min-w-0 flex-1 truncate font-medium">
                      {competition.title}
                    </span>
                    <Badge variant={competition.status === "open" ? "success" : "outline"}>
                      {competition.status}
                    </Badge>
                    <span className="text-muted-foreground mono-data shrink-0">
                      {competition.tokenRewardTotal.toLocaleString()} tokens ·{" "}
                      {competition.tokenRewardPlacements} place
                      {competition.tokenRewardPlacements === 1 ? "" : "s"}
                    </span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/competitions/${competition.id}`}>Open</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
