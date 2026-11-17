"use client";

import { BoxPlotChart, type BoxPlotSummary, type SeriesConfig } from "@kind-ui/charts";

type Row = { page: string; summary: BoxPlotSummary | null };

const data: Row[] = [
  {
    page: "Search",
    summary: { lowerWhisker: 18, q1: 32, median: 44, q3: 61, upperWhisker: 84, outliers: [112] },
  },
  {
    page: "Checkout",
    summary: { lowerWhisker: 26, q1: 46, median: 68, q3: 88, upperWhisker: 126, outliers: [154] },
  },
  {
    page: "Profile",
    summary: { lowerWhisker: 12, q1: 22, median: 31, q3: 46, upperWhisker: 72, outliers: [98] },
  },
];

const config = {
  latency: { label: "Response time", color: "#733bff" },
} satisfies SeriesConfig;

export default function ResponseTimeBoxPlot() {
  return (
    <BoxPlotChart
      data={data}
      config={config}
      animate
      aria-label="Response times by page, in milliseconds"
    >
      <BoxPlotChart.Grid vertical={false} />
      <BoxPlotChart.XAxis dataKey="page" />
      <BoxPlotChart.YAxis width={40} domain={[0, 180]} />
      <BoxPlotChart.Series<Row> dataKey="summary" seriesKey="latency" barSize={32} />
      <BoxPlotChart.Tooltip
        formatter={(_value, _name, entry) => [`${entry.payload.summary.median} ms`, "Median"]}
      />
      <BoxPlotChart.Legend />
    </BoxPlotChart>
  );
}
