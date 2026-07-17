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
    super(problem.title);
    this.name = "ApiError";
  }
}

export interface ClientConfig {
  baseUrl: string;
  /** Access token provider — memory-held token from @datarango/auth. */
  getAccessToken?: () => string | null;
  /** Active org context — injected as X-Org-Id when present. */
  getOrgId?: () => string | null;
}

/**
 * The only HTTP surface allowed to talk to the gateway (FRONTEND-HANDOFF §3).
 * Conventions baked in: X-Org-Id injection, Idempotency-Key on mutations,
 * problem+json parsed into ApiError.
 */
export const createClient = ({ baseUrl, getAccessToken, getOrgId }: ClientConfig) => {
  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    const orgId = getOrgId?.();
    if (orgId) headers["X-Org-Id"] = orgId;
    if (method !== "GET") headers["Idempotency-Key"] = crypto.randomUUID();

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      const problem = (await res.json().catch(() => null)) as Problem | null;
      throw new ApiError(
        problem ?? { type: "about:blank", title: res.statusText, status: res.status },
      );
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  };

  return {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
};

export type ApiClient = ReturnType<typeof createClient>;
