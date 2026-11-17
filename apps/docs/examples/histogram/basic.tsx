"use client";

import { binHistogram, HistogramChart, type SeriesConfig } from "@kind-ui/charts";

const responseTimes = [
  12, 18, 23, 25, 27, 30, 31, 32, 34, 35, 36, 38, 40, 42, 43, 45, 47, 49, 50, 52, 55, 58, 60, 63,
  66, 70, 74, 80, 88, 95, 100, 110, 125, 150, 180, 200,
];

const { bins } = binHistogram(responseTimes, [0, 40, 80, 120, 160, 200]);

const config = {
  count: { label: "Requests", color: "#733bff" },
} satisfies SeriesConfig;

export default function ResponseTimeHistogram() {
  return (
    <HistogramChart
      bins={bins}
      measure="count"
      config={config}
      animate
      margin={{ right: 16 }}
      aria-label="Checkout response times, requests per 40 ms interval"
    >
      <HistogramChart.Grid vertical={false} />
      <HistogramChart.XAxis ticks={[0, 40, 80, 120, 160, 200]} tickFormatter={(ms) => `${ms} ms`} />
      <HistogramChart.YAxis width={40} allowDecimals={false} />
      <HistogramChart.Series />
      <HistogramChart.Tooltip
        labelFormatter={(_label, [entry]) => `${entry?.payload.lower}–${entry?.payload.upper} ms`}
      />
    </HistogramChart>
  );
}
