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
  { team: "design", hours: 420, share: "42%" },
  { team: "engineering", hours: 310, share: "31%" },
  { team: "operations", hours: 170, share: "17%" },
  { team: "research", hours: 100, share: "10%" },
];

export default function TeamAllocationChart() {
  return (
    <PieChart
      config={config}
      height={280}
      animate
      interaction={{ kind: "category", eligibleKeys: data.map((row) => row.team) }}
      aria-label="Team allocation, 1,000 hours"
    >
      <PieChart.Series
        data={data}
        dataKey="hours"
        nameKey="team"
        categoryKey="team"
        outerRadius={108}
      >
        <PieChart.Labels dataKey="share" position="inside" fill="white" stroke="none" />
      </PieChart.Series>
      <PieChart.Tooltip itemKey={(entry) => entry.payload.team} />
      <PieChart.Legend />
    </PieChart>
  );
}
