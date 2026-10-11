"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Jan", retail: 42000, wholesale: 26000, margin: 18 },
  { period: "Feb", retail: 47000, wholesale: 28000, margin: 20 },
  { period: "Mar", retail: 44000, wholesale: 34000, margin: 19 },
  { period: "Apr", retail: 52000, wholesale: 31000, margin: 23 },
  { period: "May", retail: 58000, wholesale: 36000, margin: 25 },
  { period: "Jun", retail: 63000, wholesale: 39000, margin: 27 },
];
const dollars = (value: Chart.TooltipValueType) =>
  typeof value === "number" ? `$${value.toLocaleString("en-US")}` : String(value);
const config = {
  retail: { label: "Retail · USD", color: "#733bff", formatValue: dollars },
  wholesale: { label: "Wholesale · USD", color: "#b2a0ef", formatValue: dollars },
  margin: { label: "Margin · %", color: "#087f78", formatValue: (value) => `${value}%` },
} satisfies Chart.SeriesConfig;

function RevenueMarginChartComposition() {
  return (
    <Chart.Root
      config={config}
      interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
    >
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ComboChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 0, bottom: 8, left: 16 }}
          aria-label="Stacked monthly revenue in US dollars, with margin percentage on the right axis"
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
            yAxisId="revenue"
            domain={[0, 120000]}
            ticks={[0, 40000, 80000, 120000]}
            tickFormatter={(value: number) => `$${value / 1000}k`}
            width={96}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.YAxis
            yAxisId="margin"
            orientation="right"
            domain={[0, 40]}
            ticks={[0, 10, 20, 30, 40]}
            tickFormatter={(value: number) => `${value}%`}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.BarSeries dataKey="retail" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
          <Chart.BarSeries
            dataKey="wholesale"
            yAxisId="revenue"
            stackId="revenue"
            maxBarSize={32}
          />
          <Chart.LineSeries
            dataKey="margin"
            yAxisId="margin"
            type="linear"
            strokeWidth={2.5}
            dot={false}
          />
          <Chart.Tooltip maxWidth={200} />
        </Chart.ComboChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function RevenueMarginChart() {
  return (
    <div className="chart-example">
      <RevenueMarginChartComposition />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Revenue and margin data">
          <caption>{"Monthly revenue and margin"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Retail (USD)"}</th><th scope="col">{"Wholesale (USD)"}</th><th scope="col">{"Margin (%)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{42000}</td><td>{26000}</td><td>{18}</td></tr><tr><th scope="row">{"Feb"}</th><td>{47000}</td><td>{28000}</td><td>{20}</td></tr><tr><th scope="row">{"Mar"}</th><td>{44000}</td><td>{34000}</td><td>{19}</td></tr><tr><th scope="row">{"Apr"}</th><td>{52000}</td><td>{31000}</td><td>{23}</td></tr><tr><th scope="row">{"May"}</th><td>{58000}</td><td>{36000}</td><td>{25}</td></tr><tr><th scope="row">{"Jun"}</th><td>{63000}</td><td>{39000}</td><td>{27}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
