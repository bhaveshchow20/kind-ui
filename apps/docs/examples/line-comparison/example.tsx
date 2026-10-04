"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", actual: 42, target: 48 },
  { period: "Feb", actual: 58, target: 54 },
  { period: "Mar", actual: 51, target: 60 },
  { period: "Apr", actual: 76, target: 66 },
  { period: "May", actual: 68, target: 72 },
  { period: "Jun", actual: 91, target: 78 },
  { period: "Jul", actual: 84, target: 84 },
  { period: "Aug", actual: 107, target: 90 },
  { period: "Sep", actual: 96, target: 96 },
  { period: "Oct", actual: 118, target: 102 },
  { period: "Nov", actual: 111, target: 108 },
  { period: "Dec", actual: 136, target: 114 },
];
const config = {
  actual: { label: "Revenue", color: "#733bff", formatValue: (value: unknown) => `$${value}k` },
  target: { label: "Target", color: "#119548", formatValue: (value: unknown) => `$${value}k` },
} satisfies Chart.SeriesConfig;

export function RevenueComparisonChart() {
  return (
    <Chart.LineChart
      data={data}
      config={config}
      xDataKey="period"
      xAxis={{ tickMargin: 12, height: 48, interval: "preserveStartEnd" }}
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      aria-label="Revenue and target in thousands of dollars"
      yAxis={{ tickMargin: 12, width: 104, tickFormatter: (value) => `$${value}k` }}
      series={[
        { seriesKey: "actual", dataKey: "actual" },
        { seriesKey: "target", dataKey: "target", type: "linear", strokeDasharray: "5 5" },
      ]}
    />
  );
}
