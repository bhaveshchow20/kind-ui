"use client";
import { PieChart, type SeriesConfig } from "@kind-ui/charts";
import { useState } from "react";

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

export function VisibleAllocationChart() {
  const [visible, setVisible] = useState<string[]>(Object.keys(config));
  const [changes, setChanges] = useState(0);
  const visibleTotal = data.reduce(
    (sum, row) => sum + (visible.includes(row.key) ? row.hours : 0),
    0,
  );
  return (
    <>
      <p role="status" className="sr-only">
        {visibleTotal.toLocaleString("en-US")} hours visible; slice positions retain the full
        allocation
      </p>
      <>
        <PieChart
          legendPosition="top"
          config={config}
          interaction={{ kind: "category", mode: "visibility", eligibleKeys: Object.keys(config) }}
          visibleSeries={visible}
          onVisibleSeriesChange={(next) => {
            setVisible(next);
            setChanges((count) => count + 1);
          }}
          frameProps={{ "data-visibility-changes": changes }}
          width="100%"
          height={280}
          animate
          accessibilityLayer
          aria-label="Team allocation with controlled visual visibility"
        >
          <PieChart.Series
            data={data}
            dataKey="hours"
            nameKey="key"
            categoryKey="key"
            innerRadius={58}
            outerRadius={108}
            paddingAngle={0}
          ></PieChart.Series>
          <PieChart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
          <PieChart.Legend />
        </PieChart>
      </>
    </>
  );
}
