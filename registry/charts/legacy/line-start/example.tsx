"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies Chart.SeriesConfig;

function MonthlyVisitorsChartComposition() {
  return (
    <figure>
      <Chart.LineChart
        data={data}
        config={config}
        xDataKey="period"
        height={280}
        margin={{ top: 24, right: 32, bottom: 16, left: 0 }}
        xAxis={{ height: 56, minTickGap: 32 }}
        yAxis={{ width: 60 }}
        aria-label="Monthly visitors"
      />
      <figcaption
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        January: 420 visitors. February: 580. March: 510. April: 760.
      </figcaption>
    </figure>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function MonthlyVisitorsChart() {
  return (
    <div className="chart-example">
      <MonthlyVisitorsChartComposition />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Monthly visitors data">
          <caption>{"Monthly visitors"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Visitors"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{420}</td></tr><tr><th scope="row">{"Feb"}</th><td>{580}</td></tr><tr><th scope="row">{"Mar"}</th><td>{510}</td></tr><tr><th scope="row">{"Apr"}</th><td>{760}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
