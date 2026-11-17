"use client";

import { AlertTriangle, CheckCircle2, KeyRound, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, Input, Label, PageLayout, Skeleton, Switch } from "@datarango/ui";

import { formatDate } from "@/hooks/billing";
import {
  AI_PROVIDERS,
  providerLabel,
  useAiCredentials,
  useAiSettings,
  useAiUsage,
  useDeleteAiCredential,
  usePutAiCredential,
  useSetAiMetering,
  useSetPreferredAiProvider,
  type AiCredential,
  type AiFundingSource,
  type AiProvider,
  type AiUsage,
} from "@/hooks/ai";

/**
 * AI settings for the org: how its AI is paid for, its own provider keys, and
 * how much it has used.
 *
 * Who pays is decided per call by the ai service, in this order: the org's
 * own key (BYOK, their bill) → metered platform keys if the org opted in
 * (billed per token on the seat invoice) → a limited platform allowance.
 * This page is where an org moves between those.
 *
 * Three permissions, checked again on the server: `org.settings.manage` for
 * keys and the preferred provider, `org.billing.manage` for the metered
 * opt-in, `org.billing.view` for usage. Sections the viewer can't use are
 * hidden rather than left to 403.
 */
export default function AiSettingsPage() {
  const { activeOrgId } = useActiveOrg();
  const canManageSettings = usePermission("org.settings.manage");
  const canViewBilling = usePermission("org.billing.view");
  const canManageBilling = usePermission("org.billing.manage");

  const inOrg = !!activeOrgId;
  const canSeeSettings = inOrg && (canManageSettings || canViewBilling);

  const { data: settingsData, isLoading: settingsLoading } = useAiSettings(canSeeSettings);
  const { data: credentialData, isLoading: credentialsLoading } = useAiCredentials(
    inOrg && canManageSettings,
  );
  const { data: usageData } = useAiUsage(inOrg && canViewBilling);

  if (!activeOrgId) {
    return (
      <PageLayout title="AI" subtitle="Pick an organization to manage its AI settings.">
        <p className="text-muted-foreground text-sm">
          You&apos;re in your personal context. Switch to an organization to configure it.
        </p>
      </PageLayout>
    );
  }

  if (!canSeeSettings) {
    return (
      <PageLayout title="AI" subtitle="How this organization's AI is funded.">
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <ShieldCheck className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="text-ink font-heading mt-3 text-lg">You can&apos;t see AI settings here</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
            This page needs <span className="mono-data text-ink">org.settings.manage</span> or{" "}
            <span className="mono-data text-ink">org.billing.view</span>. An owner can grant either
            from Roles.
          </p>
        </div>
      </PageLayout>
    );
  }

  const settings = settingsData?.settings;
  const credentials = credentialData?.credentials ?? [];
  const usage = usageData?.usage;

  return (
    <PageLayout
      title="AI"
      subtitle="How this organization's AI is paid for, its provider keys, and its usage."
      actions={[usage ? <FundingBadge key="funding" source={usage.fundingSource} /> : null].filter(
        Boolean,
      )}
    >
      {settingsLoading || (canManageSettings && credentialsLoading) ? (
        <Skeleton skeleton="page" />
      ) : (
        <div className="space-y-6">
          {usage && <UsageSection usage={usage} />}
          {settings && (
            <MeteringSection
              optIn={settings.meteredOptIn}
              hasKey={credentials.length > 0}
              canManage={canManageBilling}
            />
          )}
          {canManageSettings && (
            <>
              <KeysSection credentials={credentials} />
              {settings && (
                <PreferredSection
                  preferred={settings.preferredProvider}
                  credentials={credentials}
                />
              )}
            </>
          )}
        </div>
      )}
    </PageLayout>
  );
}

/* --------------------------------- funding -------------------------------- */

const FUNDING: Record<AiFundingSource, { label: string; detail: string }> = {
  byok: {
    label: "Your own key",
    detail: "Calls use your organization's provider key and are billed by that provider, not us.",
  },
  platform_metered: {
    label: "Metered",
    detail:
      "Calls use Datarango's keys with every AI feature available, billed per token on your next invoice.",
  },
  platform_limited: {
    label: "Included allowance",
    detail:
      "Calls use Datarango's keys within a shared daily and monthly allowance, with a limited set of features.",
  },
  platform_free: {
    label: "Free tier",
    detail: "Calls use Datarango's keys within a small free allowance.",
  },
};

const FundingBadge = ({ source }: { source: AiFundingSource }) => (
  <Badge variant={source === "platform_limited" ? "outline" : "success"}>
    {FUNDING[source]?.label ?? source}
  </Badge>
);

/* ---------------------------------- usage --------------------------------- */

