"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

import { Button, Input, Label } from "@datarango/ui";

import { useCoursePrice, useUpsertCoursePrice } from "@/hooks/economy";

/**
 * What this course costs to unlock with tokens.
 *
 * **No price is not free — it is "not redeemable".** The server says so with
 * its own error code rather than treating a missing row as zero, because a
 * default that expensive should never be implicit. This form says the same
 * thing in words, so a creator who leaves it blank knows what they have chosen.
 *
 * Editable on a published course, like the quiz reward and for the same reason:
 * a price is what the next learner pays, and the amount somebody already paid
 * is copied onto their redemption at the moment they paid it. Repricing cannot
 * restate history.
 *
 * "Withdraw" disables the price instead of deleting it — the course stops being
 * redeemable, the number is kept for when it comes back, and nobody who already
 * unlocked it loses anything.
 */
export const CoursePriceEditor = ({ courseId }: { courseId: string }) => {
  const { data, isLoading } = useCoursePrice(courseId);
  const upsert = useUpsertCoursePrice(courseId);

  const price = data?.price ?? null;

  const [tokens, setTokens] = useState("");

  // Follows the server, which is the source of truth and refetches after a
  // save. Keyed on id + updatedAt so a save resyncs without stomping typing.
  useEffect(() => {
    setTokens(price ? String(price.tokenPrice) : "");
  }, [price?.id, price?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = Number(tokens);
  const valid = tokens.trim().length > 0 && Number.isInteger(value) && value > 0;
  const changed = !price || value !== price.tokenPrice || !price.enabled;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    upsert.mutate({ tokenPrice: value, enabled: true });
  };

  if (isLoading) {
    return null;
  }

  const live = price?.enabled === true;

  return (
    <form className="border-hairline bg-card rounded-xs border p-3" onSubmit={save}>
      <div className="mb-2 flex items-center gap-2">
        <Ticket className="text-muted-foreground size-4" strokeWidth={1.5} />
        <h2 className="font-heading text-ink text-sm font-medium">Unlock with tokens</h2>
        {live && (
          <span className="text-muted-foreground text-xs">
            currently {price!.tokenPrice.toLocaleString()} token
            {price!.tokenPrice === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32 space-y-1.5">
          <Label htmlFor="course-token-price">Tokens</Label>
          <Input
            id="course-token-price"
            min={1}
            onChange={(e) => setTokens(e.target.value)}
            placeholder="—"
            type="number"
            value={tokens}
          />
        </div>

        <Button disabled={!valid || !changed || upsert.isPending} size="sm" type="submit" variant="outline">
          {upsert.isPending ? "Saving…" : live ? "Update price" : "Set price"}
        </Button>

        {live && (
          <Button
            disabled={upsert.isPending}
            onClick={() => upsert.mutate({ tokenPrice: price!.tokenPrice, enabled: false })}
            size="sm"
            type="button"
            variant="ghost"
          >
            Withdraw
          </Button>
        )}
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {live
          ? "Learners with enough tokens can unlock this course themselves. Repricing affects future unlocks only."
          : "Not redeemable with tokens. Leaving this blank doesn't make the course free — it means tokens can't buy it."}
      </p>
    </form>
  );
};
