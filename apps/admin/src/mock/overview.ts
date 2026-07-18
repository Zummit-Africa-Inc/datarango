import type { ChartWidget, TableWidget } from "@datarango/ui";

/** Placeholder data until the gateway ships. */

export const PLATFORM_STATS = [
  { label: "Registered users", value: "12,438", delta: "+412", description: "this month" },
  { label: "Organizations", value: "86", delta: "+5", description: "this month" },
  { label: "Cycle revenue", value: "₦18.4M", delta: "+9%", description: "vs last cycle" },
  { label: "Pending reviews", value: "7", description: "oldest 2 days" },
];

export const SIGNUPS_WIDGET: ChartWidget = {
  id: "signups",
  name: "Signups",
  type: "data",
  dataType: "chart",
  chartType: "area",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    series: [
      { name: "Individual", data: [820, 940, 1100, 980, 1240, 1380, 1520] },
      { name: "OrgInvited", data: [120, 180, 210, 260, 340, 390, 460] },
    ],
  },
};

export const REVENUE_WIDGET: ChartWidget = {
  id: "revenue",
  name: "Billed usage (₦M)",
  type: "data",
  dataType: "chart",
  chartType: "bar",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    series: [{ name: "Revenue", data: [9.2, 10.8, 12.1, 13.4, 15.2, 16.9, 18.4] }],
  },
};

export const REVIEW_QUEUE_WIDGET: TableWidget = {
  id: "review-queue",
  name: "Course review queue",
  type: "data",
  dataType: "table",
  columns: [
    { key: "course", label: "Course" },
    { key: "creator", label: "Creator" },
    { key: "submitted", label: "Submitted" },
    { key: "status", label: "Status" },
  ],
  rows: [
    {
      course: "Deep Learning with PyTorch",
      creator: "J. Enudeme",
      submitted: "2d ago",
      status: "Pending",
    },
    { course: "Excel to SQL", creator: "M. Abisiga", submitted: "1d ago", status: "Pending" },
    { course: "Intro to LLMs", creator: "S. Okunola", submitted: "20h ago", status: "In review" },
    { course: "Power BI Basics", creator: "A. Bello", submitted: "6h ago", status: "Pending" },
  ],
};
