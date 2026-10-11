"use client";
import { ScatterChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Search", latency: 28, acceptance: 84, requests: 260 },
  { period: "Draft", latency: 52, acceptance: 92, requests: 180 },
  { period: "Summarize", latency: 41, acceptance: 89, requests: 120 },
  { period: "Translate", latency: 65, acceptance: 95, requests: 75 },
  { period: "Classify", latency: 19, acceptance: 81, requests: 0 },
  { period: "Extract", latency: 73, acceptance: 88, requests: null },
];
const config = {
  tasks: { label: "Tasks", color: "#733bff", legendShape: "circle" },
} satisfies SeriesConfig;

export function TaskBubbleChart() {
  return (
    <>
      <>
        <ScatterChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Task latency in milliseconds, acceptance percentage and request volume in thousands"
        >
          <ScatterChart.Grid vertical strokeDasharray="3 3" stroke="#ccc" />
          <ScatterChart.XAxis
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
            tick={{ fill: "#666" }}
          />
          <ScatterChart.YAxis
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
            tick={{ fill: "#666" }}
          />
          <ScatterChart.ZAxis
            dataKey="requests"
            name="Requests"
            unit="k"
            domain={[0, 300]}
            range={[48, 1000]}
          />
          <ScatterChart.Series seriesKey="tasks" data={data} shape="circle" fillOpacity={0.72} />
          <ScatterChart.Tooltip<(typeof data)[number]>
            pointLabel={(row) => row.period}
            zDimension={{ dataKey: "requests", name: "Requests", unit: "k" }}
          />
          <ScatterChart.Legend />
        </ScatterChart>
      </>
    </>
  );
}
