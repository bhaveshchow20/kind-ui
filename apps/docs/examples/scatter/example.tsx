"use client";
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Search (weekday)", cohort: "weekday", latency: 28, acceptance: 84 },
  { period: "Draft (weekday)", cohort: "weekday", latency: 52, acceptance: 92 },
  { period: "Summarize (weekday)", cohort: "weekday", latency: 41, acceptance: 89 },
  { period: "Translate (weekday)", cohort: "weekday", latency: 65, acceptance: 95 },
  { period: "Search (weekend)", cohort: "weekend", latency: 35, acceptance: 80 },
  { period: "Draft (weekend)", cohort: "weekend", latency: 61, acceptance: 88 },
  { period: "Summarize (weekend)", cohort: "weekend", latency: 47, acceptance: 86 },
  { period: "Translate (weekend)", cohort: "weekend", latency: 76, acceptance: 93 },
];
const weekdayShape = "circle";
const weekendShape = "diamond";
const config = {
  weekday: { label: "Weekday", color: "#733bff", legendShape: weekdayShape },
  weekend: { label: "Weekend", color: "#07948b", legendShape: weekendShape },
} satisfies Chart.SeriesConfig;

export function TaskScatterChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(["weekday", "weekend"]);
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={setVisibleSeries}
    >
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ScatterChart
          loading={state === "loading"}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Task latency in milliseconds and acceptance percentage by cohort"
        >
          <Chart.CartesianGrid strokeDasharray="3 3" />
          <Chart.XAxis
            type="number"
            dataKey="latency"
            name="Latency (ms)"
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={64}
            interval="preserveStartEnd"
            minTickGap={48}
            label={{ value: "ms", position: "insideBottom", offset: 0 }}
          />
          <Chart.YAxis
            type="number"
            dataKey="acceptance"
            name="Acceptance"
            unit="%"
            domain={[70, 100]}
            ticks={[70, 80, 90, 100]}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={80}
          />
          <Chart.ScatterSeries
            seriesKey="weekday"
            name="Weekday"
            data={data.filter((row) => row.cohort === "weekday")}
            shape={weekdayShape}
          />
          <Chart.ScatterSeries
            seriesKey="weekend"
            name="Weekend"
            data={data.filter((row) => row.cohort === "weekend")}
            shape={weekendShape}
          />
          <Chart.ScatterTooltip<(typeof data)[number]> pointLabel={(row) => row.period} />
        </Chart.ScatterChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
