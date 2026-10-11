"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Jan", desktop: 310, mobile: 110 },
  { period: "Feb", desktop: 380, mobile: 200 },
  { period: "Mar", desktop: 340, mobile: 170 },
  { period: "Apr", desktop: 460, mobile: 300 },
  { period: "May", desktop: 390, mobile: 290 },
  { period: "Jun", desktop: 520, mobile: 390 },
  { period: "Jul", desktop: 450, mobile: 390 },
  { period: "Aug", desktop: 580, mobile: 490 },
  { period: "Sep", desktop: 500, mobile: 460 },
  { period: "Oct", desktop: 610, mobile: 570 },
  { period: "Nov", desktop: 540, mobile: 570 },
  { period: "Dec", desktop: 650, mobile: 710 },
];
const config = {
  desktop: { label: "Desktop", color: "#733bff" },
  mobile: { label: "Mobile", color: "#14a39a" },
} satisfies Chart.SeriesConfig;

function DeviceAreaChartComposition() {
  return (
    <Chart.Root
      config={config}
      interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
    >
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.AreaChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Monthly visitors by device"
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
          <Chart.AreaSeries
            dataKey="desktop"
            stackId="visitors"
            type="monotone"
            strokeWidth={2}
            fillOpacity={0.35}
          />
          <Chart.AreaSeries
            dataKey="mobile"
            stackId="visitors"
            type="monotone"
            strokeWidth={2}
            fillOpacity={0.35}
          />
          <Chart.Tooltip />
        </Chart.AreaChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function DeviceAreaChart() {
  return (
    <div className="chart-example">
      <DeviceAreaChartComposition />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Stacked series data">
          <caption>{"Visitors by device"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Desktop"}</th><th scope="col">{"Mobile"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{310}</td><td>{110}</td></tr><tr><th scope="row">{"Feb"}</th><td>{380}</td><td>{200}</td></tr><tr><th scope="row">{"Mar"}</th><td>{340}</td><td>{170}</td></tr><tr><th scope="row">{"Apr"}</th><td>{460}</td><td>{300}</td></tr><tr><th scope="row">{"May"}</th><td>{390}</td><td>{290}</td></tr><tr><th scope="row">{"Jun"}</th><td>{520}</td><td>{390}</td></tr><tr><th scope="row">{"Jul"}</th><td>{450}</td><td>{390}</td></tr><tr><th scope="row">{"Aug"}</th><td>{580}</td><td>{490}</td></tr><tr><th scope="row">{"Sep"}</th><td>{500}</td><td>{460}</td></tr><tr><th scope="row">{"Oct"}</th><td>{610}</td><td>{570}</td></tr><tr><th scope="row">{"Nov"}</th><td>{540}</td><td>{570}</td></tr><tr><th scope="row">{"Dec"}</th><td>{650}</td><td>{710}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
