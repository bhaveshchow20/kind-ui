"use client";
import { AreaChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
  { period: "May", visitors: 680 },
  { period: "Jun", visitors: 910 },
  { period: "Jul", visitors: 840 },
  { period: "Aug", visitors: 1070 },
  { period: "Sep", visitors: 960 },
  { period: "Oct", visitors: 1180 },
  { period: "Nov", visitors: 1110 },
  { period: "Dec", visitors: 1360 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies SeriesConfig;

export function VisitorAreaCurveChart({
  curve = "monotone",
}: {
  curve?: "monotone" | "linear" | "stepAfter";
} = {}) {
  return (
    <>
      <>
        <AreaChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Monthly visitors"
        >
          <AreaChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
          <AreaChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            height={48}
            interval="preserveStartEnd"
            tick={{ fill: "#666" }}
          />
          <AreaChart.YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: "#666" }}
          />
          <AreaChart.Series dataKey="visitors" type={curve} strokeWidth={2} fillOpacity={0.22} />
          <AreaChart.Tooltip />
          <AreaChart.Legend />
        </AreaChart>
      </>
    </>
  );
}
