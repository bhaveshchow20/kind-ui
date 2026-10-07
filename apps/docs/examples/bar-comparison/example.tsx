"use client";
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Fiction", print: 184, digital: 116 },
  { period: "History", print: 128, digital: 72 },
  { period: "Science", print: 156, digital: 104 },
  { period: "Arts", print: 112, digital: 88 },
  { period: "Travel", print: 96, digital: 64 },
];
const config = {
  print: { label: "Print", color: "#733bff" },
  digital: { label: "Digital", color: "#14a39a" },
} satisfies Chart.SeriesConfig;

export function LibraryLoansChart({
  arrangement = "grouped",
}: {
  arrangement?: "grouped" | "stacked";
} = {}) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(["print", "digital"]);
  const stackId = arrangement === "stacked" ? "loans" : undefined;
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={setVisibleSeries}
    >
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BarChart
          data={data}
          animate
          accessibilityLayer
          emphasis="category"
          barGap={4}
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Library loans by subject and format"
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
          <Chart.BarSeries dataKey="print" stackId={stackId} maxBarSize={32} />
          <Chart.BarSeries dataKey="digital" stackId={stackId} maxBarSize={32} />
          <Chart.Tooltip />
        </Chart.BarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
