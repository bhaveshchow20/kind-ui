"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

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
} satisfies Chart.SeriesConfig;

function MaterialBubbleChartComposition({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
}) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ScatterChart
          animate
          accessibilityLayer
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Task latency in milliseconds, acceptance percentage and request volume in thousands"
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
          <Chart.ZAxis
            dataKey="requests"
            name="Requests"
            unit="k"
            domain={[0, 300]}
            range={[48, 1000]}
          />
          <Chart.ScatterSeries
            seriesKey="tasks"
            data={data}
            shape="circle"
            material={appearance === "default" ? undefined : appearance}
            fillOpacity={0.72}
          />
          <Chart.ScatterTooltip<(typeof data)[number]>
            pointLabel={(row) => row.period}
            zDimension={{ dataKey: "requests", name: "Requests", unit: "k" }}
          />
        </Chart.ScatterChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function MaterialBubbleChart(props: import("react").ComponentProps<typeof MaterialBubbleChartComposition>) {
  return (
    <div className="chart-example">
      <MaterialBubbleChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Materials data">
          <caption>{"Task latency, acceptance and request volume"}</caption>
          <thead><tr><th scope="col">{"Task"}</th><th scope="col">{"Latency (ms)"}</th><th scope="col">{"Acceptance (%)"}</th><th scope="col">{"Requests (k; blank means missing)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Search"}</th><td>{28}</td><td>{84}</td><td>{260}</td></tr><tr><th scope="row">{"Draft"}</th><td>{52}</td><td>{92}</td><td>{180}</td></tr><tr><th scope="row">{"Summarize"}</th><td>{41}</td><td>{89}</td><td>{120}</td></tr><tr><th scope="row">{"Translate"}</th><td>{65}</td><td>{95}</td><td>{75}</td></tr><tr><th scope="row">{"Classify"}</th><td>{19}</td><td>{81}</td><td>{0}</td></tr><tr><th scope="row">{"Extract"}</th><td>{73}</td><td>{88}</td><td>{null}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
