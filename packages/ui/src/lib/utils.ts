import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PagedResponse } from "../types";
import { fromKebabCase } from "./string";

/** Joins conditional class names and resolves Tailwind conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/** Strips trailing slashes and collapses dynamic segments for route matching. */
export const normalize = (pathname: string): string =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

/** Builds breadcrumb items from a pathname, e.g. "/courses/data-101" → Courses / Data 101. */
export const buildBreadcrumbs = (pathname: string): { label: string; href: string }[] => {
  const segments = normalize(pathname).split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: fromKebabCase(decodeURIComponent(segment)),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
};

export function removeNullorUndefined<
  T extends {
    [K in keyof T]: T[K] | null | undefined;
  },
>(params: T) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );
  return cleaned as Partial<T>;
}

export function paginate<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
): PagedResponse<T> {
  const offset = (page - 1) * pageSize;
  const hasNextPage = offset + pageSize < total;
  const hasPreviousPage = page > 1;
  const totalPages = Math.ceil(total / pageSize);

  const items = data.slice(offset, offset + pageSize);

  return { data: items, hasNextPage, hasPreviousPage, page, pageSize, total, totalPages };
}

export const getColorVariant = (color: string, percentage: number, variant: "light" | "dark") => {
  const mixColor = variant === "light" ? "white" : "black";
  return `color-mix(in srgb, ${color} ${percentage}%, ${mixColor})`;
};
