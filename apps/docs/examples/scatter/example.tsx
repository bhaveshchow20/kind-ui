"use client";
import { ScatterChart, type SeriesConfig } from "@kind-ui/charts";

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
} satisfies SeriesConfig;

export function TaskScatterChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <ScatterChart
      config={config}
      height={280}
      legendPosition="top"
      loading={state === "loading"}
      animate
      accessibilityLayer
      margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
      aria-label="Task latency in milliseconds and acceptance percentage by cohort"
      interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
    >
      <ScatterChart.Grid vertical stroke="#ccc" strokeDasharray="3 3" />
      <ScatterChart.XAxis
        tick={{ fill: "#666" }}
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
      <ScatterChart.YAxis
        tick={{ fill: "#666" }}
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
      <ScatterChart.Series
        seriesKey="weekday"
        name="Weekday"
        data={data.filter((row) => row.cohort === "weekday")}
        shape={weekdayShape}
      />
      <ScatterChart.Series
        seriesKey="weekend"
        name="Weekend"
        data={data.filter((row) => row.cohort === "weekend")}
        shape={weekendShape}
      />
      <ScatterChart.Tooltip<(typeof data)[number]> pointLabel={(row) => row.period} />
      <ScatterChart.Legend />
    </ScatterChart>
  );
}
