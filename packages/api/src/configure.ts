import { createClient, type ApiClient, type ClientConfig } from "./client";

let client: ApiClient | null = null;

/**
 * Configures the app-wide gateway client. Call once at app bootstrap (the
 * providers module) before any useApi hook renders.
 *
 * @param config - Client config with the auth/org getters wired in.
 * @returns The configured client.
 * @example configureApi({ baseUrl, getAccessToken: tokenStore.get });
 */
export const configureApi = (config: ClientConfig): ApiClient => {
  client = createClient(config);
  return client;
};

/**
 * The configured gateway client. Throws when called before {@link configureApi}
 * — a misconfigured app should fail loudly, not silently hit the wrong origin.
 */
export const getApi = (): ApiClient => {
  if (!client) throw new Error("@datarango/api: configureApi() must run before getApi()");
  return client;
};
