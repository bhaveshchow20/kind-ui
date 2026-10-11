"use client";
import * as Chart from "@kind-ui/charts";

const data = [
  { period: "North", orders: 124 },
  { period: "East", orders: 186 },
  { period: "Central", orders: 238 },
  { period: "West", orders: 162 },
  { period: "South", orders: 208 },
];
const config = {
  orders: { label: "Orders", color: "#733bff" },
} satisfies Chart.SeriesConfig;

export function PickupOrdersChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.BarChart
      config={config}
      height={280}
      defaultVisibleSeries={Object.keys(config)}
      legendPosition="top"
      loading={state === "loading"}
      data={data}
      animate
      accessibilityLayer
      emphasis="category"
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      aria-label="Weekly pickup orders by location"
    >
      <Chart.BarChart.Grid stroke="#ccc" vertical={false} strokeDasharray="3 3" />
      <Chart.BarChart.XAxis
        tick={{ fill: "#666" }}
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tickMargin={16}
        height={56}
        interval="preserveStartEnd"
        minTickGap={32}
      />
      <Chart.BarChart.YAxis
        tick={{ fill: "#666" }}
        axisLine={false}
        tickLine={false}
        tickMargin={10}
        width={72}
      />
      <Chart.BarChart.Series dataKey="orders" radius={[5, 5, 0, 0]} maxBarSize={48} />
      <Chart.BarChart.Tooltip />
      <Chart.BarChart.Legend />
    </Chart.BarChart>
  );
}
