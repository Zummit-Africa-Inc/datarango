import { Coins } from "lucide-react";

import { cn, formatMoney, type Pricing } from "../../lib";
import { Badge } from "../ui/badge";

export interface PriceProps {
  pricing: Pricing;
  /** "card" (right-aligned, compact) or "detail" (large, for the purchase card). */
  size?: "card" | "detail";
  locale?: string;
  className?: string;
}

/**
 * Course price (§6.4). Paid: amount in Space Grotesk with compare-at struck
 * through and an optional "or N tokens" line. Free → lime chip; included → primary chip.
 * When the learner already has access, render "Enrolled"/progress instead of this.
 */
export const Price = ({ pricing, size = "card", locale, className }: PriceProps) => {
  if (pricing.kind === "free") {
    return (
      <Badge tone="lime" appearance="soft" className={className}>
        Free
      </Badge>
    );
  }
  if (pricing.kind === "included") {
    return (
      <Badge tone="primary" appearance="soft" className={className}>
        Included with {pricing.plan === "pro" ? "Pro" : "your organisation"}
      </Badge>
    );
  }

  const detail = size === "detail";
  return (
    <div className={cn("flex flex-col", detail ? "items-start" : "items-end", className)}>
      <p className="flex items-baseline gap-2">
        {pricing.amountMinor > 0 && (
          <span
            className={cn(
              "font-display text-foreground font-semibold tabular-nums",
              detail ? "text-3xl" : "text-base",
            )}
          >
            {formatMoney(pricing.amountMinor, pricing.currency, locale)}
          </span>
        )}
        {pricing.compareAtMinor !== undefined && pricing.compareAtMinor > pricing.amountMinor && (
          <s className="text-foreground-subtle text-sm tabular-nums">
            <span className="sr-only">was </span>
            {formatMoney(pricing.compareAtMinor, pricing.currency, locale)}
          </s>
        )}
      </p>
      {pricing.tokenPrice !== undefined && pricing.tokenPrice > 0 && (
        <p className="text-foreground-muted flex items-center gap-1 text-xs">
          {pricing.amountMinor > 0 && "or "}
          <Coins aria-hidden="true" className="text-amber-soft-foreground size-3.5" />
          <span className="tabular-nums">
            {pricing.tokenPrice.toLocaleString(locale ?? "en-GB")}
          </span>{" "}
          tokens
        </p>
      )}
    </div>
  );
};
