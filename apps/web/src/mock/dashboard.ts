import type { ChartWidget } from "@datarango/ui";

/** Placeholder data until the gateway ships (backend Phases 1–2). */

export const LEARNER_STATS = [
  { label: "Day streak", value: "14", delta: "+2", description: "vs last week" },
  { label: "Total XP", value: "2,450", delta: "+180", description: "this week" },
  { label: "Token balance", value: "380 DRG", description: "≈ 2 course redemptions" },
  { label: "Certificates", value: "3", description: "1 pending review" },
];

export const ACTIVITY_WIDGET: ChartWidget = {
  id: "activity",
  name: "Learning activity",
  type: "data",
  dataType: "chart",
  chartType: "area",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    series: [
      { name: "XP", data: [0, 0, 0, 0, 0, 0, 0] },
      { name: "Minutes", data: [0, 0, 0, 0, 0, 0, 0] },
    ],
  },
};

export const QUIZ_WIDGET: ChartWidget = {
  id: "quiz-scores",
  name: "Recent quiz scores",
  type: "data",
  dataType: "chart",
  chartType: "bar",
  data: {
    labels: ["Pandas I", "SQL Joins", "Viz 101", "ML Intro", "Stats II"],
    series: [{ name: "Score", data: [0, 0, 0, 0, 0] }],
  },
};

export const CONTINUE_LEARNING = [
  {
    id: "c1",
    title: "Data Analysis with Pandas",
    module: "Module 4 · GroupBy & Aggregation",
    progress: 68,
    source: "Personal",
  },
  {
    id: "c2",
    title: "Machine Learning Fundamentals",
    module: "Module 2 · Regression",
    progress: 31,
    source: "Assigned by Acme Academy",
  },
  {
    id: "c3",
    title: "SQL for Analysts",
    module: "Module 6 · Window Functions",
    progress: 89,
    source: "Personal",
  },
];
