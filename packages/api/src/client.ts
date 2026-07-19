import { uuidv7 } from "./uuid";
import type { QueryParams } from "./types";

/** RFC 7807 problem+json body returned by the gateway on errors. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Typed error thrown by the client for non-2xx gateway responses. */
export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
  }

  get status(): number {
    return this.problem.status;
  }

  /** Field-level validation errors for form surfaces (RFC 7807 `errors`). */
  get fieldErrors(): Record<string, string[]> {
    return this.problem.errors ?? {};
  }
}

export interface RequestOptions {
  params?: QueryParams;
  signal?: AbortSignal;
}

export interface ClientConfig {
  baseUrl: string;
  /** Access token provider — memory-held token from @datarango/auth. */
  getAccessToken?: () => string | null;
  /** Active org context — injected as X-Org-Id when present. */
  getOrgId?: () => string | null;
  /**
   * Called once on a 401 to attempt a silent refresh. Return true to retry
   * the request (same idempotency key); false falls through to expiry.
   */
  onUnauthorized?: () => Promise<boolean>;
  /** Called when a 401 survives the refresh attempt — the session boundary. */
  onSessionExpired?: () => void;
}

const buildUrl = (baseUrl: string, path: string, params?: QueryParams): string => {
  if (!params) return `${baseUrl}${path}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${baseUrl}${path}${path.includes("?") ? "&" : "?"}${qs}` : `${baseUrl}${path}`;
};

/**
 * The only HTTP surface allowed to talk to the gateway (FRONTEND-HANDOFF §3).
 * Conventions baked in: X-Org-Id injection, UUIDv7 Idempotency-Key on
 * mutations (stable across the refresh retry), problem+json → ApiError,
 * 401 → silent refresh → retry once → session boundary.
 *
 * @example
 * const api = createClient({ baseUrl, getAccessToken: tokenStore.get });
 * const course = await api.get<CourseDetail>(`/courses/${slug}`);
 */
export const createClient = ({
  baseUrl,
  getAccessToken,
  getOrgId,
  onUnauthorized,
  onSessionExpired,
}: ClientConfig) => {
  const request = async <T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> => {
    const idempotencyKey = method === "GET" ? null : uuidv7();

    const execute = async (retried: boolean): Promise<T> => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getAccessToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
      const orgId = getOrgId?.();
      if (orgId) headers["X-Org-Id"] = orgId;
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

      const res = await fetch(buildUrl(baseUrl, path, options?.params), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options?.signal,
      });

      if (res.status === 401) {
        if (!retried && onUnauthorized) {
          const refreshed = await onUnauthorized().catch(() => false);
          if (refreshed) return execute(true);
        }
        onSessionExpired?.();
      }

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as Problem | null;
        throw new ApiError(
          problem ?? { type: "about:blank", title: res.statusText, status: res.status },
        );
      }
      return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
    };

    return execute(false);
  };

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("POST", path, body, options),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PUT", path, body, options),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("PATCH", path, body, options),
    delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>("DELETE", path, body, options),
  };
};

export type ApiClient = ReturnType<typeof createClient>;
