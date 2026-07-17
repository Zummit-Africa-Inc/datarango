/**
 * @datarango/api — typed gateway client + useApi (TanStack Query).
 *
 * Phase F0 grows this into the full unified hook (query/mutation/paginated)
 * with generated OpenAPI types and MSW mocks. Query keys are namespaced by
 * module and automatically include the active org context.
 */
export { createClient, ApiError } from "./client";
export type { ApiClient, ClientConfig, Problem } from "./client";
