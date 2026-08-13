"use client";

import { AlertTriangle, Check, CheckCircle2, Copy, Globe, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useActiveOrg, usePermission } from "@datarango/auth";
import { Badge, Button, Input, Label, PageLayout, Skeleton, Switch } from "@datarango/ui";

import { useOrgRoles } from "@/hooks/orgs";
import {
  useAddOrgDomain,
  useDeleteOrgSso,
  useOrgDomains,
  useOrgSso,
  useRemoveOrgDomain,
  useSetOrgSsoEnabled,
  useUpsertOrgSso,
  useVerifyOrgDomain,
  type OrgDomain,
} from "@/hooks/sso";

export default function SettingsPage() {
  const { activeOrgId } = useActiveOrg();

  // Checked before rendering rather than letting the calls 403: every one of
  // these operations is gated on the same permission server-side, so a manager
  // without it would otherwise get a screen of error toasts.
  const canManage = usePermission("org.settings.manage");
  const orgId = canManage ? activeOrgId : null;

  const { data: domains, isLoading: domainsLoading } = useOrgDomains(orgId);
  const { data: sso, isLoading: ssoLoading } = useOrgSso(orgId);
  const { data: roles } = useOrgRoles(orgId);

  if (!activeOrgId) {
    return (
      <PageLayout title="Settings" subtitle="Pick an organization to manage its settings.">
        <p className="text-muted-foreground text-sm">
          You&apos;re in your personal context. Switch to an organization to configure it.
        </p>
      </PageLayout>
    );
  }

  if (!canManage) {
    return (
      <PageLayout title="Settings" subtitle="Organization settings">
        <div className="border-hairline bg-card rounded-xs border px-6 py-12 text-center">
          <ShieldCheck className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="text-ink font-heading mt-3 text-lg">You don&apos;t manage this org</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-prose text-sm">
            Domain and single sign-on settings need the{" "}
            <span className="mono-data text-ink">org.settings.manage</span> permission. An owner can
            grant it from Roles.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Settings"
      subtitle="Domains and single sign-on for this organization."
      actions={[
        sso ? (
          <Badge key="sso" variant={sso.enabled ? "success" : "outline"}>
            {sso.enabled ? "SSO on" : "SSO off"}
          </Badge>
        ) : null,
      ].filter(Boolean)}
    >
      {domainsLoading || ssoLoading ? (
        <Skeleton skeleton="page" />
      ) : (
        <div className="space-y-6">
          <DomainsSection orgId={activeOrgId} domains={domains ?? []} />
          <SsoSection
            orgId={activeOrgId}
            hasVerifiedDomain={(domains ?? []).some((d) => d.verified)}
            roles={(roles ?? []).map((r) => r.name)}
          />
        </div>
      )}
    </PageLayout>
  );
}

/* --------------------------------- domains -------------------------------- */

const DomainsSection = ({ orgId, domains }: { orgId: string; domains: OrgDomain[] }) => {
  const [value, setValue] = useState("");
  const add = useAddOrgDomain(orgId);

  const submit = () => {
    const domain = value.trim().toLowerCase();
    if (!domain) return;
    add.mutate({ domain }, { onSuccess: () => setValue("") });
  };

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-ink text-lg">Domains</h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            Claim the domains your people&apos;s email addresses use, then prove you control each
            one with a DNS record. Single sign-on matches a sign-in to this organization through
            these — an unverified domain routes nobody.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1">
          <Label htmlFor="domain">Add a domain</Label>
          <Input
            id="domain"
            placeholder="acme.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <Button disabled={!value.trim() || add.isPending} onClick={submit}>
          {add.isPending ? "Claiming…" : "Claim"}
        </Button>
      </div>

      {domains.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">No domains claimed yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {domains.map((domain) => (
            <DomainRow key={domain.id} orgId={orgId} domain={domain} />
          ))}
        </ul>
      )}
    </section>
  );
};

