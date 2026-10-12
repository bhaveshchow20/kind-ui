"use client";
import { RadarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Speed", studio: 88, field: 62 },
  { period: "Quality", studio: 76, field: 91 },
  { period: "Value", studio: 63, field: 84 },
  { period: "Support", studio: 92, field: 68 },
  { period: "Reach", studio: 58, field: 89 },
  { period: "Trust", studio: 81, field: 74 },
];
const config = {
  studio: { label: "Studio", color: "#733bff" },
  field: { label: "Field", color: "#008b82" },
} satisfies SeriesConfig;

export function MaterialRadarChart({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
} = {}) {
  return (
    <>
      <>
        <RadarChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          data={data}
          animate
          outerRadius="68%"
          margin={{ top: 24, right: 36, bottom: 24, left: 36 }}
          aria-label="Product research scores out of 100: Studio and Field"
        >
          <RadarChart.Grid radialLines={false} />
          <RadarChart.AngleAxis dataKey="period" tick={{ fontSize: 12 }} />
          <RadarChart.RadiusAxis
            domain={[0, 100]}
            ticks={[25, 50, 75, 100]}
            angle={60}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <RadarChart.Series
            dataKey="studio"
            strokeWidth={2}
            fillOpacity={0.18}
            material={appearance === "default" ? undefined : appearance}
          />
          <RadarChart.Series
            dataKey="field"
            strokeWidth={2}
            fillOpacity={0.18}
            material={appearance === "default" ? undefined : appearance}
          />
          <RadarChart.Tooltip />
          <RadarChart.Legend />
        </RadarChart>
      </>
    </>
  );
}
