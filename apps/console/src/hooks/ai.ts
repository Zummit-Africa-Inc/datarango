"use client";

import { useApi } from "@datarango/api";

/**
 * Org AI settings — the ai service's `providers` module through the gateway's
 * `/ai/providers/*` routes. The org is the active one (`X-Org-Id`), so no path
 * here names it.
 *
 * Permissions are checked by the ai service and mirrored by the page:
 * keys and the preferred provider need `org.settings.manage`, turning metered
 * AI on or off needs `org.billing.manage` (it spends money), and usage needs
 * `org.billing.view`.
 */

export type AiProvider = "anthropic" | "openai" | "google" | "azure_openai";

export const AI_PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: "anthropic", label: "Anthropic" },
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google Gemini" },
  { id: "azure_openai", label: "Azure OpenAI" },
];

export const providerLabel = (id: AiProvider | null | undefined): string =>
  AI_PROVIDERS.find((p) => p.id === id)?.label ?? "Automatic";

/** A model tier. Features name a tier, never a model; an org may pin a model per tier. */
export type AiTier = "standard" | "light";

/**
 * A stored key, as the server describes it. There is no key field: keys are
 * write-only, and `last4` is all that ever comes back.
 */
export interface AiCredential {
  provider: AiProvider;
  last4: string;
  status: string;
  endpoint: string | null;
  models: Partial<Record<AiTier, string>>;
  validatedAt: string | null;
  updatedAt: string;
}

export interface PutAiCredentialRequest {
  provider: AiProvider;
  apiKey: string;
  /** Azure OpenAI only: the https:// resource endpoint. */
  endpoint?: string;
  /** Model (or Azure deployment) per tier; Azure needs `standard`. */
  models?: Partial<Record<AiTier, string>>;
}

export interface AiSettings {
  meteredOptIn: boolean;
  preferredProvider: AiProvider | null;
}

export type AiFundingSource = "byok" | "platform_metered" | "platform_limited" | "platform_free";

export interface AiUsage {
  fundingSource: AiFundingSource;
  tokensUsed: number;
  dailyLimit: number | null;
  tokensUsedThisMonth: number;
  monthlyLimit: number | null;
}

const credentialsKey = ["ai-credentials"];
const settingsKey = ["ai-settings"];
const usageKey = ["ai-usage"];

export const useAiCredentials = (enabled: boolean) =>
  useApi.query<{ credentials: AiCredential[] }>(credentialsKey, "/ai/providers/credentials", {
    enabled,
  });

export const useAiSettings = (enabled: boolean) =>
  useApi.query<{ settings: AiSettings }>(settingsKey, "/ai/providers/settings", { enabled });

/**
 * Today's and this month's org-wide tokens, against the limits that apply to
 * the org's current funding. Asked for the org copilot feature because that
 * is the org's own surface; the allowance is shared across features.
 */
export const useAiUsage = (enabled: boolean) =>
  useApi.query<{ usage: AiUsage }>(usageKey, "/ai/providers/usage", {
    enabled,
    params: { feature: "org_copilot" },
  });

/**
 * Saves (or replaces) a key. The server pings the provider with it first and
 * refuses a key that doesn't answer, so a failure here is worth showing
 * verbatim next to the form.
 */
export const usePutAiCredential = () =>
  useApi.mutation<PutAiCredentialRequest, { credential: AiCredential }>(
    (v) => `/ai/providers/credentials/${v.provider}`,
    {
      method: "PUT",
      invalidates: [credentialsKey, usageKey],
      toast: { success: "Key verified and saved", error: false },
    },
  );

export const useDeleteAiCredential = () =>
  useApi.mutation<{ provider: AiProvider }, { deleted: boolean }>(
    (v) => `/ai/providers/credentials/${v.provider}`,
    {
      method: "DELETE",
      invalidates: [credentialsKey, settingsKey, usageKey],
      toast: { success: "Key removed" },
    },
  );

export const useSetAiMetering = () =>
  useApi.mutation<{ optIn: boolean }, { settings: AiSettings }>("/ai/providers/settings/metering", {
    method: "PUT",
    invalidates: [settingsKey, usageKey],
  });

export const useSetPreferredAiProvider = () =>
  useApi.mutation<{ provider: AiProvider | null }, { settings: AiSettings }>(
    "/ai/providers/settings/preferred-provider",
    {
      method: "PUT",
      invalidates: [settingsKey, usageKey],
      toast: { success: "Preferred provider saved" },
    },
  );
