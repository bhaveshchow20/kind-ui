"use client";
import * as Chart from "@kind-ui/charts";

const data = [
  { period: "Jan", capacity: 960, shipped: 640, target: 700 },
  { period: "Feb", capacity: 960, shipped: 730, target: 720 },
  { period: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { period: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { period: "May", capacity: 1120, shipped: 920, target: 880 },
  { period: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];
const config = {
  capacity: {
    label: "Capacity · units",
    color: "#b2a0ef",
    formatValue: (value) => `${value} units`,
  },
  shipped: { label: "Shipped · units", color: "#733bff", formatValue: (value) => `${value} units` },
  target: { label: "Target · units", color: "#087f78", formatValue: (value) => `${value} units` },
} satisfies Chart.SeriesConfig;

export function ProductionComboChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.ComboChart
      config={config}
      height={280}
      defaultVisibleSeries={Object.keys(config)}
      legendPosition="top"
      loading={state === "loading"}
      data={data}
      animate
      accessibilityLayer
      margin={{ top: 20, right: 20, bottom: 8, left: 16 }}
      aria-label="Monthly production, capacity and target in units"
    >
      <Chart.ComboChart.Grid stroke="#ccc" vertical={false} strokeDasharray="3 3" />
      <Chart.ComboChart.XAxis
        tick={{ fill: "#666" }}
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tickMargin={10}
        height={40}
      />
      <Chart.ComboChart.YAxis
        tick={{ fill: "#666" }}
        domain={[0, 1200]}
        ticks={[0, 400, 800, 1200]}
        width={80}
        axisLine={false}
        tickLine={false}
        tickMargin={8}
      />
      <Chart.ComboChart.Area
        dataKey="capacity"
        type="stepAfter"
        fillOpacity={0.18}
        strokeWidth={1}
      />
      <Chart.ComboChart.Bar dataKey="shipped" maxBarSize={32} radius={[4, 4, 0, 0]} />
      <Chart.ComboChart.Line
        dataKey="target"
        type="linear"
        strokeWidth={2.5}
        strokeDasharray="6 4"
        dot={false}
      />
      <Chart.ComboChart.Tooltip maxWidth={200} />
      <Chart.ComboChart.Legend />
    </Chart.ComboChart>
  );
}
