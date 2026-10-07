"use client";
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", retail: 42000, wholesale: 26000, margin: 18 },
  { period: "Feb", retail: 47000, wholesale: 28000, margin: 20 },
  { period: "Mar", retail: 44000, wholesale: 34000, margin: 19 },
  { period: "Apr", retail: 52000, wholesale: 31000, margin: 23 },
  { period: "May", retail: 58000, wholesale: 36000, margin: 25 },
  { period: "Jun", retail: 63000, wholesale: 39000, margin: 27 },
];
const dollars = (value: Chart.TooltipValueType) =>
  typeof value === "number" ? `$${value.toLocaleString("en-US")}` : String(value);
const config = {
  retail: { label: "Retail · USD", color: "#733bff", formatValue: dollars },
  wholesale: { label: "Wholesale · USD", color: "#b2a0ef", formatValue: dollars },
  margin: { label: "Margin · %", color: "#087f78", formatValue: (value) => `${value}%` },
} satisfies Chart.SeriesConfig;

export function RevenueMarginChart() {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(["retail", "wholesale", "margin"]);
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={setVisibleSeries}
    >
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ComboChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 0, bottom: 8, left: 16 }}
          aria-label="Stacked monthly revenue in US dollars, with margin percentage on the right axis"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
          />
          <Chart.YAxis
            yAxisId="revenue"
            domain={[0, 120000]}
            ticks={[0, 40000, 80000, 120000]}
            tickFormatter={(value: number) => `$${value / 1000}k`}
            width={96}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.YAxis
            yAxisId="margin"
            orientation="right"
            domain={[0, 40]}
            ticks={[0, 10, 20, 30, 40]}
            tickFormatter={(value: number) => `${value}%`}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.BarSeries dataKey="retail" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
          <Chart.BarSeries
            dataKey="wholesale"
            yAxisId="revenue"
            stackId="revenue"
            maxBarSize={32}
          />
          <Chart.LineSeries
            dataKey="margin"
            yAxisId="margin"
            type="linear"
            strokeWidth={2.5}
            dot={false}
          />
          <Chart.Tooltip maxWidth={200} />
        </Chart.ComboChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
