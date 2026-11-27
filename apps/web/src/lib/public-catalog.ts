import type { Course } from "@/hooks/learning";

export interface PublicCatalog {
  courses: Course[];
  total: number;
}

const gatewayUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Published courses for the signed-out marketing pages, through the gateway's
 * public catalogue route. Cached for five minutes so the home page isn't a
 * gateway call per visitor.
 *
 * Returns null when the gateway can't be reached or answers with an error: the
 * page then leaves out the sections that need it rather than showing a number
 * or a course that isn't real.
 */
export const getPublicCatalog = async (pageSize = 8): Promise<PublicCatalog | null> => {
  try {
    const response = await fetch(`${gatewayUrl()}/learning/public/courses?pageSize=${pageSize}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as Partial<PublicCatalog>;
    if (!Array.isArray(body.courses) || typeof body.total !== "number") return null;
    return { courses: body.courses, total: body.total };
  } catch {
    return null;
  }
};
