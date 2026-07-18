import type { ChartWidget, TableWidget, Tenant } from "@datarango/ui";

/** Placeholder data until the gateway ships (backend Phases 1–2, billing Phase 5). */

export const MOCK_TENANTS: Tenant[] = [
  { id: "t1", name: "Acme Academy", slug: "acme-academy" },
  { id: "t2", name: "Datawise Ltd", slug: "datawise" },
];

export const ORG_STATS = [
  { label: "Seats in use", value: "96 / 120", description: "24 available" },
  { label: "Active learners (30d)", value: "84", delta: "+12", description: "vs prior 30d" },
  { label: "Avg. completion", value: "64%", delta: "+5%", description: "across assigned courses" },
  { label: "Usage this cycle", value: "₦412,000", description: "invoiced at cycle close" },
];

export const ACTIVE_LEARNERS_WIDGET: ChartWidget = {
  id: "active-learners",
  name: "Active learners",
  type: "data",
  dataType: "chart",
  chartType: "area",
  data: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    series: [{ name: "Learners", data: [42, 55, 61, 58, 72, 79, 85, 96] }],
  },
};

export const COMPLETIONS_WIDGET: ChartWidget = {
  id: "completions",
  name: "Completions by course",
  type: "data",
  dataType: "chart",
  chartType: "bar",
  data: {
    labels: ["Pandas", "ML Basics", "SQL", "Data Viz", "Stats"],
    series: [
      { name: "Completed", data: [34, 18, 41, 22, 15] },
      { name: "InProgress", data: [22, 31, 12, 19, 24] },
    ],
  },
};

export const SEAT_WIDGET: ChartWidget = {
  id: "seats",
  name: "Seat utilization",
  type: "data",
  dataType: "chart",
  chartType: "donut",
  data: {
    labels: ["Active", "Invited", "Unused"],
    series: [{ name: "Seats", data: [96, 10, 14] }],
  },
};

export const RECENT_ASSIGNMENTS_WIDGET: TableWidget = {
  id: "recent-assignments",
  name: "Recent assignments",
  type: "data",
  dataType: "table",
  columns: [
    { key: "member", label: "Member" },
    { key: "course", label: "Course" },
    { key: "assignedBy", label: "Assigned by" },
    { key: "status", label: "Status" },
  ],
  rows: [
    { member: "Chidinma E.", course: "ML Basics", assignedBy: "T. Ade", status: "In progress" },
    { member: "Kwame B.", course: "SQL for Analysts", assignedBy: "T. Ade", status: "Completed" },
    { member: "Aisha M.", course: "Data Viz", assignedBy: "CSV import", status: "Not started" },
    { member: "Femi O.", course: "Pandas", assignedBy: "T. Ade", status: "In progress" },
    { member: "Ngozi K.", course: "Stats", assignedBy: "CSV import", status: "In progress" },
  ],
};
