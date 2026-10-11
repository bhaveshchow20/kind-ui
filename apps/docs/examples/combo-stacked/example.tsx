"use client";
import { ComboChart, type SeriesConfig, type TooltipValueType } from "@kind-ui/charts";

const data = [
  { period: "Jan", retail: 42000, wholesale: 26000, margin: 18 },
  { period: "Feb", retail: 47000, wholesale: 28000, margin: 20 },
  { period: "Mar", retail: 44000, wholesale: 34000, margin: 19 },
  { period: "Apr", retail: 52000, wholesale: 31000, margin: 23 },
  { period: "May", retail: 58000, wholesale: 36000, margin: 25 },
  { period: "Jun", retail: 63000, wholesale: 39000, margin: 27 },
];
const dollars = (value: TooltipValueType) =>
  typeof value === "number" ? `$${value.toLocaleString("en-US")}` : String(value);
const config = {
  retail: { label: "Retail · USD", color: "#733bff", formatValue: dollars },
  wholesale: { label: "Wholesale · USD", color: "#b2a0ef", formatValue: dollars },
  margin: { label: "Margin · %", color: "#087f78", formatValue: (value) => `${value}%` },
} satisfies SeriesConfig;

export function RevenueMarginChart() {
  return (
    <>
      <>
        <ComboChart
          legendPosition="top"
          config={config}
          interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
          width="100%"
          height={280}
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 0, bottom: 8, left: 16 }}
          aria-label="Stacked monthly revenue in US dollars, with margin percentage on the right axis"
        >
          <ComboChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
          <ComboChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
            tick={{ fill: "#666" }}
          />
          <ComboChart.YAxis
            yAxisId="revenue"
            domain={[0, 120000]}
            ticks={[0, 40000, 80000, 120000]}
            tickFormatter={(value: number) => `$${value / 1000}k`}
            width={96}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={{ fill: "#666" }}
          />
          <ComboChart.YAxis
            yAxisId="margin"
            orientation="right"
            domain={[0, 40]}
            ticks={[0, 10, 20, 30, 40]}
            tickFormatter={(value: number) => `${value}%`}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={{ fill: "#666" }}
          />
          <ComboChart.Bar dataKey="retail" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
          <ComboChart.Bar dataKey="wholesale" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
          <ComboChart.Line
            dataKey="margin"
            yAxisId="margin"
            type="linear"
            strokeWidth={2.5}
            dot={false}
          />
          <ComboChart.Tooltip maxWidth={200} />
          <ComboChart.Legend />
        </ComboChart>
      </>
    </>
  );
}
