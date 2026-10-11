"use client";
import { PieChart, type SeriesConfig } from "@kind-ui/charts";

const config = {
  design: { label: "Design", color: "#733bff", formatValue: (value: unknown) => `${value} hours` },
  engineering: {
    label: "Engineering",
    color: "#2469d4",
    formatValue: (value: unknown) => `${value} hours`,
  },
  operations: {
    label: "Operations",
    color: "#b65c16",
    formatValue: (value: unknown) => `${value} hours`,
  },
  research: {
    label: "Research",
    color: "#147c68",
    formatValue: (value: unknown) => `${value} hours`,
  },
} satisfies SeriesConfig;
const data: { key: keyof typeof config; hours: number; share: string }[] = [
  { key: "design", hours: 420, share: "42%" },
  { key: "engineering", hours: 310, share: "31%" },
  { key: "operations", hours: 170, share: "17%" },
  { key: "research", hours: 100, share: "10%" },
];

export function TeamAllocationChart({ shape = "pie" }: { shape?: "pie" | "donut" | "loading" }) {
  return (
    <PieChart
      config={config}
      height={280}
      defaultVisibleSeries={Object.keys(config)}
      legendPosition="top"
      loading={shape === "loading"}
      animate
      accessibilityLayer
      aria-label="Team allocation: 1,000 hours"
      interaction={{ kind: "category", eligibleKeys: data.map((row) => row.key) }}
    >
      <PieChart.Series
        data={data}
        dataKey="hours"
        nameKey="key"
        categoryKey="key"
        innerRadius={shape === "donut" ? 58 : 0}
        outerRadius={108}
        paddingAngle={0}
      >
        <PieChart.Labels
          dataKey="share"
          position="inside"
          fill="white"
          stroke="none"
          style={{ fill: "white", fontWeight: 600 }}
        />
      </PieChart.Series>
      <PieChart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
      <PieChart.Legend />
    </PieChart>
  );
}
