"use client";
import { LineChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies SeriesConfig;

export function MonthlyVisitorsChart() {
  return (
    <figure>
      <LineChart
        data={data}
        config={config}
        height={280}
        margin={{ top: 24, right: 32, bottom: 16, left: 0 }}
        aria-label="Monthly visitors"
      >
        <LineChart.Grid />
        <LineChart.XAxis dataKey="period" height={56} minTickGap={32} />
        <LineChart.YAxis width={60} />
        <LineChart.Series dataKey="visitors" type="monotone" strokeWidth={2} dot={{ r: 2.5 }} />
        <LineChart.Tooltip />
        <LineChart.Legend />
      </LineChart>
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
