"use client";

import { ScatterChart, type SeriesConfig } from "@kind-ui/charts";

const weekday = [
  { task: "Search", latency: 28, acceptance: 84 },
  { task: "Draft", latency: 52, acceptance: 92 },
  { task: "Summarize", latency: 41, acceptance: 89 },
  { task: "Translate", latency: 65, acceptance: 95 },
];
const weekend = [
  { task: "Search", latency: 35, acceptance: 80 },
  { task: "Draft", latency: 61, acceptance: 88 },
  { task: "Summarize", latency: 47, acceptance: 86 },
  { task: "Translate", latency: 76, acceptance: 93 },
];

const config = {
  weekday: { label: "Weekday", color: "#733bff", legendShape: "circle" },
  weekend: { label: "Weekend", color: "#0f8b8d", legendShape: "diamond" },
} satisfies SeriesConfig;

export default function LatencyChart() {
  return (
    <ScatterChart
      config={config}
      height={280}
      margin={{ top: 8, right: 16 }}
      aria-label="Task latency in milliseconds against acceptance rate, weekday and weekend"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis
        type="number"
        dataKey="latency"
        name="Latency"
        unit=" ms"
        domain={[0, 100]}
      />
      <ScatterChart.YAxis
        type="number"
        dataKey="acceptance"
        name="Acceptance"
        unit="%"
        domain={[70, 100]}
        ticks={[70, 80, 90, 100]}
        width={48}
      />
      <ScatterChart.Series seriesKey="weekday" data={weekday} shape="circle" />
      <ScatterChart.Series seriesKey="weekend" data={weekend} shape="diamond" />
      <ScatterChart.Tooltip<(typeof weekday)[number]> pointLabel={(row) => row.task} />
      <ScatterChart.Legend />
    </ScatterChart>
  );
}
