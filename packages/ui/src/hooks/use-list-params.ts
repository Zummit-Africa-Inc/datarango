"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/** Reads one search param into a typed value and writes it back (`null` = remove the key). */
export interface ParamParser<T> {
  parse: (raw: string | null) => T;
  serialize: (value: T) => string | null;
}

/** Typed parsers for {@link useListParams}. A value equal to its default is dropped from the URL. */
export const listParam = {
  string: (fallback = ""): ParamParser<string> => ({
    parse: (raw) => raw ?? fallback,
    serialize: (value) => (value === fallback ? null : value),
  }),
  number: (fallback: number): ParamParser<number> => ({
    parse: (raw) => {
      const n = raw === null ? NaN : Number(raw);
      return Number.isFinite(n) ? n : fallback;
    },
    serialize: (value) => (value === fallback ? null : String(value)),
  }),
  oneOf: <T extends string>(values: readonly T[], fallback: T): ParamParser<T> => ({
    parse: (raw) => ((values as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback),
    serialize: (value) => (value === fallback ? null : value),
  }),
  manyOf: <T extends string>(values: readonly T[]): ParamParser<T[]> => ({
    parse: (raw) =>
      (raw ?? "").split(",").filter((v): v is T => (values as readonly string[]).includes(v)),
    serialize: (value) => (value.length ? value.join(",") : null),
  }),
};

// ParamParser is invariant (it reads and writes T), so the schema has to accept any T.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = Record<string, ParamParser<any>>;
type Values<S extends Schema> = { [K in keyof S]: S[K] extends ParamParser<infer T> ? T : never };

/**
 * List state (search, filters, sort, page, view) kept in the URL, so a list is
 * shareable and survives back/forward (§8). Any change other than `page`
 * returns to page 1. Needs a `<Suspense>` boundary above it, like `useSearchParams`.
 * @param schema - One {@link listParam} parser per key.
 * @returns `params` (parsed), `set(patch)`, `reset()` and `activeCount` (keys away from default, excluding `page`, `q`, `sort`, `view`).
 * @example
 * const { params, set } = useListParams({ q: listParam.string(), page: listParam.number(1) });
 * useDiscoverCourses({ search: params.q, page: params.page });
 */
export const useListParams = <S extends Schema>(schema: S) => {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const raw = search.toString();

  const params = useMemo(() => {
    const current = new URLSearchParams(raw);
    return Object.fromEntries(
      Object.entries(schema).map(([key, parser]) => [key, parser.parse(current.get(key))]),
    ) as Values<S>;
  }, [raw]);

  const write = useCallback(
    (patch: Partial<Values<S>>, keepPage: boolean) => {
      const next = new URLSearchParams(raw);
      for (const [key, value] of Object.entries(patch)) {
        const serialized = schema[key]?.serialize(value);
        if (serialized === null || serialized === undefined) next.delete(key);
        else next.set(key, serialized);
      }
      if (!keepPage && "page" in schema) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [raw, pathname, router],
  );

  const set = useCallback(
    (patch: Partial<Values<S>>) =>
      write(
        patch,
        Object.keys(patch).every((k) => k === "page"),
      ),
    [write],
  );

  const reset = useCallback(() => {
    const next = new URLSearchParams(raw);
    for (const key of Object.keys(schema)) {
      if (key !== "view") next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [raw, pathname, router]);

  const activeCount = useMemo(() => {
    const current = new URLSearchParams(raw);
    return Object.keys(schema).filter(
      (key) => !["page", "q", "sort", "view"].includes(key) && current.has(key),
    ).length;
  }, [raw]);

  return { params, set, reset, activeCount };
};
