"use client";

import { BarChart, type SeriesConfig, TooltipContent } from "@kind-ui/charts";

const data = [
  { day: "Mon", p50: 120, p95: 340 },
  { day: "Tue", p50: 132, p95: 365 },
  { day: "Wed", p50: 118, p95: 310 },
  { day: "Thu", p50: 141, p95: 402 },
  { day: "Fri", p50: 126, p95: 355 },
];

const milliseconds = (value: unknown) => `${value} ms`;

const config = {
  p50: { label: "Median", color: "#3659b8", formatValue: milliseconds },
  p95: { label: "95th percentile", color: "#c2410c", formatValue: milliseconds },
} satisfies SeriesConfig;

export default function ResponseTimeChart() {
  return (
    <BarChart data={data} config={config} aria-label="Response time by day">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="day" />
      <BarChart.YAxis width={40} />
      <BarChart.Series dataKey="p50" />
      <BarChart.Series dataKey="p95" />
      <BarChart.Tooltip
        content={(tooltip) => <TooltipContent tooltip={tooltip} indicator="dot" />}
      />
    </BarChart>
  );
}
