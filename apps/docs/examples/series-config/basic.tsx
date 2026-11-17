"use client";

import { AreaChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { week: "W1", storage: 1.2, transfer: 0.6 },
  { week: "W2", storage: 1.4, transfer: 0.9 },
  { week: "W3", storage: 1.5, transfer: 0.8 },
  { week: "W4", storage: 1.9, transfer: 1.1 },
  { week: "W5", storage: 2.1, transfer: 1.4 },
  { week: "W6", storage: 2.4, transfer: 1.3 },
];

const terabytes = (value: unknown) => `${value} TB`;

const config = {
  storage: {
    color: { light: ["#3659b8", "#7c9cf0"], dark: ["#93b4ff", "#c7d6ff"] },
    formatValue: terabytes,
  },
  transfer: {
    label: "Data transfer",
    color: { light: "#b45309", dark: "#fbbf24" },
    formatValue: terabytes,
  },
} satisfies SeriesConfig;

export default function UsageChart() {
  return (
    <AreaChart
      data={data}
      config={config}
      margin={{ right: 16 }}
      aria-label="Weekly usage, in terabytes"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="week" />
      <AreaChart.YAxis width={40} />
      <AreaChart.Series dataKey="storage" type="monotone" />
      <AreaChart.Series dataKey="transfer" type="monotone" />
      <AreaChart.Tooltip />
      <AreaChart.Legend />
    </AreaChart>
  );
}
