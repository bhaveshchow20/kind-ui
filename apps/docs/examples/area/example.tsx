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

export function VisitorAreaChart() {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.AreaChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Monthly visitors"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            height={48}
            interval="preserveStartEnd"
          />
          <Chart.YAxis axisLine={false} tickLine={false} tickMargin={8} width={72} />
          <Chart.AreaSeries dataKey="visitors" type="monotone" strokeWidth={2} fillOpacity={0.22} />
          <Chart.Tooltip />
        </Chart.AreaChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
