"use client";

import { ActivityRings, type SeriesConfig } from "@kind-ui/charts";

const config = {
  move: { label: "Move", color: "#e02266", formatValue: (value: unknown) => `${value} kcal` },
  exercise: {
    label: "Exercise",
    color: "#327448",
    formatValue: (value: unknown) => `${value} min`,
  },
  stand: { label: "Stand", color: "#2469d4", formatValue: (value: unknown) => `${value} hours` },
} satisfies SeriesConfig;

const rings = [
  { key: "move", value: 350, domain: [0, 500] as const },
  { key: "exercise", value: 30, domain: [0, 60] as const },
  { key: "stand", value: 9, domain: [0, 12] as const },
];

export default function DailyActivityChart() {
  return (
    <ActivityRings rings={rings} config={config} animate aria-label="Daily activity">
      <ActivityRings.Series />
      <ActivityRings.Tooltip />
      <ActivityRings.Legend />
    </ActivityRings>
  );
}
