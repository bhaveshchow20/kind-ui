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
const config = { visitors: { label: "Visitors", color: "#733bff" } } satisfies Chart.SeriesConfig;

function LinePresentationChartComposition({
  presentation = "markers",
}: {
  presentation?: "markers" | "dashes" | "reveal" | "background";
}) {
  return (
    <Chart.LineChart
      key={presentation}
      data={data}
      config={config}
      xDataKey="period"
      aria-label="Monthly visitors"
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      animate={{ revealDirection: presentation === "reveal" ? "center-out" : "left-to-right" }}
      backgroundPattern={presentation === "background" ? { pattern: "crossings" } : undefined}
      series={[
        {
          seriesKey: "visitors",
          dataKey: "visitors",
          pointStyle: presentation === "markers" ? "colored-border" : undefined,
          activePointStyle: "border",
          strokeDasharray: presentation === "dashes" ? "6 4" : undefined,
          dashAnimation: presentation === "dashes" ? { durationMs: 1000 } : false,
        },
      ]}
    />
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function LinePresentationChart(props: import("react").ComponentProps<typeof LinePresentationChartComposition>) {
  return (
    <div className="chart-example">
      <LinePresentationChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Line presentation data">
          <caption>{"Visitors"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Visitors"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{420}</td></tr><tr><th scope="row">{"Feb"}</th><td>{580}</td></tr><tr><th scope="row">{"Mar"}</th><td>{510}</td></tr><tr><th scope="row">{"Apr"}</th><td>{760}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
