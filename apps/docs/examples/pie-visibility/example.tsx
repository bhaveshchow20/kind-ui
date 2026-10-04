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
  const selected = data.filter((row) => visible.includes(row.key));
  const total = selected.reduce((sum, row) => sum + row.hours, 0);
  return (
    <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
      <Chart.Legend />
      <p role="status" style={{ textAlign: "center", margin: 0 }}>
        {total.toLocaleString("en-US")} hours selected
      </p>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart animate accessibilityLayer aria-label="Selected team allocation">
          <Chart.PieSeries
            data={selected}
            dataKey="hours"
            nameKey="key"
            innerRadius={58}
            outerRadius={108}
            paddingAngle={2}
          >
            {selected.map((row) => (
              <Chart.Cell key={row.key} fill={config[row.key].color} />
            ))}
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
