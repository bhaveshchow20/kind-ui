"use client";
import * as Chart from "@kind-ui/charts";

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
} satisfies Chart.SeriesConfig;

export function ProductRadarChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.RadarChart
      config={config}
      height={280}
      defaultVisibleSeries={Object.keys(config)}
      legendPosition="top"
      loading={state === "loading"}
      data={data}
      animate
      outerRadius="68%"
      margin={{ top: 24, right: 36, bottom: 24, left: 36 }}
      aria-label="Product research scores out of 100: Studio and Field"
    >
      <Chart.RadarChart.Grid stroke="#ccc" radialLines={false} />
      <Chart.RadarChart.AngleAxis dataKey="period" tick={{ fontSize: 12 }} />
      <Chart.RadarChart.RadiusAxis
        domain={[0, 100]}
        ticks={[25, 50, 75, 100]}
        angle={60}
        axisLine={false}
        tick={{ fontSize: 10 }}
      />
      <Chart.RadarChart.Series dataKey="studio" strokeWidth={2} fillOpacity={0.18} />
      <Chart.RadarChart.Series dataKey="field" strokeWidth={2} fillOpacity={0.18} />
      <Chart.RadarChart.Tooltip />
      <Chart.RadarChart.Legend />
    </Chart.RadarChart>
  );
}
