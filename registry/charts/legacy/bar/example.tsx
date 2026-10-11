"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "North", orders: 124 },
  { period: "East", orders: 186 },
  { period: "Central", orders: 238 },
  { period: "West", orders: 162 },
  { period: "South", orders: 208 },
];
const config = {
  orders: { label: "Orders", color: "#733bff" },
} satisfies Chart.SeriesConfig;

function PickupOrdersChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BarChart
          loading={state === "loading"}
          data={data}
          animate
          accessibilityLayer
          emphasis="category"
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Weekly pickup orders by location"
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
          <Chart.BarSeries dataKey="orders" radius={[5, 5, 0, 0]} maxBarSize={48} />
          <Chart.Tooltip />
        </Chart.BarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function PickupOrdersChart(props: import("react").ComponentProps<typeof PickupOrdersChartComposition>) {
  return (
    <div className="chart-example">
      <PickupOrdersChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Bar Chart data">
          <caption>{"Weekly pickup orders"}</caption>
          <thead><tr><th scope="col">{"Location"}</th><th scope="col">{"Orders"}</th></tr></thead>
          <tbody><tr><th scope="row">{"North"}</th><td>{124}</td></tr><tr><th scope="row">{"East"}</th><td>{186}</td></tr><tr><th scope="row">{"Central"}</th><td>{238}</td></tr><tr><th scope="row">{"West"}</th><td>{162}</td></tr><tr><th scope="row">{"South"}</th><td>{208}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
