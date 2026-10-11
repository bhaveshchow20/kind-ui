"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
  { period: "May", visitors: 680 },
  { period: "Jun", visitors: 910 },
  { period: "Jul", visitors: 840 },
  { period: "Aug", visitors: 1070 },
  { period: "Sep", visitors: 960 },
  { period: "Oct", visitors: 1180 },
  { period: "Nov", visitors: 1110 },
  { period: "Dec", visitors: 1360 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies Chart.SeriesConfig;

function VisitorAreaChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.AreaChart
          loading={state === "loading"}
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Monthly visitors"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            height={48}
            interval="preserveStartEnd"
          />
          <Chart.YAxis axisLine={false} tickLine={false} tickMargin={8} width={72} />
          <Chart.AreaSeries dataKey="visitors" type="monotone" strokeWidth={2} fillOpacity={0.22} />
          <Chart.Tooltip />
        </Chart.AreaChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function VisitorAreaChart(props: import("react").ComponentProps<typeof VisitorAreaChartComposition>) {
  return (
    <div className="chart-example">
      <VisitorAreaChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Area Chart data">
          <caption>{"Visitors"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Visitors"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{420}</td></tr><tr><th scope="row">{"Feb"}</th><td>{580}</td></tr><tr><th scope="row">{"Mar"}</th><td>{510}</td></tr><tr><th scope="row">{"Apr"}</th><td>{760}</td></tr><tr><th scope="row">{"May"}</th><td>{680}</td></tr><tr><th scope="row">{"Jun"}</th><td>{910}</td></tr><tr><th scope="row">{"Jul"}</th><td>{840}</td></tr><tr><th scope="row">{"Aug"}</th><td>{1070}</td></tr><tr><th scope="row">{"Sep"}</th><td>{960}</td></tr><tr><th scope="row">{"Oct"}</th><td>{1180}</td></tr><tr><th scope="row">{"Nov"}</th><td>{1110}</td></tr><tr><th scope="row">{"Dec"}</th><td>{1360}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
