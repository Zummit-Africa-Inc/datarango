import type { ComponentType, ReactNode } from "react";

/* ------------------------------- navigation ------------------------------ */

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

/* --------------------------------- tenancy -------------------------------- */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

/* --------------------------------- status --------------------------------- */

export type StatusVariant =
  "amber" | "danger" | "draft" | "info" | "neutral" | "success" | "warning";

/* --------------------------------- widgets -------------------------------- */

interface WidgetBase {
  id: string;
  name: string;
}

export interface StatisticsWidget extends WidgetBase {
  type: "data";
  dataType: "statistics";
  data: Array<{ label: string; value: string | number; change?: number }>;
}

export interface ChartWidget extends WidgetBase {
  type: "data";
  dataType: "chart";
  chartType: "area" | "bar" | "donut" | "line" | "pie";
  data: {
    labels: string[];
    series: Array<{ name: string; data: number[] }>;
  };
}

export interface TableWidget extends WidgetBase {
  type: "data";
  dataType: "table";
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
}

export interface DocumentListWidget extends WidgetBase {
  type: "data";
  dataType: "document-list";
  documents: Array<{ id: string; name: string; url: string; updatedAt: string }>;
}

export interface ExpensesStatsWidget extends WidgetBase {
  type: "data";
  dataType: "expenses-stats";
  currency: string;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
  categories: Array<{ category: string; amount: number; currency: string }>;
}

export type DataWidget =
  StatisticsWidget | ChartWidget | TableWidget | DocumentListWidget | ExpensesStatsWidget;

export interface NewsWidget extends WidgetBase {
  type: "news";
  items: Array<{ id: string; title: string; url: string; publishedAt: string; imageUrl?: string }>;
}

export interface EventsWidget extends WidgetBase {
  type: "events";
  items: Array<{ id: string; title: string; startsAt: string; location?: string }>;
}

export interface AdvertsWidget extends WidgetBase {
  type: "adverts";
  items: Array<{ id: string; imageUrl: string; linkUrl: string; title?: string }>;
}

export interface ActivitiesWidget extends WidgetBase {
  type: "activities";
  items: Array<{ id: string; actor: string; action: string; timestamp: string; target?: string }>;
}

export type Widget = DataWidget | NewsWidget | EventsWidget | AdvertsWidget | ActivitiesWidget;

export interface WidgetConfig {
  widget: Widget;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onRemove?: () => void;
  className?: string;
  children?: ReactNode;
}
