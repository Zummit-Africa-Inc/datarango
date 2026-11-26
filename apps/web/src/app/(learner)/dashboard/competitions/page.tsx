"use client";

import { Trophy } from "lucide-react";
import { Suspense } from "react";

import {
  EmptyState,
  listParam,
  ListToolbar,
  PageLayout,
  Pagination,
  Skeleton,
  useListParams,
} from "@datarango/ui";

import {
  CompetitionCard,
  CompetitionRow,
  useNow,
} from "@/components/competitions/competition-meta";
import {
  useDiscoverCompetitions,
  type CompetitionEligibility,
  type CompetitionPhase,
  type CompetitionSort,
} from "@/hooks/arena";

const PAGE_SIZES = [12, 24, 48];

const PHASES = ["upcoming", "live", "ended"] as const;
const ELIGIBILITY = ["open", "org"] as const;
const SORTS = ["endingSoon", "newest", "prize"] as const;

const PHASE_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];
const ELIGIBILITY_OPTIONS = [
  { value: "open", label: "Open to everyone" },
  { value: "org", label: "My organisation" },
];
const SORT_OPTIONS = [
  { value: "endingSoon", label: "Ending soon" },
  { value: "newest", label: "Newest" },
  { value: "prize", label: "Prize" },
];

export default function CompetitionsPage() {
  return (
    <Suspense fallback={<Skeleton skeleton="list" rows={6} />}>
      <CompetitionsList />
    </Suspense>
  );
}

const CompetitionsList = () => {
  const { params, set, reset } = useListParams({
    q: listParam.string(),
    // The API takes one value per filter, so these are single-select.
    status: listParam.manyOf(PHASES),
    eligibility: listParam.manyOf(ELIGIBILITY),
    sort: listParam.oneOf(SORTS, "endingSoon"),
    view: listParam.oneOf(["grid", "list"] as const, "grid"),
    size: listParam.number(12),
    page: listParam.number(1),
  });
  const pageSize = PAGE_SIZES.includes(params.size) ? params.size : 12;
  const status = params.status.at(-1) as CompetitionPhase | undefined;
  const eligibility = params.eligibility.at(-1) as CompetitionEligibility | undefined;
  const now = useNow();

  const { data, isLoading } = useDiscoverCompetitions({
    search: params.q,
    status,
    eligibility,
    sort: params.sort as CompetitionSort,
    page: params.page,
    pageSize,
  });

  const competitions = data?.competitions ?? [];
  const total = data?.total ?? 0;
  const filtered = Boolean(params.q || status || eligibility);

  return (
    <PageLayout
      title="Competitions"
      subtitle="Score your models against real datasets and the rest of the field."
      count={data ? total : undefined}
    >
      <ListToolbar
        filters={[
          {
            key: "status",
            label: "Status",
            options: PHASE_OPTIONS,
            value: status ? [status] : [],
            onChange: (value) => set({ status: value.slice(-1) as CompetitionPhase[] }),
          },
          {
            key: "eligibility",
            label: "Eligibility",
            options: ELIGIBILITY_OPTIONS,
            value: eligibility ? [eligibility] : [],
            onChange: (value) => set({ eligibility: value.slice(-1) as CompetitionEligibility[] }),
          },
        ]}
        onClearAll={reset}
        search={{
          value: params.q,
          onChange: (q) => set({ q }),
          placeholder: "Search competitions…",
        }}
        sort={{
          value: params.sort,
          options: SORT_OPTIONS,
          onChange: (sort) => set({ sort: sort as CompetitionSort }),
        }}
        view={{ value: params.view, onChange: (view) => set({ view }) }}
      />

      {isLoading ? (
        <Skeleton skeleton="list" rows={6} />
      ) : competitions.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={filtered ? "No competitions match these filters" : "No competitions yet"}
          hint={
            filtered
              ? "Try another status or clear the filters."
              : "When a competition opens, it shows up here."
          }
        />
      ) : params.view === "list" ? (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          {competitions.map((competition) => (
            <CompetitionRow competition={competition} key={competition.id} now={now} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {competitions.map((competition) => (
            <CompetitionCard competition={competition} key={competition.id} now={now} />
          ))}
        </div>
      )}

      <Pagination
        noun="competition"
        onPageChange={(next) => set({ page: next })}
        onPageSizeChange={(size) => set({ size })}
        page={params.page}
        pageSize={pageSize}
        pageSizes={PAGE_SIZES}
        total={total}
      />
    </PageLayout>
  );
};
