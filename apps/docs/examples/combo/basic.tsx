"use client";

import { ComboChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", capacity: 960, shipped: 640, target: 700 },
  { month: "Feb", capacity: 960, shipped: 730, target: 720 },
  { month: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { month: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { month: "May", capacity: 1120, shipped: 920, target: 880 },
  { month: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];

const units = (value: unknown) => `${value} units`;

const config = {
  capacity: { label: "Capacity", color: "#b2a0ef", formatValue: units },
  shipped: { label: "Shipped", color: "#733bff", formatValue: units },
  target: { label: "Target", color: "#0f8b8d", formatValue: units },
} satisfies SeriesConfig;

export default function ProductionChart() {
  return (
    <ComboChart
      data={data}
      config={config}
      animate
      margin={{ right: 16 }}
      aria-label="Monthly units shipped against capacity and target"
    >
      <ComboChart.Grid />
      <ComboChart.XAxis dataKey="month" />
      <ComboChart.YAxis width={48} />
      <ComboChart.Area dataKey="capacity" type="stepAfter" fillOpacity={0.2} />
      <ComboChart.Bar dataKey="shipped" maxBarSize={32} radius={[4, 4, 0, 0]} />
      <ComboChart.Line dataKey="target" strokeWidth={2} strokeDasharray="6 4" dot={false} />
      <ComboChart.Tooltip />
      <ComboChart.Legend />
    </ComboChart>
  );
}
