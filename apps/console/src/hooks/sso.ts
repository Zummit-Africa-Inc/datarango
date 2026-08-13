"use client";

import { useApi } from "@datarango/api";

/**
 * Org SSO federation config (mirrors accounts' `SsoConfigInfo`).
 *
 * There is deliberately no `clientSecret` field: the secret is write-only and no
 * route returns one. `hasSecret` is how the form knows whether it may leave the
 * field blank — blank means "keep the stored one" on update, and is refused on
 * create because there is nothing to keep.
 */
export interface SsoConfig {
  orgId: string;
  authority: string;
  clientId: string;
  defaultRole: string;
  enabled: boolean;
  hasSecret: boolean;
}

export interface UpsertSsoRequest {
  authority: string;
  clientId: string;
  /** Omit or send empty to keep the stored secret. Required when creating. */
  clientSecret?: string;
  defaultRole: string;
}

/**
 * A claimed domain and the DNS challenge that proves it (mirrors accounts'
 * `OrgDomainInfo`).
 *
 * These live beside the SSO hooks because domain verification is not adjacent
 * paperwork — it *is* the security property SSO rests on. An org's IdP can
 * assert any email it likes, so the asserted address is resolved back to an org
 * through its **verified** domains; without one, a perfectly configured
 * connection silently matches nobody. `txtHost`/`txtRecord` stay populated after
 * verification on purpose, so an admin debugging why SSO stopped can see
 * exactly what we look for.
 */
export interface OrgDomain {
  id: string;
  domain: string;
  verified: boolean;
  createdAt: string;
  txtHost: string;
  txtRecord: string;
}

const domainsKey = (orgId: string) => ["org-domains", orgId];

export const useOrgDomains = (orgId: string | null) =>
  useApi.query<OrgDomain[]>(domainsKey(orgId ?? ""), `/orgs/${orgId}/domains`, {
    enabled: !!orgId,
  });

export const useAddOrgDomain = (orgId: string) =>
  useApi.mutation<{ domain: string }, OrgDomain>(`/orgs/${orgId}/domains`, {
    invalidates: [domainsKey(orgId)],
    toast: { success: "Domain claimed — now publish the TXT record" },
  });

/**
 * Re-checks DNS. Not a toggle the admin flips: the server resolves the record
 * and refuses if it isn't there, so a failure here means the record genuinely
 * isn't visible yet, and the error text is worth showing verbatim.
 */
export const useVerifyOrgDomain = (orgId: string) =>
  useApi.mutation<{ domainId: string }, OrgDomain>(
    (v) => `/orgs/${orgId}/domains/${v.domainId}/verify`,
    { invalidates: [domainsKey(orgId), ["org-sso", orgId]] },
  );

export const useRemoveOrgDomain = (orgId: string) =>
  useApi.mutation<{ domainId: string }, unknown>((v) => `/orgs/${orgId}/domains/${v.domainId}`, {
    method: "DELETE",
    invalidates: [domainsKey(orgId)],
    toast: { success: "Domain removed" },
  });

const ssoKey = (orgId: string) => ["org-sso", orgId];

/**
 * The org's connection, or `null` when none is configured.
 *
 * Null is a *successful* read, not a 404 — most orgs have no SSO, and the
 * server answers ok-with-null precisely so this screen can tell "none yet" from
 * "you may not look" (which is a 403 and surfaces as an error).
 */
export const useOrgSso = (orgId: string | null) =>
  useApi.query<SsoConfig | null>(ssoKey(orgId ?? ""), `/orgs/${orgId}/sso`, { enabled: !!orgId });

export const useUpsertOrgSso = (orgId: string) =>
  useApi.mutation<UpsertSsoRequest, SsoConfig>(`/orgs/${orgId}/sso`, {
    method: "PUT",
    invalidates: [ssoKey(orgId)],
    toast: { success: "SSO connection saved" },
  });

/**
 * Enable/disable, kept separate from the upsert for the reason the server keeps
 * it separate: switching SSO off during an incident should be one click and must
 * not require re-submitting — or re-validating — a whole connection.
 */
export const useSetOrgSsoEnabled = (orgId: string) =>
  useApi.mutation<{ enabled: boolean }, SsoConfig>(`/orgs/${orgId}/sso/enabled`, {
    invalidates: [ssoKey(orgId)],
  });

export const useDeleteOrgSso = (orgId: string) =>
  useApi.mutation<void, unknown>(`/orgs/${orgId}/sso`, {
    method: "DELETE",
    invalidates: [ssoKey(orgId)],
    toast: { success: "SSO connection removed" },
  });
