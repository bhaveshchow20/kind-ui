"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

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
} satisfies Chart.SeriesConfig;

export function MaterialLineChart({
  material = "paper",
}: {
  material?: "plain" | "paper" | "clay" | "glow";
} = {}) {
  return (
    <Chart.LineChart
      data={data}
      config={config}
      legend={{}}
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      aria-label="Monthly visitors"
    >
      <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
      <Chart.XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tickMargin={12}
        height={48}
        interval="preserveStartEnd"
      />
      <Chart.YAxis axisLine={false} tickLine={false} tickMargin={12} width={88} />
      <Chart.LineSeries
        dataKey="visitors"
        type="monotone"
        material={material}
        strokeWidth={2}
        dot={{ r: 2.5 }}
      />
      <Chart.Tooltip />
    </Chart.LineChart>
  );
}
