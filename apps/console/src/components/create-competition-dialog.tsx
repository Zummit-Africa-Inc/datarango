"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@datarango/ui";

import {
  HIGHER_IS_BETTER,
  METRIC_LABEL,
  useCreateOrgCompetition,
  useDatasetVersions,
  useMyDatasets,
  type Metric,
} from "@/hooks/arena";

const METRICS: Metric[] = ["accuracy", "f1", "rocAuc", "mae", "rmse", "logLoss"];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/**
 * Creates an org-private competition.
 *
 * The two things this form exists to get right:
 *
 * 1. **It pins a VERSION, not a dataset.** The server requires a published
 *    version id and refuses anything else (`competition.dataset_version_unavailable`),
 *    because a dataset's "current" pointer is something its owner can advance
 *    mid-run — pinning it would reshape the problem under everyone already
 *    training on it. So the version picker is a required second step, not a
 *    convenience.
 * 2. **It never sends an org id.** Org-private comes from the `X-Org-Id` header
 *    the API client stamps, which the gateway only sets after proving
 *    membership. A body field would let a caller name an org they do not belong
 *    to.
 */
export const CreateCompetitionDialog = () => {
  const create = useCreateOrgCompetition();
  const { data: datasetList } = useMyDatasets();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [metric, setMetric] = useState<Metric>("accuracy");
  const [endsAt, setEndsAt] = useState("");
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [rewardTotal, setRewardTotal] = useState(0);
  const [placements, setPlacements] = useState(3);

  const { data: versionListing } = useDatasetVersions(datasetId);

  // Only published datasets can back a competition, so drafts are not offered
  // rather than offered and refused.
  const datasets = useMemo(
    () => (datasetList?.datasets ?? []).filter((d) => d.status === "published"),
    [datasetList],
  );
  const versions = useMemo(
    () => (versionListing?.versions ?? []).filter((v) => v.status === "published"),
    [versionListing],
  );

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const rewardValid = rewardTotal === 0 || placements >= 1;
  const endsInFuture = !!endsAt && new Date(endsAt) > new Date();

  const valid =
    title.trim().length > 0 &&
    effectiveSlug.length > 0 &&
    !!datasetId &&
    !!versionId &&
    rewardValid;

  const reset = () => {
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setSummary("");
    setDatasetId("");
    setVersionId("");
    setMetric("accuracy");
    setEndsAt("");
    setMaxPerDay(5);
    setRewardTotal(0);
    setPlacements(3);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    create.mutate(
      {
        slug: effectiveSlug,
        title: title.trim(),
        summary: summary.trim(),
        datasetId,
        datasetVersionId: versionId,
        metric,
        startsAt: null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        maxSubmissionsPerDay: maxPerDay,
        tokenRewardTotal: rewardTotal,
        tokenRewardPlacements: rewardTotal > 0 ? placements : 0,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New competition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New competition</DialogTitle>
            <DialogDescription>
              Private to this organisation. It starts as a draft — nobody sees it until you open it.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto overscroll-contain py-4">
            <div>
              <Label htmlFor="competition-title">Title</Label>
              <Input
                id="competition-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q3 Churn Modelling Challenge"
                className="mt-2"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="competition-slug">Slug</Label>
              <p className="text-muted-foreground mt-1 text-xs">
                Globally unique across the whole platform, not just this org — competitions are
                shared by URL, so a collision fails loudly at creation rather than quietly forking a
                leaderboard.
              </p>
              <Input
                id="competition-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="q3-churn-modelling"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="competition-summary">Summary</Label>
              <Textarea
                id="competition-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What competitors are predicting, and how it's judged."
                className="mt-2 min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="competition-dataset">Dataset</Label>
                <select
                  id="competition-dataset"
                  className="border-hairline bg-card mt-2 h-9 w-full rounded-xs border px-2 text-sm"
                  value={datasetId}
                  onChange={(e) => {
                    setDatasetId(e.target.value);
                    // The old version belongs to the old dataset; keeping it
                    // would send a mismatched pair the server would refuse.
                    setVersionId("");
                  }}
                >
                  <option value="">Choose a published dataset…</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.title}
                    </option>
                  ))}
                </select>
                {datasets.length === 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    You have no published datasets. Publish one first — a competition can only pin
                    published data.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="competition-version">Version</Label>
                <select
                  id="competition-version"
                  className="border-hairline bg-card mt-2 h-9 w-full rounded-xs border px-2 text-sm disabled:opacity-60"
                  value={versionId}
                  disabled={!datasetId}
                  onChange={(e) => setVersionId(e.target.value)}
                >
                  <option value="">
                    {datasetId ? "Choose a version…" : "Pick a dataset first"}
                  </option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.number}
                      {version.notes ? ` — ${version.notes}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground mt-1 text-xs">
                  Pinned for the whole run — the dataset owner can publish newer versions without
                  moving this competition.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="competition-metric">Metric</Label>
                <select
                  id="competition-metric"
                  className="border-hairline bg-card mt-2 h-9 w-full rounded-xs border px-2 text-sm"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as Metric)}
                >
                  {METRICS.map((m) => (
                    <option key={m} value={m}>
                      {METRIC_LABEL[m]} —{" "}
                      {HIGHER_IS_BETTER[m] ? "higher is better" : "lower is better"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="competition-ends">Ends</Label>
                <Input
                  id="competition-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-2"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {endsAt && !endsInFuture
                    ? "Must be in the future before the competition can open."
                    : "Required before opening. You can set it later while it's a draft."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="competition-limit">Submissions per day</Label>
                <Input
                  id="competition-limit"
                  type="number"
                  min={1}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="competition-reward">Token reward</Label>
                <Input
                  id="competition-reward"
                  type="number"
                  min={0}
                  value={rewardTotal}
                  onChange={(e) => setRewardTotal(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="competition-places">Paying places</Label>
                <Input
                  id="competition-places"
                  type="number"
                  min={1}
                  value={placements}
                  disabled={rewardTotal === 0}
                  onChange={(e) => setPlacements(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-2"
                />
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              Rewards are recorded as intent. Nothing pays out yet — the rule that settles a
              leaderboard at close arrives with the token economy, and storing the totals now means
              it attaches to real competitions rather than needing some invented for it.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || create.isPending}>
              {create.isPending ? "Creating…" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
