"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", revenue: 42, target: 40 },
  { month: "Feb", revenue: 47, target: 44 },
  { month: "Mar", revenue: 45, target: 48 },
  { month: "Apr", revenue: 53, target: 52 },
  { month: "May", revenue: 58, target: 56 },
  { month: "Jun", revenue: 64, target: 60 },
];

const config = {
  revenue: { label: "Revenue", color: "#0f8b8d" },
  target: { label: "Target", color: "#e07a2f" },
} satisfies SeriesConfig;

export default function RevenueChart() {
  return (
    <LineChart
      data={data}
      config={config}
      margin={{ right: 16 }}
      aria-label="Revenue against target, in thousands of dollars"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis width={40} />
      <LineChart.Series dataKey="revenue" type="monotone" strokeWidth={2} />
      <LineChart.Series dataKey="target" strokeDasharray="6 4" dot={false} />
      <LineChart.Tooltip />
      <LineChart.Legend />
    </LineChart>
  );
}
