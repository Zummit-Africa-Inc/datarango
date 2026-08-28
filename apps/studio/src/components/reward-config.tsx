"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

import { Button, Input, Label } from "@datarango/ui";

import {
  useDeleteRewardRule,
  useRewardRule,
  useUpsertRewardRule,
  type RewardScope,
} from "@/hooks/economy";

/**
 * What passing this quiz pays in tokens.
 *
 * **Editable after publish, unlike everything else on the quiz.** Publishing
 * freezes questions and point values because a recorded score has to keep
 * meaning what it meant — but the reward is not part of that contract. It is
 * what the platform pays going forward, and changing it revalues nothing that
 * already happened: the server keeps every grant it has made, and removing the
 * rule claws nothing back.
 *
 * The ceilings are the server's (1..1000 per reward, and a per-person daily cap
 * across every rule that no creator can raise). This form only avoids sending
 * input that is obviously invalid; it does not restate the rules, because two
 * copies of a limit drift.
 */
export const RewardConfig = ({
  scope,
  targetId,
  label = "Reward",
}: {
  scope: RewardScope;
  targetId: string;
  label?: string;
}) => {
  const { data, isLoading } = useRewardRule(scope, targetId);
  const upsert = useUpsertRewardRule(scope, targetId);
  const remove = useDeleteRewardRule(scope, targetId);

  const rule = data?.rule ?? null;

  const [amount, setAmount] = useState("");
  const [perUser, setPerUser] = useState("1");

  // The server is the source of truth and the query refetches after a save, so
  // the fields follow it rather than holding a stale draft. Keyed on the rule's
  // id + updatedAt so a save resyncs but ordinary re-renders do not stomp
  // whatever is being typed.
  useEffect(() => {
    setAmount(rule ? String(rule.amount) : "");
    setPerUser(rule ? String(rule.maxAwardsPerUser) : "1");
  }, [rule?.id, rule?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const amountValue = Number(amount);
  const perUserValue = Number(perUser);
  const hasAmount = amount.trim().length > 0;
  const valid =
    hasAmount &&
    Number.isInteger(amountValue) &&
    amountValue > 0 &&
    Number.isInteger(perUserValue) &&
    perUserValue >= 1;

  const changed =
    !rule || amountValue !== rule.amount || perUserValue !== rule.maxAwardsPerUser;

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    upsert.mutate({ amount: amountValue, maxAwardsPerUser: perUserValue, enabled: true });
  };

  if (isLoading) {
    return null;
  }

  return (
    <form className="border-hairline bg-card rounded-xs border p-3" onSubmit={save}>
      <div className="mb-2 flex items-center gap-2">
        <Coins className="text-muted-foreground size-4" strokeWidth={1.5} />
        <h2 className="font-heading text-ink text-sm font-medium">{label}</h2>
        {rule && (
          <span className="text-muted-foreground text-xs">
            currently paying {rule.amount.toLocaleString()} token
            {rule.amount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32 space-y-1.5">
          <Label htmlFor="reward-amount">Tokens</Label>
          <Input
            id="reward-amount"
            min={1}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="—"
            type="number"
            value={amount}
          />
        </div>

        <div className="w-32 space-y-1.5">
          <Label htmlFor="reward-per-user">Times per person</Label>
          <Input
            id="reward-per-user"
            min={1}
            onChange={(e) => setPerUser(e.target.value)}
            type="number"
            value={perUser}
          />
        </div>

        <Button disabled={!valid || !changed || upsert.isPending} size="sm" type="submit" variant="outline">
          {upsert.isPending ? "Saving…" : rule ? "Update reward" : "Set reward"}
        </Button>

        {rule && (
          <Button
            disabled={remove.isPending}
            onClick={() => remove.mutate({ ruleId: rule.id })}
            size="sm"
            type="button"
            variant="ghost"
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </Button>
        )}
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {rule
          ? "Learners see this before they take the quiz. Changing it affects future passes only — tokens already earned stay earned."
          : "No reward yet. Set one and learners are paid automatically when they pass."}
      </p>
    </form>
  );
};
