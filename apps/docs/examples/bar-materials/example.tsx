"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

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

export function MaterialBarChart({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
} = {}) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BarChart
          data={data}
          animate
          accessibilityLayer
          emphasis="category"
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Weekly pickup orders by location"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={16}
            height={56}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <Chart.YAxis axisLine={false} tickLine={false} tickMargin={10} width={72} />
          <Chart.BarSeries
            dataKey="orders"
            material={appearance === "default" ? undefined : appearance}
            radius={8}
            maxBarSize={48}
          />
          <Chart.Tooltip />
        </Chart.BarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
