"use client";

import { useMemo, useState } from "react";
import { Lock, Trophy } from "lucide-react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, PageLayout, Skeleton } from "@datarango/ui";

import { CreateCompetitionDialog } from "@/components/create-competition-dialog";
import {
  HIGHER_IS_BETTER,
  METRIC_LABEL,
  useCloseCompetition,
  useMyCompetitions,
  useOpenCompetition,
  useOrgDiscoverable,
  type Competition,
} from "@/hooks/arena";

/**
 * Org-private competitions.
 *
 * `/competitions` was in the console nav and 404'd — the same shape `/settings`,
 * `/assignments`, `/progress` and `/grading` each had before they were built.
 *
 * The org half of arena is enforced by one thing: the `X-Org-Id` header this
 * app's API client sends. The gateway proves membership before stamping it,
 * `create_competition` records whatever org it was given, and the RLS discover
 * policy admits non-draft rows that are public **or** match the caller's org.
 * So "private" here is a database policy, not a filter this page applies — and
 * the page says so rather than implying it is doing the hiding.
 */
export default function CompetitionsPage() {
  const { activeOrgId } = useActiveOrg();
  // Gated before rendering rather than by letting the call 403 — the server
  // enforces the same permission on org-scoped creation, so this is the two
  // halves agreeing rather than the UI being the only thing in the way.
  const canManage = usePermission("org.competitions.manage");

  const { data: mine, isLoading } = useMyCompetitions();
  const { data: visible } = useOrgDiscoverable();

  const myCompetitions = useMemo(() => mine?.competitions ?? [], [mine]);

  // Competitions this org can see that the caller does not own — another
  // member's private competition, or a public one. Listed separately because
  // they are not manageable here: arena scopes ownership to a person, so only
  // their creator can open or close them.
  const othersVisible = useMemo(() => {
    const ownIds = new Set(myCompetitions.map((c) => c.id));
    return (visible?.competitions ?? []).filter((c) => !ownIds.has(c.id));
  }, [visible, myCompetitions]);

  const orgPrivate = myCompetitions.filter((c) => c.orgId);
  const publicOnes = myCompetitions.filter((c) => !c.orgId);

  if (!activeOrgId) {
    return (
      <PageLayout title="Competitions" subtitle="Pick an organisation to manage its competitions.">
        <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
          No organisation selected.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Competitions"
      subtitle="Run a private competition for your members, on any published dataset."
      actions={canManage ? [<CreateCompetitionDialog key="create" />] : []}
    >
      <div className="border-hairline bg-muted/40 rounded-xs border px-4 py-3 text-sm">
        <p className="text-ink font-medium">
          {canManage
            ? "Anything you create here is private to this org"
            : "You can see this org's competitions but not run one"}
        </p>
        <p className="text-muted-foreground mt-1">
          {canManage ? (
            <>
              Members discover it; everyone else gets nothing — enforced by a row-level policy in
              the database rather than by a filter on this page. Competitions are owned by the
              person who creates them, so another member&apos;s private competition shows below but
              can only be opened or closed by them.
            </>
          ) : (
            <>
              Running a competition in this organisation&apos;s name needs the{" "}
              <code className="font-code text-xs">org.competitions.manage</code> permission — ask an
              owner or admin. You can still enter any competition listed here.
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <Skeleton skeleton="table" rows={4} columns={4} />
      ) : (
        <>
          <Section
            title="Private to this org"
            empty="You haven't created a private competition yet."
            competitions={orgPrivate}
            manageable
          />
          {publicOnes.length > 0 && (
            <Section
              title="Public competitions you own"
              hint="Created without an org context — visible to everyone on the platform."
              empty=""
              competitions={publicOnes}
              manageable
            />
          )}
          {othersVisible.length > 0 && (
            <Section
              title="Also visible to this org"
              hint="Public competitions, plus private ones created by other members."
              empty=""
              competitions={othersVisible}
              manageable={false}
            />
          )}
        </>
      )}
    </PageLayout>
  );
}

const Section = ({
  title,
  hint,
  empty,
  competitions,
  manageable,
}: {
  title: string;
  hint?: string;
  empty: string;
  competitions: Competition[];
  manageable: boolean;
}) => (
  <section>
    <div className="mb-3">
      <h2 className="font-heading text-ink text-lg">{title}</h2>
      {hint && <p className="text-muted-foreground mt-0.5 text-sm">{hint}</p>}
    </div>
    {competitions.length === 0 ? (
      <p className="text-muted-foreground border-hairline bg-card rounded-xs border px-4 py-8 text-center text-sm">
        {empty}
      </p>
    ) : (
      <ul className="border-hairline bg-card rounded-xs border">
        {competitions.map((competition) => (
          <CompetitionRow key={competition.id} competition={competition} manageable={manageable} />
        ))}
      </ul>
    )}
  </section>
);

const CompetitionRow = ({
  competition,
  manageable,
}: {
  competition: Competition;
  manageable: boolean;
}) => {
  const open = useOpenCompetition(competition.id);
  const close = useCloseCompetition(competition.id);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const endsInFuture = !!competition.endsAt && new Date(competition.endsAt) > new Date();
  // Mirrors the server's own precondition so the reason arrives before the
  // refusal: opening needs an end date in the future.
  const canOpen = competition.status === "draft" && endsInFuture;

  return (
    <li className="border-hairline border-b px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        {competition.orgId ? (
          <Lock
            className="text-muted-foreground size-4 shrink-0"
            aria-label="Private to this org"
          />
        ) : (
          <Trophy className="text-muted-foreground size-4 shrink-0" aria-label="Public" />
        )}
        <span className="text-ink min-w-0 flex-1 truncate font-medium">{competition.title}</span>

        <Badge
          variant={
            competition.status === "open"
              ? "success"
              : competition.status === "closed"
                ? "outline"
                : "ghost"
          }
        >
          {competition.status}
        </Badge>

        <span className="text-muted-foreground shrink-0 text-xs">
          {METRIC_LABEL[competition.metric]}
          {/* Stated with the metric, because a board that sorts one way and a
              label that reads the other is how somebody concludes they are
              winning while losing. */}
          <span className="ml-1 opacity-70">
            {HIGHER_IS_BETTER[competition.metric] ? "higher is better" : "lower is better"}
          </span>
        </span>

        {competition.tokenRewardTotal > 0 && (
          <span className="text-muted-foreground mono-data shrink-0 text-xs">
            {competition.tokenRewardTotal.toLocaleString()} · top{" "}
            {competition.tokenRewardPlacements}
          </span>
        )}

        {manageable && competition.status === "draft" && (
          <Button
            size="sm"
            disabled={!canOpen || open.isPending}
            title={canOpen ? undefined : "Set an end date in the future before opening."}
            onClick={() => open.mutate()}
          >
            {open.isPending ? "Opening…" : "Open"}
          </Button>
        )}

        {manageable &&
          competition.status === "open" &&
          (confirmingClose ? (
            // Inline confirm rather than a browser dialog, and worth confirming:
            // closing is final. There is no reopen — a leaderboard that could be
            // reopened would move the finish line under people who trained for
            // the old one.
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-xs">Close for good?</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingClose(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={close.isPending} onClick={() => close.mutate()}>
                {close.isPending ? "Closing…" : "Close"}
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmingClose(true)}>
              Close
            </Button>
          ))}
      </div>

      {competition.summary && (
        <p className="text-muted-foreground mt-1 line-clamp-2 pl-7 text-sm">
          {competition.summary}
        </p>
      )}

      {competition.status === "draft" && !endsInFuture && manageable && (
        <p className="text-muted-foreground mt-1 pl-7 text-xs">
          Needs an end date in the future before it can open.
        </p>
      )}
    </li>
  );
};
