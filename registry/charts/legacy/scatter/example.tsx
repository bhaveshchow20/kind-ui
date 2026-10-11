"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

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

function TaskScatterChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root
      config={config}
      interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
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

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function TaskScatterChart(props: import("react").ComponentProps<typeof TaskScatterChartComposition>) {
  return (
    <div className="chart-example">
      <TaskScatterChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Scatter Chart data">
          <caption>{"Task latency and acceptance by cohort"}</caption>
          <thead><tr><th scope="col">{"Task"}</th><th scope="col">{"Cohort"}</th><th scope="col">{"Latency (ms)"}</th><th scope="col">{"Acceptance (%)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Search (weekday)"}</th><td>{"weekday"}</td><td>{28}</td><td>{84}</td></tr><tr><th scope="row">{"Draft (weekday)"}</th><td>{"weekday"}</td><td>{52}</td><td>{92}</td></tr><tr><th scope="row">{"Summarize (weekday)"}</th><td>{"weekday"}</td><td>{41}</td><td>{89}</td></tr><tr><th scope="row">{"Translate (weekday)"}</th><td>{"weekday"}</td><td>{65}</td><td>{95}</td></tr><tr><th scope="row">{"Search (weekend)"}</th><td>{"weekend"}</td><td>{35}</td><td>{80}</td></tr><tr><th scope="row">{"Draft (weekend)"}</th><td>{"weekend"}</td><td>{61}</td><td>{88}</td></tr><tr><th scope="row">{"Summarize (weekend)"}</th><td>{"weekend"}</td><td>{47}</td><td>{86}</td></tr><tr><th scope="row">{"Translate (weekend)"}</th><td>{"weekend"}</td><td>{76}</td><td>{93}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
