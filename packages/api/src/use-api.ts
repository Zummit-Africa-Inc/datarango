"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "./client";
import { getApi } from "./configure";
import { useOrgScope } from "./provider";
import type { CursorPage, QueryParams } from "./types";

const scopeKey = (key: QueryKey, orgId: string | null, orgScoped: boolean): QueryKey =>
  orgScoped && orgId ? [...key, { org: orgId }] : key;

const errorMessage = (error: Error): string =>
  error instanceof ApiError ? error.message : "Something went wrong";

interface QueryOptions {
  params?: QueryParams;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  /**
   * Whether the active org context is appended to the query key (default
   * true) — org switches must never serve cross-tenant cache (§3).
   */
  orgScoped?: boolean;
}

/**
 * Fetches one resource from the gateway.
 *
 * @param key - Query key namespaced by module, e.g. ["course", slug].
 * @param path - Gateway path.
 * @param options - Params, enabled, staleTime, refetchInterval, orgScoped.
 * @example const { data } = useApi.query<CourseDetail>(["course", slug], `/courses/${slug}`);
 */
const useApiQuery = <TData>(key: QueryKey, path: string, options: QueryOptions = {}) => {
  const orgId = useOrgScope();

  return useQuery<TData, ApiError>({
    queryKey: scopeKey(key, orgId, options.orgScoped ?? true),
    queryFn: ({ signal }) => getApi().get<TData>(path, { params: options.params, signal }),
    enabled: options.enabled,
    staleTime: options.staleTime,
    refetchInterval: options.refetchInterval,
  });
};

type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

interface MutationOptions<TVariables, TData> {
  /** HTTP method (default POST). */
  method?: MutationMethod;
  /** Query keys to invalidate on success — prefix-matched, so unscoped keys hit all org scopes. */
  invalidates?: QueryKey[] | ((data: TData) => QueryKey[]);
  /** success: shown on success (silent by default); error: false silences the default error toast. */
  toast?: { success?: string; error?: string | false };
  /** Optimistic cache update; rolled back to the snapshot on error. Money and grading are never optimistic. */
  optimistic?: {
    key: QueryKey;
    update: (current: unknown, variables: TVariables) => unknown;
  };
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
}

/**
 * Mutates a gateway resource. Idempotency keys, org headers and the 401
 * refresh-retry come from the client; this layer adds cache invalidation,
 * optimistic updates and toasts.
 *
 * @param path - Gateway path, or a function of the variables for entity paths.
 * @param options - Method, invalidates, toast, optimistic, callbacks.
 * @example
 * const assign = useApi.mutation<AssignRequest, AssignResult>("/org/assignments", {
 *   invalidates: [["org-assignments"], ["org-usage"]],
 * });
 */
const useApiMutation = <TVariables = void, TData = unknown>(
  path: string | ((variables: TVariables) => string),
  options: MutationOptions<TVariables, TData> = {},
) => {
  const queryClient = useQueryClient();
  const orgId = useOrgScope();
  const method = options.method ?? "POST";

  return useMutation<TData, ApiError, TVariables, { snapshot: unknown }>({
    mutationFn: (variables) => {
      const target = typeof path === "function" ? path(variables) : path;
      const body = variables === undefined ? undefined : variables;
      switch (method) {
        case "POST":
          return getApi().post<TData>(target, body);
        case "PUT":
          return getApi().put<TData>(target, body);
        case "PATCH":
          return getApi().patch<TData>(target, body);
        case "DELETE":
          return getApi().delete<TData>(target, body);
      }
    },
    onMutate: async (variables) => {
      if (!options.optimistic) return { snapshot: undefined };
      const key = scopeKey(options.optimistic.key, orgId, true);
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: unknown) =>
        options.optimistic!.update(current, variables),
      );
      return { snapshot };
    },
    onError: (error, variables, context) => {
      if (options.optimistic && context) {
        queryClient.setQueryData(scopeKey(options.optimistic.key, orgId, true), context.snapshot);
      }
      if (options.toast?.error !== false) {
        toast.error(options.toast?.error ?? errorMessage(error));
      }
      options.onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      if (options.toast?.success) toast.success(options.toast.success);
      const keys =
        typeof options.invalidates === "function"
          ? options.invalidates(data)
          : (options.invalidates ?? []);
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      options.onSuccess?.(data, variables);
    },
  });
};

interface PaginatedOptions {
  params?: QueryParams;
  enabled?: boolean;
  staleTime?: number;
  /** Page size sent as `limit` (default 20). */
  limit?: number;
  orgScoped?: boolean;
}

/**
 * Cursor-paginated list per the gateway convention (`?cursor=&limit=`).
 * Returns the flattened items alongside the infinite-query controls.
 *
 * @param key - Query key namespaced by module.
 * @param path - Gateway path returning a CursorPage.
 * @example
 * const { items, fetchNextPage, hasNextPage } = useApi.paginated<OrgMember>(
 *   ["org-members"], "/org/members",
 * );
 */
const useApiPaginated = <TItem>(key: QueryKey, path: string, options: PaginatedOptions = {}) => {
  const orgId = useOrgScope();

  const result = useInfiniteQuery<CursorPage<TItem>, ApiError>({
    queryKey: scopeKey(key, orgId, options.orgScoped ?? true),
    initialPageParam: null,
    queryFn: ({ pageParam, signal }) =>
      getApi().get<CursorPage<TItem>>(path, {
        params: {
          ...options.params,
          cursor: (pageParam as string | null) ?? undefined,
          limit: options.limit ?? 20,
        },
        signal,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled,
    staleTime: options.staleTime,
  });

  return { ...result, items: result.data?.pages.flatMap((page) => page.items) ?? [] };
};

/**
 * The unified gateway hook (FRONTEND-HANDOFF §3): one API for queries,
 * cursor-paginated queries and mutations, with org-scoped cache keys.
 */
export const useApi = {
  query: useApiQuery,
  mutation: useApiMutation,
  paginated: useApiPaginated,
};

export { useApiMutation, useApiPaginated, useApiQuery };
