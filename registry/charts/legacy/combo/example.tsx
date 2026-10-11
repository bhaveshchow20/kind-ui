"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Jan", capacity: 960, shipped: 640, target: 700 },
  { period: "Feb", capacity: 960, shipped: 730, target: 720 },
  { period: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { period: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { period: "May", capacity: 1120, shipped: 920, target: 880 },
  { period: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];
const config = {
  capacity: {
    label: "Capacity · units",
    color: "#b2a0ef",
    formatValue: (value) => `${value} units`,
  },
  shipped: { label: "Shipped · units", color: "#733bff", formatValue: (value) => `${value} units` },
  target: { label: "Target · units", color: "#087f78", formatValue: (value) => `${value} units` },
} satisfies Chart.SeriesConfig;

function ProductionComboChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ComboChart
          loading={state === "loading"}
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 20, bottom: 8, left: 16 }}
          aria-label="Monthly production, capacity and target in units"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
          />
          <Chart.YAxis
            domain={[0, 1200]}
            ticks={[0, 400, 800, 1200]}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.AreaSeries
            dataKey="capacity"
            type="stepAfter"
            fillOpacity={0.18}
            strokeWidth={1}
          />
          <Chart.BarSeries dataKey="shipped" maxBarSize={32} radius={[4, 4, 0, 0]} />
          <Chart.LineSeries
            dataKey="target"
            type="linear"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
          />
          <Chart.Tooltip maxWidth={200} />
        </Chart.ComboChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function ProductionComboChart(props: import("react").ComponentProps<typeof ProductionComboChartComposition>) {
  return (
    <div className="chart-example">
      <ProductionComboChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Production and capacity data">
          <caption>{"Monthly production in units"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Capacity (units)"}</th><th scope="col">{"Shipped (units)"}</th><th scope="col">{"Target (units)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{960}</td><td>{640}</td><td>{700}</td></tr><tr><th scope="row">{"Feb"}</th><td>{960}</td><td>{730}</td><td>{720}</td></tr><tr><th scope="row">{"Mar"}</th><td>{1040}</td><td>{780}</td><td>{760}</td></tr><tr><th scope="row">{"Apr"}</th><td>{1040}</td><td>{860}</td><td>{820}</td></tr><tr><th scope="row">{"May"}</th><td>{1120}</td><td>{920}</td><td>{880}</td></tr><tr><th scope="row">{"Jun"}</th><td>{1120}</td><td>{1020}</td><td>{960}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
