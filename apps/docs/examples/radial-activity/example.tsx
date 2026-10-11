"use client";
import { ActivityRings, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { key: "move", value: 350, domain: [0, 500] as const },
  { key: "exercise", value: 30, domain: [0, 60] as const },
  { key: "stand", value: 9, domain: [0, 12] as const },
];
const config = {
  move: { label: "Move", color: "#e02266", formatValue: (value: unknown) => `${value} kcal` },
  exercise: {
    label: "Exercise",
    color: "#327448",
    formatValue: (value: unknown) => `${value} min`,
  },
  stand: { label: "Stand", color: "#2469d4", formatValue: (value: unknown) => `${value} hours` },
} satisfies SeriesConfig;

export function DailyActivityChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <ActivityRings
      loading={state === "loading"}
      rings={data}
      config={config}
      aria-label="Daily activity"
      defaultVisibleSeries={Object.keys(config)}
      interaction={{ kind: "category", eligibleKeys: data.map((ring) => ring.key) }}
    >
      <ActivityRings.Series />
      <ActivityRings.Tooltip />
      <ActivityRings.Legend />
    </ActivityRings>
  );
}
