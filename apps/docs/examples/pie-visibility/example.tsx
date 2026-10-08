"use client";
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import "@kind-ui/charts/styles.css";

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
} satisfies Chart.SeriesConfig;
const data: { key: keyof typeof config; hours: number; share: string }[] = [
  { key: "design", hours: 420, share: "42%" },
  { key: "engineering", hours: 310, share: "31%" },
  { key: "operations", hours: 170, share: "17%" },
  { key: "research", hours: 100, share: "10%" },
];

export function VisibleAllocationChart() {
  const [visible, setVisible] = useState<string[]>(Object.keys(config));
  const [changes, setChanges] = useState(0);
  const visibleTotal = data.reduce(
    (sum, row) => sum + (visible.includes(row.key) ? row.hours : 0),
    0,
  );
  return (
    <Chart.Root
      config={config}
      interaction={{ kind: "category", mode: "visibility", eligibleKeys: Object.keys(config) }}
      visibleSeries={visible}
      onVisibleSeriesChange={(next) => {
        setVisible(next);
        setChanges((count) => count + 1);
      }}
      data-visibility-changes={changes}
    >
      <Chart.Legend />
      <p role="status" className="sr-only">
        {visibleTotal.toLocaleString("en-US")} hours visible; slice positions retain the full
        allocation
      </p>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart
          animate
          accessibilityLayer
          aria-label="Team allocation with controlled visual visibility"
        >
          <Chart.PieSeries
            interactionBinding="root"
            data={data}
            dataKey="hours"
            nameKey="key"
            categoryKey="key"
            innerRadius={58}
            outerRadius={108}
            paddingAngle={0}
          ></Chart.PieSeries>
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
