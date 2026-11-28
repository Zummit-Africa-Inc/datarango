"use client";

import { Flag, X } from "lucide-react";
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
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@datarango/ui";

import { Field } from "@/components/form";
import { Notice, SearchBox, formatDate, useDebounced } from "@/components/people-ui";
import {
  flagReach,
  useCreateFlag,
  useFeatureFlags,
  useUpdateFlag,
  type FeatureFlag,
} from "@/hooks/flags";
import { usePlatformOrgs } from "@/hooks/operations";

const KEY = /^[a-z0-9][a-z0-9._-]{1,79}$/;

/**
 * Feature flags: switch features on without a deploy, for a percentage of
 * people or for chosen organisations. Apps read the flags on for their user
 * from GET /flags.
 */
export default function FeatureFlagsPage() {
  const canView = useStaffPermission("flags:features:view");

  return (
    <PageLayout
      title="Feature Flags"
      subtitle="Turn features on gradually, or for chosen organisations, without a release."
    >
      {canView ? (
        <Flags />
      ) : (
        <Notice title="You can't see feature flags" body="This needs flags:features:view." />
      )}
    </PageLayout>
  );
}

const Flags = () => {
  const canManage = useStaffPermission("flags:features:manage");
  const { data, isLoading } = useFeatureFlags();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const flags = data?.flags ?? [];

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreating(true)}>
            New flag
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton skeleton="table" rows={5} columns={5} />
      ) : flags.length === 0 ? (
        <Notice
          icon={<Flag className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />}
          title="No flags yet"
          body="A flag lets a feature ship switched off, then reach people a step at a time."
        />
      ) : (
        <div className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Flag</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Rollout</TableHead>
                <TableHead className="min-w-40">Organisations</TableHead>
                <TableHead>Changed</TableHead>
                {canManage && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <span className="text-ink block font-medium">{f.name}</span>
                    <span className="text-muted-foreground block font-mono text-xs">{f.key}</span>
                    {f.description && (
                      <span className="text-muted-foreground line-clamp-2 block text-xs">
                        {f.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={f.enabled ? "success" : "neutral"}>
                      {f.enabled ? "On" : "Off"}
                    </Badge>
                    <span className="text-muted-foreground mt-1 block text-xs">{flagReach(f)}</span>
                  </TableCell>
                  <TableCell className="min-w-32">
                    <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${f.enabled ? f.rolloutPercent : 0}%` }}
                      />
                    </div>
                    <span className="mono-data text-xs">{f.rolloutPercent}%</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {f.orgs.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      <span className="line-clamp-2">
                        {f.orgs.map((o) => o.name ?? o.id.slice(0, 8)).join(", ")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(f.updatedAt)}
                    {f.updatedBy && <span className="block">by {f.updatedBy}</span>}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setEditing(f)}>
                        Change
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.history.length > 0 && (
        <section className="border-hairline bg-card overflow-x-auto rounded-xs border">
          <h2 className="text-ink px-4 pt-4 text-sm font-medium">Changes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="min-w-64">Reason</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(h.at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.flagKey}</TableCell>
                  <TableCell className="text-sm">{h.summary}</TableCell>
                  <TableCell className="text-sm">{h.reason}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{h.actor ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {creating && <CreateFlag onClose={() => setCreating(false)} />}
      {editing && <EditFlag key={editing.id} flag={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const CreateFlag = ({ onClose }: { onClose: () => void }) => {
  const create = useCreateFlag();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const valid = KEY.test(key) && name.trim().length > 0 && reason.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New feature flag</DialogTitle>
          <DialogDescription>It starts off. Turn it on from the list.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="flag-name">
            <Input id="flag-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field
            label="Key"
            htmlFor="flag-key"
            hint="What the code checks, e.g. notebooks.gpu. Can't change later."
          >
            <Input
              id="flag-key"
              className="font-mono"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
            />
          </Field>
          <Field label="Description" htmlFor="flag-description" span="full">
            <Textarea
              id="flag-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Reason" htmlFor="flag-reason" span="full">
            <Input id="flag-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid || create.isPending}
            onClick={() =>
              create.mutate(
                {
                  key,
                  name: name.trim(),
                  description: description.trim() || null,
                  reason: reason.trim(),
                },
                { onSuccess: onClose },
              )
            }
          >
            Create flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditFlag = ({ flag, onClose }: { flag: FeatureFlag; onClose: () => void }) => {
  const update = useUpdateFlag();
  const [name, setName] = useState(flag.name);
  const [description, setDescription] = useState(flag.description ?? "");
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rollout, setRollout] = useState(flag.rolloutPercent);
  const [orgs, setOrgs] = useState(flag.orgs);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const query = useDebounced(search.trim());
  const { data: found } = usePlatformOrgs({ query, pageSize: 8, enabled: query.length >= 2 });
  const chosen = new Set(orgs.map((o) => o.id));
  const valid = name.trim().length > 0 && reason.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{flag.name}</DialogTitle>
          <DialogDescription className="font-mono">{flag.key}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="edit-flag-name">
            <Input id="edit-flag-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <label className="flex items-center justify-between gap-3 self-end text-sm">
            <span>
              On
              <span className="text-muted-foreground block text-xs">
                Off means off for everyone, targeted organisations included.
              </span>
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Flag on" />
          </label>
          <Field label="Description" htmlFor="edit-flag-description" span="full">
            <Textarea
              id="edit-flag-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field
            label={`Rollout: ${rollout}% of signed-in people`}
            htmlFor="edit-flag-rollout"
            span="full"
            hint="The same people stay in as the percentage grows. 100% also covers signed-out visitors."
          >
            <input
              id="edit-flag-rollout"
              type="range"
              min={0}
              max={100}
              step={5}
              value={rollout}
              onChange={(e) => setRollout(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </Field>
          <Field
            label="Always on for these organisations"
            htmlFor="edit-flag-orgs"
            span="full"
            hint="Every active member gets the flag while it's on, whatever the rollout."
          >
            <div className="space-y-2">
              {orgs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {orgs.map((o) => (
                    <Badge key={o.id} tone="neutral" className="gap-1">
                      {o.name ?? o.id.slice(0, 8)}
                      <button
                        type="button"
                        aria-label={`Remove ${o.name ?? "organisation"}`}
                        onClick={() => setOrgs((list) => list.filter((x) => x.id !== o.id))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <SearchBox
                label="Find an organisation"
                placeholder="Search organisations"
                value={search}
                onChange={setSearch}
              />
              {query.length >= 2 && (
                <div className="border-hairline divide-hairline divide-y rounded-xs border">
                  {(found?.items ?? [])
                    .filter((o) => !chosen.has(o.id))
                    .map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className="hover:bg-muted block w-full px-3 py-2 text-left text-sm"
                        onClick={() => {
                          setOrgs((list) => [...list, { id: o.id, name: o.name }]);
                          setSearch("");
                        }}
                      >
                        {o.name}
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          {o.slug}
                        </span>
                      </button>
                    ))}
                  {found && found.items.filter((o) => !chosen.has(o.id)).length === 0 && (
                    <p className="text-muted-foreground px-3 py-2 text-sm">No matches.</p>
                  )}
                </div>
              )}
            </div>
          </Field>
          <Field
            label="Reason"
            htmlFor="edit-flag-reason"
            span="full"
            hint="Kept in the flag's changes."
          >
            <Input
              id="edit-flag-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
                  key: flag.key,
                  name: name.trim(),
                  description: description.trim() || null,
                  enabled,
                  rolloutPercent: rollout,
                  orgIds: orgs.map((o) => o.id),
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