const UsageSection = ({ usage }: { usage: AiUsage }) => {
  const funding = FUNDING[usage.fundingSource];

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <h2 className="font-heading text-ink text-lg">Usage</h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        <span className="text-ink font-medium">{funding?.label ?? usage.fundingSource}.</span>{" "}
        {funding?.detail}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Meter label="Today" used={usage.tokensUsed} limit={usage.dailyLimit} />
        <Meter label="This month" used={usage.tokensUsedThisMonth} limit={usage.monthlyLimit} />
      </div>
    </section>
  );
};

const tokens = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

/**
 * Tokens against a limit. No limit (your own key) shows the count alone —
 * a bar against nothing would suggest a ceiling that doesn't exist.
 */
const Meter = ({ label, used, limit }: { label: string; used: number; limit: number | null }) => {
  const share = limit ? Math.min(1, used / limit) : 0;
  const near = limit !== null && share >= 0.8;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="mono-data text-ink">
          {tokens.format(used)}
          {limit !== null && (
            <span className="text-muted-foreground"> / {tokens.format(limit)} tokens</span>
          )}
          {limit === null && <span className="text-muted-foreground"> tokens · no limit</span>}
        </span>
      </div>
      {limit !== null && (
        <div
          className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
          role="meter"
          aria-label={`${label} usage`}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
        >
          <div
            className={`h-full rounded-full ${near ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${share * 100}%` }}
          />
        </div>
      )}
      {near && (
        <p className="text-muted-foreground mt-1 text-xs">
          {share >= 1
            ? "Limit reached — AI calls are refused until it resets."
            : "Nearing the limit."}
        </p>
      )}
    </div>
  );
};

/* -------------------------------- metering -------------------------------- */

const MeteringSection = ({
  optIn,
  hasKey,
  canManage,
}: {
  optIn: boolean;
  hasKey: boolean;
  canManage: boolean;
}) => {
  const setMetering = useSetAiMetering();

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-ink flex items-center gap-2 text-lg">
            <Sparkles className="size-4" />
            Metered AI
          </h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            Unlock every AI feature on Datarango&apos;s keys and pay for what you use. Usage is
            priced per token for each model and added to your next invoice, alongside your seats.
            Turning it off stops new charges; usage so far is still billed.
          </p>
          {hasKey && (
            <p className="text-muted-foreground mt-2 max-w-prose text-sm">
              Your own key is used first. Metered calls only happen if it stops working or is
              removed.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Label htmlFor="metered" className="text-sm">
            {optIn ? "On" : "Off"}
          </Label>
          <Switch
            id="metered"
            checked={optIn}
            disabled={!canManage || setMetering.isPending}
            onCheckedChange={(next) => setMetering.mutate({ optIn: next })}
          />
        </div>
      </div>
      {!canManage && (
        <p className="text-muted-foreground mt-3 text-xs">
          Changing this needs <span className="mono-data">org.billing.manage</span>.
        </p>
      )}
    </section>
  );
};

/* ---------------------------------- keys ---------------------------------- */

const KeysSection = ({ credentials }: { credentials: AiCredential[] }) => {
  const [editing, setEditing] = useState<AiProvider | null>(null);
  const byProvider = new Map(credentials.map((c) => [c.provider, c]));

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <h2 className="font-heading text-ink flex items-center gap-2 text-lg">
        <KeyRound className="size-4" />
        Your provider keys
      </h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        Bring your own key and your organization&apos;s AI runs on your provider account, at your
        provider&apos;s prices, with no limits from us. Each key is checked with the provider before
        it&apos;s saved, stored encrypted, and never shown again.
      </p>

      <ul className="mt-4 space-y-3">
        {AI_PROVIDERS.map(({ id, label }) => (
          <ProviderRow
            key={id}
            provider={id}
            label={label}
            credential={byProvider.get(id)}
            editing={editing === id}
            onEdit={() => setEditing(id)}
            onDone={() => setEditing(null)}
          />
        ))}
      </ul>
    </section>
  );
};

