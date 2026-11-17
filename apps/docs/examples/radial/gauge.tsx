"use client";

import { RadialBarChart, type SeriesConfig } from "@kind-ui/charts";

const config = {
  used: { label: "Used", color: "#008b83", formatValue: (value: unknown) => `${value} of 100 GB` },
} satisfies SeriesConfig;

const data = [{ disk: "Storage", used: 72 }];

export default function StorageGaugeChart() {
  return (
    <RadialBarChart
      config={config}
      data={data}
      height={280}
      animate
      startAngle={180}
      endAngle={0}
      cy="78%"
      innerRadius="100%"
      outerRadius="140%"
      aria-label="Storage used, 72 of 100 GB"
    >
      <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
      <RadialBarChart.RadiusAxis type="category" dataKey="disk" tick={false} axisLine={false} />
      <RadialBarChart.Series dataKey="used" background cornerRadius={6} />
      <RadialBarChart.Tooltip />
    </RadialBarChart>
  );
}
