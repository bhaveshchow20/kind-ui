"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { topic: "Onboarding", hours: 14 },
  { topic: "Security", hours: 9 },
  { topic: "Design reviews", hours: 7 },
  { topic: "Incident drills", hours: 5 },
];

const config = {
  hours: { label: "Hours", color: "#0f8b8d" },
} satisfies SeriesConfig;

export default function WorkshopChart() {
  return (
    <BarChart
      data={data}
      config={config}
      layout="vertical"
      margin={{ right: 16 }}
      aria-label="Workshop hours by topic"
    >
      <BarChart.Grid horizontal={false} vertical />
      <BarChart.XAxis type="number" tickFormatter={(value) => `${value}h`} />
      <BarChart.YAxis type="category" dataKey="topic" width={110} />
      <BarChart.ReferenceLine x={8} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
      <BarChart.Series dataKey="hours" />
      <BarChart.Tooltip />
    </BarChart>
  );
}
