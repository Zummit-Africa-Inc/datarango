import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins conditional class names and resolves Tailwind conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

/** Strips trailing slashes and collapses dynamic segments for route matching. */
export const normalize = (pathname: string): string =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

/** "course-builder" → "Course Builder" */
export const fromKebabCase = (value: string): string =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/** Builds breadcrumb items from a pathname, e.g. "/courses/data-101" → Courses / Data 101. */
export const buildBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = normalize(pathname).split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: fromKebabCase(decodeURIComponent(segment)),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
};
