import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PagedResponse } from "../types";
import { fromKebabCase } from "./string";

/** Joins conditional class names and resolves Tailwind conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/** Strips trailing slashes and collapses dynamic segments for route matching. */
export const normalize = (pathname: string): string =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_RE = /^[0-9a-f]{16,}$|^\d+$|^[0-9a-f-]{20,}$/i;

function isIdSegment(segment: string): boolean {
  return UUID_RE.test(segment) || ID_RE.test(segment);
}

export interface BreadcrumbEntry {
  label: string;
  href: string;
}

/** Builds breadcrumb items from a pathname, e.g. "/courses/data-101" → Courses / Data 101. */
export const buildBreadcrumbs = (pathname: string): BreadcrumbEntry[] => {
  const segments = normalize(pathname).split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbEntry[] = [];
  let href = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i] || "";
    href += `/${segment}`;
    if (isIdSegment(segment)) {
      const parentSegment = segments[i - 1];
      const singular = parentSegment ? parentSegment.replace(/s$/, "") : "item";
      breadcrumbs[breadcrumbs.length - 1] = {
        label: `${fromKebabCase(decodeURIComponent(singular))} Details`,
        href,
      };
    } else {
      breadcrumbs.push({ label: fromKebabCase(decodeURIComponent(segment)), href });
    }
  }

  return breadcrumbs;
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
