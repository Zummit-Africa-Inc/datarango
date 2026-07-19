interface WidgetBase {
  id: string;
  name: string;
}

export interface StatisticsWidget extends WidgetBase {
  type: "data";
  dataType: "statistics";
  data: { label: string; value: string | number; change?: number }[];
}

export interface ChartWidget extends WidgetBase {
  type: "data";
  dataType: "chart";
  chartType: "bar" | "line" | "area" | "pie" | "donut";
  data: {
    labels: string[];
    series: { name: string; data: number[] }[];
  };
}

export interface TableWidget extends WidgetBase {
  type: "data";
  dataType: "table";
  columns: { key: string; label: string }[];
  rows: Record<string, string | number | null | undefined>[];
}

export interface DocumentListWidget extends WidgetBase {
  type: "data";
  dataType: "document-list";
  documents: { id: string; name: string; url: string; updatedAt: Date }[];
}

export interface ExpensesStatsWidget extends WidgetBase {
  type: "data";
  dataType: "expenses-stats";
  periodStart: string;
  periodEnd: string;
  currency: string;
  totalAmount: number;
  categories: { category: string; amount: number; currency: string }[];
}

export type DataWidget =
  StatisticsWidget | ChartWidget | TableWidget | DocumentListWidget | ExpensesStatsWidget;

export interface NewsWidget extends WidgetBase {
  type: "news";
  items: { id: string; title: string; url: string; imageUrl?: string; publishedAt: string }[];
}

export interface EventsWidget extends WidgetBase {
  type: "events";
  items: { id: string; title: string; location?: string; startsAt: string }[];
}

export interface AdvertsWidget extends WidgetBase {
  type: "adverts";
  items: { id: string; title?: string; imageUrl: string; linkUrl: string }[];
}

export interface ActivitiesWidget extends WidgetBase {
  type: "activities";
  items: { id: string; actor: string; action: string; target?: string; timestamp: string }[];
}

export type Widget = DataWidget | NewsWidget | EventsWidget | AdvertsWidget | ActivitiesWidget;

export interface WidgetConfig {
  widget: Widget;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRemove?: () => void;
  className?: string;
}