const DomainRow = ({ orgId, domain }: { orgId: string; domain: OrgDomain }) => {
  const verify = useVerifyOrgDomain(orgId);
  const remove = useRemoveOrgDomain(orgId);

  // Inline rather than a toast: the confirmation belongs next to the value you
  // just copied, and a DNS record is something you paste immediately.
  const [copied, setCopied] = useState<"host" | "value" | null>(null);

  const copy = async (text: string, which: "host" | "value") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // value stays selectable on screen, so this is not worth an error toast.
    }
  };

  return (
    <li className="border-hairline rounded-xs border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Globe className="text-muted-foreground size-4 shrink-0" />
        <span className="mono-data text-ink min-w-0 flex-1 truncate text-sm">{domain.domain}</span>
        {domain.verified ? (
          <Badge variant="success">
            <CheckCircle2 className="size-3" />
            Verified
          </Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
        {!domain.verified && (
          <Button
            size="sm"
            variant="outline"
            disabled={verify.isPending}
            onClick={() => verify.mutate({ domainId: domain.id })}
          >
            {verify.isPending ? "Checking…" : "Check DNS"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={remove.isPending}
          onClick={() => remove.mutate({ domainId: domain.id })}
          aria-label={`Remove ${domain.domain}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Shown after verification too, not just before: when SSO stops working
          this is the first thing to check, and hiding it would mean an admin
          has to guess what record we look for. */}
      <div className="bg-muted/40 mt-3 space-y-2 rounded-xs p-3 text-xs">
        <p className="text-muted-foreground">
          Publish this TXT record, then press Check DNS. It can take a few minutes to propagate.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0">Host</span>
          <span className="mono-data text-ink min-w-0 flex-1 truncate">{domain.txtHost}</span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Copy host"
            onClick={() => copy(domain.txtHost, "host")}
          >
            {copied === "host" ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0">Value</span>
          <span className="mono-data text-ink min-w-0 flex-1 truncate">{domain.txtRecord}</span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Copy value"
            onClick={() => copy(domain.txtRecord, "value")}
          >
            {copied === "value" ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {verify.error && (
        <p className="text-error mt-2 text-xs">
          {verify.error.message} — the record isn&apos;t visible to us yet.
        </p>
      )}
    </li>
  );
};

/* ----------------------------------- sso ---------------------------------- */

const SsoSection = ({
  orgId,
  hasVerifiedDomain,
  roles,
}: {
  orgId: string;
  hasVerifiedDomain: boolean;
  roles: string[];
}) => {
  const { data: sso } = useOrgSso(orgId);
  const upsert = useUpsertOrgSso(orgId);
  const setEnabled = useSetOrgSsoEnabled(orgId);
  const remove = useDeleteOrgSso(orgId);

  const [authority, setAuthority] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [defaultRole, setDefaultRole] = useState("member");

  // Seed the form from the server once it arrives, and re-seed if it changes
  // underneath (another admin saving). The secret is never seeded — no route
  // returns one — which is exactly why blank has to mean "keep".
  useEffect(() => {
    if (!sso) return;
    setAuthority(sso.authority);
    setClientId(sso.clientId);
    setDefaultRole(sso.defaultRole);
  }, [sso]);

  const roleOptions = useMemo(
    () => (roles.length > 0 ? roles : ["member", "admin", "owner"]),
    [roles],
  );

  const isCreate = !sso;
  const secretRequired = isCreate || !sso?.hasSecret;
  const canSave =
    authority.trim().length > 0 &&
    clientId.trim().length > 0 &&
    (!secretRequired || clientSecret.trim().length > 0);

  const save = () => {
    upsert.mutate(
      {
        authority: authority.trim(),
        clientId: clientId.trim(),
        // Blank is omitted rather than sent: the server reads absent/empty as
        // "keep the stored secret", and sending "" on an update would be the
        // same thing said less clearly.
        clientSecret: clientSecret.trim() || undefined,
        defaultRole,
      },
      { onSuccess: () => setClientSecret("") },
    );
  };

  return (
    <section className="border-hairline bg-card rounded-xs border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-ink text-lg">Single sign-on</h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            Federate sign-in to your own identity provider over OpenID Connect. People whose email
            matches a verified domain above are sent to your IdP instead of entering a password
            here, and are provisioned into this organization on first sign-in.
          </p>
        </div>
        {sso && (
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor="sso-enabled" className="text-sm">
              {sso.enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="sso-enabled"
              checked={sso.enabled}
              disabled={setEnabled.isPending}
              onCheckedChange={(enabled) => setEnabled.mutate({ enabled })}
            />
          </div>
        )}
      </div>

      {!hasVerifiedDomain && (
        <div className="border-hairline bg-muted/40 mt-4 flex gap-3 rounded-xs border p-3">
          <AlertTriangle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-sm">
            No verified domain yet. You can save a connection now, but nobody will be routed to it
            until at least one domain above is verified — matching an email to this organization is
            what the verification proves.
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="authority">Issuer URL</Label>
          <Input
            id="authority"
            placeholder="https://login.microsoftonline.com/<tenant>/v2.0"
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            We read your IdP&apos;s discovery document and signing keys from here.
          </p>
        </div>
        <div>
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="The application you registered for Datarango"
          />
        </div>
        <div>
          <Label htmlFor="clientSecret">Client secret</Label>
          <Input
            id="clientSecret"
            type="password"
            autoComplete="off"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={secretRequired ? "Required" : "Leave blank to keep the stored secret"}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {secretRequired
              ? "Stored encrypted and never shown again."
              : "A secret is stored. Leave this blank unless you're rotating it."}
          </p>
        </div>
        <div>
          <Label htmlFor="defaultRole">Role for new members</Label>
          <select
            id="defaultRole"
            className="border-hairline bg-card focus-visible:ring-ring h-9 w-full rounded-xs border px-3 text-sm focus-visible:ring-1 focus-visible:outline-none"
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground mt-1 text-xs">
            Applied when somebody signs in through your IdP for the first time.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button disabled={!canSave || upsert.isPending} onClick={save}>
          {upsert.isPending ? "Saving…" : isCreate ? "Save connection" : "Save changes"}
        </Button>
        {sso && (
          <Button
            variant="ghost"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
            className="text-error"
          >
            <Trash2 className="size-3.5" />
            Remove connection
          </Button>
        )}
      </div>
    </section>
  );
};
