"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
];
const config = { visitors: { label: "Visitors", color: "#733bff" } } satisfies Chart.SeriesConfig;

export function LinePresentationChart({
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
