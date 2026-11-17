"use client";

import { ScatterChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { task: "Search", latency: 28, acceptance: 84, requests: 260 },
  { task: "Draft", latency: 52, acceptance: 92, requests: 180 },
  { task: "Summarize", latency: 41, acceptance: 89, requests: 120 },
  { task: "Translate", latency: 65, acceptance: 95, requests: 75 },
  { task: "Classify", latency: 19, acceptance: 81, requests: 0 },
  { task: "Extract", latency: 73, acceptance: 88, requests: null },
];

const config = {
  tasks: { label: "Tasks", color: "#733bff" },
} satisfies SeriesConfig;

export default function RequestsChart() {
  return (
    <ScatterChart
      config={config}
      height={280}
      margin={{ top: 8, right: 16 }}
      aria-label="Task latency, acceptance rate and requests in thousands"
    >
      <ScatterChart.Grid />
      <ScatterChart.XAxis dataKey="latency" name="Latency" unit=" ms" domain={[0, 100]} />
      <ScatterChart.YAxis
        dataKey="acceptance"
        name="Acceptance"
        unit="%"
        domain={[70, 100]}
        ticks={[70, 80, 90, 100]}
        width={48}
      />
      <ScatterChart.ZAxis
        dataKey="requests"
        name="Requests"
        unit="k"
        domain={[0, 300]}
        range={[48, 1000]}
      />
      <ScatterChart.Series seriesKey="tasks" data={data} fillOpacity={0.72} />
      <ScatterChart.Tooltip<(typeof data)[number]>
        pointLabel={(row) => row.task}
        zDimension={{ dataKey: "requests", name: "Requests", unit: "k" }}
      />
    </ScatterChart>
  );
}
