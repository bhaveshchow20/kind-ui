"use client";

import { PieChart, type SeriesConfig } from "@kind-ui/charts";

const hours = (value: unknown) => `${value} hours`;

const config = {
  design: { label: "Design", color: "#733bff", formatValue: hours },
  engineering: { label: "Engineering", color: "#2469d4", formatValue: hours },
  operations: { label: "Operations", color: "#b65c16", formatValue: hours },
  research: { label: "Research", color: "#147c68", formatValue: hours },
} satisfies SeriesConfig;

const data = [
  { team: "design", hours: 420 },
  { team: "engineering", hours: 310 },
  { team: "operations", hours: 170 },
  { team: "research", hours: 100 },
];

export default function TeamDonutChart() {
  return (
    <PieChart
      config={config}
      height={280}
      defaultVisibleSeries={Object.keys(config)}
      interaction={{
        kind: "category",
        mode: "visibility",
        eligibleKeys: data.map((row) => row.team),
      }}
      aria-label="Team allocation, 1,000 hours"
    >
      <PieChart.Series
        data={data}
        dataKey="hours"
        nameKey="team"
        categoryKey="team"
        innerRadius={58}
        outerRadius={108}
        cornerRadius={8}
        paddingAngle={2}
      />
      <PieChart.Tooltip itemKey={(entry) => entry.payload.team} />
      <PieChart.Legend />
    </PieChart>
  );
}
