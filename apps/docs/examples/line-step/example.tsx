"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "1", seats: 24 },
  { period: "2", seats: 24 },
  { period: "3", seats: 36 },
  { period: "4", seats: 36 },
  { period: "5", seats: 36 },
  { period: "6", seats: 48 },
  { period: "7", seats: 48 },
  { period: "8", seats: 60 },
];
const config = {
  seats: {
    label: "Allocated seats",
    color: "#733bff",
  },
} satisfies Chart.SeriesConfig;

export function Example() {
  return (
    <Chart.LineChart
      data={data}
      config={config}
      xDataKey="period"
      aria-label="Allocated seats by day"
      curve="stepAfter"
    />
  );
}
