/**
 * @datarango/api — the only package allowed to call the gateway
 * (FRONTEND-HANDOFF §3): typed client, useApi hooks, provider.
 * OpenAPI-generated types and MSW mocks arrive with the backend contract.
 */
export { ApiError, createClient } from "./client";
export type { ApiClient, ClientConfig, Problem, RequestOptions } from "./client";
export { configureApi, getApi } from "./configure";
export { ApiProvider, useOrgScope } from "./provider";
export { useApi, useApiMutation, useApiPaginated, useApiQuery } from "./use-api";
export type { CursorPage, QueryParams } from "./types";
export { uuidv7 } from "./uuid";
