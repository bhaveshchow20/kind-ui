"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

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

function ProductRadarChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.RadarChart
          loading={state === "loading"}
          data={data}
          animate
          outerRadius="68%"
          margin={{ top: 24, right: 36, bottom: 24, left: 36 }}
          aria-label="Product research scores out of 100: Studio and Field"
        >
          <Chart.PolarGrid radialLines={false} />
          <Chart.PolarAngleAxis dataKey="period" tick={{ fontSize: 12 }} />
          <Chart.PolarRadiusAxis
            domain={[0, 100]}
            ticks={[25, 50, 75, 100]}
            angle={60}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <Chart.RadarSeries dataKey="studio" strokeWidth={2} fillOpacity={0.18} />
          <Chart.RadarSeries dataKey="field" strokeWidth={2} fillOpacity={0.18} />
          <Chart.Tooltip />
        </Chart.RadarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function ProductRadarChart(props: import("react").ComponentProps<typeof ProductRadarChartComposition>) {
  return (
    <div className="chart-example">
      <ProductRadarChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Radar Chart data">
          <caption>{"Product research scores out of 100"}</caption>
          <thead><tr><th scope="col">{"Dimension"}</th><th scope="col">{"Studio"}</th><th scope="col">{"Field"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Speed"}</th><td>{88}</td><td>{62}</td></tr><tr><th scope="row">{"Quality"}</th><td>{76}</td><td>{91}</td></tr><tr><th scope="row">{"Value"}</th><td>{63}</td><td>{84}</td></tr><tr><th scope="row">{"Support"}</th><td>{92}</td><td>{68}</td></tr><tr><th scope="row">{"Reach"}</th><td>{58}</td><td>{89}</td></tr><tr><th scope="row">{"Trust"}</th><td>{81}</td><td>{74}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
