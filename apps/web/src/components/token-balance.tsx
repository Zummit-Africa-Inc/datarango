"use client";

import Link from "next/link";
import { Coins } from "lucide-react";

import { useWalletBalance } from "@/hooks/economy";

/** Top-bar token counter; links to the wallet. */
export const TokenBalance = () => {
  const { data } = useWalletBalance();
  const balance = data?.balance ?? 0;
  const formatted = balance.toLocaleString("en-GB");

  return (
    <Link
      href="/dashboard/wallet"
      aria-label={`${formatted} tokens. Open wallet`}
      className="bg-amber-soft text-amber-soft-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold tabular-nums outline-none focus-visible:ring-2"
    >
      <Coins aria-hidden="true" className="size-4" />
      <span className="font-mono">{data ? formatted : "–"}</span>
    </Link>
  );
};
