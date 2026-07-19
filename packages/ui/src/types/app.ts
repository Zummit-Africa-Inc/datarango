import type { ComponentType } from "react";

export interface RouteConfig {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  hasOverview?: boolean;
  children?: RouteGroup[];
}

export interface RouteGroup {
  group: string;
  routes: RouteConfig[];
  disabled?: boolean;
}

export interface HttpResponse<T> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HttpError {
  errors: Record<string, string>;
  message: string;
  requestId: string;
  status: number;
  success: boolean;
}

export interface DefaultParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type StatusVariant =
  "amber" | "danger" | "draft" | "info" | "neutral" | "success" | "warning";

export type Maybe<T> = T | null | undefined;

export type MaybePromie<T> = T | Promise<T>;