const ProviderRow = ({
  provider,
  label,
  credential,
  editing,
  onEdit,
  onDone,
}: {
  provider: AiProvider;
  label: string;
  credential: AiCredential | undefined;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) => {
  const remove = useDeleteAiCredential();

  return (
    <li className="border-hairline rounded-xs border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-ink min-w-0 flex-1 text-sm font-medium">{label}</span>
        {credential ? (
          <>
            <span className="mono-data text-muted-foreground text-xs">••••{credential.last4}</span>
            {credential.status === "valid" ? (
              <Badge variant="success">
                <CheckCircle2 className="size-3" />
                Verified{credential.validatedAt ? ` ${formatDate(credential.validatedAt)}` : ""}
              </Badge>
            ) : (
              <Badge variant="outline">
                <AlertTriangle className="size-3" />
                {credential.status}
              </Badge>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-xs">Not set</span>
        )}
        {!editing && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            {credential ? "Replace" : "Add key"}
          </Button>
        )}
        {credential && !editing && (
          <Button
            size="sm"
            variant="ghost"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ provider })}
            aria-label={`Remove ${label} key`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {credential &&
        !editing &&
        (credential.endpoint || Object.keys(credential.models).length > 0) && (
          <p className="text-muted-foreground mt-2 text-xs">
            {credential.endpoint && <span className="mono-data">{credential.endpoint}</span>}
            {credential.endpoint && Object.keys(credential.models).length > 0 && " · "}
            {Object.entries(credential.models)
              .map(([tier, model]) => `${tier}: ${model}`)
              .join(" · ")}
          </p>
        )}

      {editing && <KeyForm provider={provider} credential={credential} onDone={onDone} />}
    </li>
  );
};

const KeyForm = ({
  provider,
  credential,
  onDone,
}: {
  provider: AiProvider;
  credential: AiCredential | undefined;
  onDone: () => void;
}) => {
  const put = usePutAiCredential();
  const azure = provider === "azure_openai";

  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(credential?.endpoint ?? "");
  const [standard, setStandard] = useState(credential?.models.standard ?? "");
  const [light, setLight] = useState(credential?.models.light ?? "");

  const canSave =
    apiKey.trim().length > 0 &&
    (!azure || (endpoint.trim().startsWith("https://") && standard.trim().length > 0));

  const save = () => {
    const models = {
      ...(standard.trim() ? { standard: standard.trim() } : {}),
      ...(light.trim() ? { light: light.trim() } : {}),
    };
    put.mutate(
      {
        provider,
        apiKey: apiKey.trim(),
        endpoint: azure ? endpoint.trim() : undefined,
        models,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="bg-muted/40 mt-3 space-y-3 rounded-xs p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor={`${provider}-key`}>API key</Label>
          <Input
            id={`${provider}-key`}
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={credential ? "Paste the new key" : "Paste your key"}
          />
        </div>
        {azure && (
          <div className="md:col-span-2">
            <Label htmlFor={`${provider}-endpoint`}>Resource endpoint</Label>
            <Input
              id={`${provider}-endpoint`}
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://<resource>.openai.azure.com"
            />
          </div>
        )}
        <div>
          <Label htmlFor={`${provider}-standard`}>
            {azure ? "Standard deployment" : "Standard model (optional)"}
          </Label>
          <Input
            id={`${provider}-standard`}
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            placeholder={azure ? "Required" : "Our default"}
          />
        </div>
        <div>
          <Label htmlFor={`${provider}-light`}>
            {azure ? "Light deployment (optional)" : "Light model (optional)"}
          </Label>
          <Input
            id={`${provider}-light`}
            value={light}
            onChange={(e) => setLight(e.target.value)}
            placeholder="Our default"
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Standard is used for quiz generation, grading help and the org copilot; light for the
        learner helper and analytics.
      </p>

      {put.error && <p className="text-error text-xs">{put.error.message}</p>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!canSave || put.isPending} onClick={save}>
          {put.isPending ? "Checking with the provider…" : "Verify and save"}
        </Button>
        <Button size="sm" variant="ghost" disabled={put.isPending} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------- preferred ------------------------------- */

const PreferredSection = ({
  preferred,
  credentials,
}: {
  preferred: AiProvider | null;
  credentials: AiCredential[];
}) => {
  const set = useSetPreferredAiProvider();
  const usable = credentials.filter((c) => c.status === "valid");

  if (usable.length < 2 && !preferred) {
    // With one key or none there is nothing to choose between.
    return null;
  }

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <h2 className="font-heading text-ink text-lg">Preferred provider</h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        With keys for more than one provider, choose which one calls use. Automatic picks one of
        your verified keys.
      </p>
      <select
        aria-label="Preferred provider"
        className="border-hairline bg-card focus-visible:ring-ring mt-3 h-9 w-full max-w-xs rounded-xs border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
        value={preferred ?? ""}
        disabled={set.isPending}
        onChange={(e) => set.mutate({ provider: (e.target.value || null) as AiProvider | null })}
      >
        <option value="">Automatic</option>
        {usable.map((c) => (
          <option key={c.provider} value={c.provider}>
            {providerLabel(c.provider)}
          </option>
        ))}
        {preferred && !usable.some((c) => c.provider === preferred) && (
          <option value={preferred}>{providerLabel(preferred)} (no verified key)</option>
        )}
      </select>
    </section>
  );
};
