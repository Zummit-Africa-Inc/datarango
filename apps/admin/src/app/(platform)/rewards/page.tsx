"use client";

import { Coins } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  StatCard,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@datarango/ui";

import { Field } from "@/components/form";
import { Notice, Pager, formatDate } from "@/components/people-ui";
import { usePlatformUsers } from "@/hooks/people";
import {
  REWARD_SCOPE_LABEL,
  ruleState,
  useStaffRewardRules,
  useUpdateRewardRule,
  type RewardScope,
  type RewardState,
  type StaffRewardRule,
} from "@/hooks/rewards";

const PAGE_SIZE = 25;

const STATE_LABEL: Record<RewardState, string> = {
  paying: "Paying",
  disabled: "Switched off",
  held: "On hold",
};

const SCOPE_PLURAL: Record<RewardScope, string> = {
  quiz: "Quizzes",
  exercise: "Exercises",
  competition: "Competitions",
};

const STATE_TONE: Record<RewardState, "success" | "neutral" | "danger"> = {
  paying: "success",
  disabled: "neutral",
  held: "danger",
};

/**
 * Token reward rules across every creator: what each pays, how much it has
 * paid, and to how many people. Staff with rewards:rules:manage can change a
 * rule or put it on hold, which stops payouts until staff lift it.
 */
export default function RewardRulesPage() {
  const canView = useStaffPermission("rewards:rules:view");

  return (
    <PageLayout
      title="Reward Rules"
      subtitle="What creators' quizzes, exercises and competitions pay in tokens, and what they have paid."
    >
      {canView ? (
        <Rules />
      ) : (
        <Notice
          title="You can't see reward rules"
          body="This needs the rewards:rules:view permission."
        />
      )}
    </PageLayout>
  );
}

const Rules = () => {
  const canManage = useStaffPermission("rewards:rules:manage");
  const canSeeUsers = useStaffPermission("users:accounts:view");
  const [scope, setScope] = useState<RewardScope | "">("");
  const [state, setState] = useState<RewardState | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<StaffRewardRule | null>(null);
  const { data, isLoading } = useStaffRewardRules({ scope, state, page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const ownerIds = [...new Set(items.map((r) => r.ownerId))];
  const { data: owners } = usePlatformUsers({
    ids: ownerIds,
    pageSize: 100,
    enabled: canSeeUsers && ownerIds.length > 0,
  });
  const ownerName = new Map(owners?.items.map((u) => [u.userId, u.displayName]));
  const ruleLabel = new Map(
    items.map((r) => [r.id, `${REWARD_SCOPE_LABEL[r.scope]} ${short(r.targetId)}`]),
  );

  return (
    <div className="space-y-6">
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Rules paying"
            value={data.totals.payingRules.toLocaleString()}
            hint={`${data.totals.rules} rules · ${data.totals.heldRules} on hold`}
          />
          <StatCard
            label="Tokens rewarded"
            value={data.totals.tokensRewarded.toLocaleString()}
            hint={`to ${data.totals.peopleRewarded.toLocaleString()} people`}
            sparkline={data.totals.byMonth.map((m) => m.rewarded)}
          />
          <StatCard
            label="Tokens spent on courses"
            value={data.totals.tokensRedeemed.toLocaleString()}
            sparkline={data.totals.byMonth.map((m) => m.redeemed)}
          />
          <StatCard
            label="Rewarded this month"
            value={(data.totals.byMonth.at(-1)?.rewarded ?? 0).toLocaleString()}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Select
          value={scope || "all"}
          onValueChange={(v) => {
            setScope(v === "all" ? "" : (v as RewardScope));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Pays for" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everything</SelectItem>
            {(Object.keys(REWARD_SCOPE_LABEL) as RewardScope[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SCOPE_PLURAL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={state || "all"}
          onValueChange={(v) => {
            setState(v === "all" ? "" : (v as RewardState));
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="State" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any state</SelectItem>
            {(Object.keys(STATE_LABEL) as RewardState[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={8} columns={7} />
      ) : items.length === 0 ? (
        <Notice
          icon={<Coins className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No reward rules"
          body={
            scope || state
              ? "Nothing matches these filters."
              : "Creators set rewards on their quizzes in Studio; none have yet."
          }
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-40">Pays for</TableHead>
                <TableHead className="min-w-40">Creator</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Paid out</TableHead>
                <TableHead>Last paid</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Changed</TableHead>
                {canManage && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => {
                const st = ruleState(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="text-ink block text-sm">{REWARD_SCOPE_LABEL[r.scope]}</span>
                      <span className="text-muted-foreground block font-mono text-xs">
                        {short(r.targetId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {canSeeUsers ? (
                        <Link href={`/users/${r.ownerId}`} className="hover:underline">
                          {ownerName.get(r.ownerId) ?? short(r.ownerId)}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">{short(r.ownerId)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className="mono-data">{r.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        tokens · {r.maxAwardsPerUser}× per person
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className="mono-data">{r.tokensPaid.toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        to {r.people.toLocaleString()} {r.people === 1 ? "person" : "people"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {r.lastPaidAt ? formatDate(r.lastPaidAt) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Badge>
                      {r.held && r.heldReason && (
                        <p className="text-muted-foreground mt-1 max-w-48 text-xs">
                          {r.heldReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(r.updatedAt)}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                          Change
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
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
          noun="rules"
        />
      )}

      {data && data.history.length > 0 && (
        <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <h2 className="text-ink px-4 pt-4 text-sm font-medium">Staff changes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="min-w-64">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(h.at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {ruleLabel.get(h.ruleId) ?? short(h.ruleId)}
                  </TableCell>
                  <TableCell className="text-sm">{h.summary}</TableCell>
                  <TableCell className="text-sm">{h.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {editing && <EditRule rule={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const short = (id: string) => id.slice(0, 8);

const EditRule = ({ rule, onClose }: { rule: StaffRewardRule; onClose: () => void }) => {
  const update = useUpdateRewardRule();
  const [amount, setAmount] = useState(String(rule.amount));
  const [max, setMax] = useState(String(rule.maxAwardsPerUser));
  const [enabled, setEnabled] = useState(rule.enabled);
  const [held, setHeld] = useState(rule.held);
  const [reason, setReason] = useState("");
  const amountN = Number.parseInt(amount, 10);
  const maxN = Number.parseInt(max, 10);
  const valid = amountN > 0 && maxN >= 1 && maxN <= 100 && reason.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {REWARD_SCOPE_LABEL[rule.scope]} {short(rule.targetId)}
          </DialogTitle>
          <DialogDescription>
            Changes apply to passes from now on. Nothing already paid is taken back.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tokens per pass" htmlFor="rule-amount">
            <Input
              id="rule-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Payouts per person" htmlFor="rule-max" hint="1 to 100.">
            <Input
              id="rule-max"
              inputMode="numeric"
              value={max}
              onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              Switched on
              <span className="text-muted-foreground block text-xs">
                The creator can change this too.
              </span>
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Switched on" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              On hold
              <span className="text-muted-foreground block text-xs">
                Stops payouts. Only staff can lift it.
              </span>
            </span>
            <Switch checked={held} onCheckedChange={setHeld} aria-label="On hold" />
          </label>
          <Field label="Reason" htmlFor="rule-reason" span="full" hint="Kept in the staff changes.">
            <Input id="rule-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || update.isPending}
            onClick={() =>
              update.mutate(
                {
                  ruleId: rule.id,
                  amount: amountN,
                  maxAwardsPerUser: maxN,
                  enabled,
                  held,
                  reason: reason.trim(),
                },
                { onSuccess: onClose },
              )
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
