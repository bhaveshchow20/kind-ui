"use client";
import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "North", orders: 124 },
  { period: "East", orders: 186 },
  { period: "Central", orders: 238 },
  { period: "West", orders: 162 },
  { period: "South", orders: 208 },
];
const config = {
  orders: { label: "Orders", color: "#733bff" },
} satisfies SeriesConfig;

export function MaterialBarChart({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
} = {}) {
  return (
    <>
      <>
        <BarChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          data={data}
          animate
          accessibilityLayer
          emphasis="category"
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Weekly pickup orders by location"
        >
          <BarChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
          <BarChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={16}
            height={56}
            interval="preserveStartEnd"
            minTickGap={32}
            tick={{ fill: "#666" }}
          />
          <BarChart.YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={72}
            tick={{ fill: "#666" }}
          />
          <BarChart.Series
            dataKey="orders"
            {...(appearance !== "default" ? { material: appearance } : {})}
            radius={8}
            maxBarSize={48}
          />
          <BarChart.Tooltip />
          <BarChart.Legend />
        </BarChart>
      </>
    </>
  );
}
