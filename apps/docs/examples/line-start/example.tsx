"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies Chart.SeriesConfig;

export function MonthlyVisitorsChart() {
  return (
    <figure>
      <Chart.LineChart
        data={data}
        config={config}
        xDataKey="period"
        height={280}
        margin={{ top: 24, right: 32, bottom: 16, left: 0 }}
        xAxis={{ height: 56, minTickGap: 32 }}
        yAxis={{ width: 72 }}
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
