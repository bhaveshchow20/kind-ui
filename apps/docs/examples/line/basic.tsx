"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", visitors: 420 },
  { month: "Feb", visitors: 580 },
  { month: "Mar", visitors: 510 },
  { month: "Apr", visitors: 760 },
  { month: "May", visitors: 680 },
  { month: "Jun", visitors: 910 },
  { month: "Jul", visitors: 840 },
  { month: "Aug", visitors: 1070 },
  { month: "Sep", visitors: 960 },
  { month: "Oct", visitors: 1180 },
  { month: "Nov", visitors: 1110 },
  { month: "Dec", visitors: 1360 },
];

const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies SeriesConfig;

export default function VisitorsChart() {
  return (
    <LineChart data={data} config={config} margin={{ right: 16 }} aria-label="Monthly visitors">
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis width={40} />
      <LineChart.Series dataKey="visitors" type="monotone" strokeWidth={2} />
      <LineChart.Tooltip />
      <LineChart.Legend />
    </LineChart>
  );
}
