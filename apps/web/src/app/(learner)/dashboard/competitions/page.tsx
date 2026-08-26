"use client";

import { useState } from "react";
import { CalendarClock, Search, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { Badge, Button, Input, PageLayout, Skeleton } from "@datarango/ui";

import { METRIC_LABELS, useDiscoverCompetitions, type CompetitionStatus } from "@/hooks/arena";

const PAGE_SIZE = 12;

const statusBadge = (status: CompetitionStatus) =>
  status === "open" ? (
    <Badge variant="success">Open</Badge>
  ) : status === "closed" ? (
    <Badge variant="outline">Closed</Badge>
  ) : null;

export default function CompetitionsPage() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDiscoverCompetitions({
    search: submitted,
    page,
    pageSize: PAGE_SIZE,
  });

  const competitions = data?.competitions ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(search.trim());
    setPage(1);
  };

  return (
    <PageLayout title="Competitions" subtitle="Test your skills against the field.">
      <form onSubmit={runSearch} className="flex max-w-md items-center gap-2">
        <Input
          aria-label="Search competitions"
          placeholder="Search competitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      {isLoading ? (
        <Skeleton skeleton="list" rows={6} />
      ) : competitions.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <p className="font-heading text-ink text-lg">
            {submitted ? "Nothing matches that search" : "No competitions yet"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {submitted ? "Try a different term." : "When a competition opens, it shows up here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <div
              className="border-hairline bg-card hover:border-primary-500/40 flex flex-col rounded-xs border transition-colors"
              key={competition.id}
            >
              <div className="bg-primary-500 flex h-20 w-full items-start justify-between p-3">
                <Trophy className="size-5 text-white/80" />
                {statusBadge(competition.status)}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h2 className="font-heading text-ink truncate text-xl leading-snug">
                  {competition.title}
                </h2>
                <p className="text-muted-foreground line-clamp-2 flex-1 text-sm leading-relaxed">
                  {competition.summary || "No summary yet."}
                </p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span>{METRIC_LABELS[competition.metric]}</span>
                  {competition.endsAt && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      ends {new Date(competition.endsAt).toLocaleDateString()}
                    </span>
                  )}
                  {competition.tokenRewardTotal > 0 && (
                    <Badge variant="warning">
                      {competition.tokenRewardTotal} tokens · top{" "}
                      {competition.tokenRewardPlacements}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Users className="size-3.5" />
                    {competition.orgId ? "Org members only" : "Open to everyone"}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/competitions/${competition.id}`}>View →</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {lastPage} · {total} competition{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
