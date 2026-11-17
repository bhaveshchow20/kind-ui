"use client";

import { RadarChart, type SeriesConfig } from "@kind-ui/charts";

const config = {
  studio: { label: "Studio", color: "#733bff" },
  field: { label: "Field", color: "#008b82" },
} satisfies SeriesConfig;

const data = [
  { trait: "Speed", studio: 88, field: 62 },
  { trait: "Quality", studio: 76, field: 91 },
  { trait: "Value", studio: 63, field: 84 },
  { trait: "Support", studio: 92, field: 68 },
  { trait: "Reach", studio: 58, field: 89 },
  { trait: "Trust", studio: 81, field: 74 },
];

export default function ProductRadarChart() {
  return (
    <RadarChart
      config={config}
      data={data}
      height={300}
      animate
      outerRadius="68%"
      interaction={{ kind: "series", eligibleKeys: Object.keys(config) }}
      aria-label="Product research scores out of 100"
    >
      <RadarChart.Grid radialLines={false} />
      <RadarChart.AngleAxis dataKey="trait" />
      <RadarChart.RadiusAxis
        domain={[0, 100]}
        ticks={[25, 50, 75, 100]}
        angle={60}
        axisLine={false}
        tick={{ fontSize: 10 }}
      />
      <RadarChart.Series dataKey="studio" strokeWidth={2} fillOpacity={0.18} />
      <RadarChart.Series dataKey="field" strokeWidth={2} fillOpacity={0.18} />
      <RadarChart.Tooltip />
      <RadarChart.Legend />
    </RadarChart>
  );
}
