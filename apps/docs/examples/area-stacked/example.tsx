"use client";
import { AreaChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Jan", desktop: 310, mobile: 110 },
  { period: "Feb", desktop: 380, mobile: 200 },
  { period: "Mar", desktop: 340, mobile: 170 },
  { period: "Apr", desktop: 460, mobile: 300 },
  { period: "May", desktop: 390, mobile: 290 },
  { period: "Jun", desktop: 520, mobile: 390 },
  { period: "Jul", desktop: 450, mobile: 390 },
  { period: "Aug", desktop: 580, mobile: 490 },
  { period: "Sep", desktop: 500, mobile: 460 },
  { period: "Oct", desktop: 610, mobile: 570 },
  { period: "Nov", desktop: 540, mobile: 570 },
  { period: "Dec", desktop: 650, mobile: 710 },
];
const config = {
  desktop: { label: "Desktop", color: "#733bff" },
  mobile: { label: "Mobile", color: "#14a39a" },
} satisfies SeriesConfig;

export function DeviceAreaChart() {
  return (
    <>
      <>
        <AreaChart
          legendPosition="top"
          config={config}
          interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
          width="100%"
          height={280}
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
          aria-label="Monthly visitors by device"
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
          <AreaChart.Series
            dataKey="desktop"
            stackId="visitors"
            type="monotone"
            strokeWidth={2}
            fillOpacity={0.35}
          />
          <AreaChart.Series
            dataKey="mobile"
            stackId="visitors"
            type="monotone"
            strokeWidth={2}
            fillOpacity={0.35}
          />
          <AreaChart.Tooltip />
          <AreaChart.Legend />
        </AreaChart>
      </>
    </>
  );
}
