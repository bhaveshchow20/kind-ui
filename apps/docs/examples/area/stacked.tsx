"use client";

import { AreaChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", desktop: 310, mobile: 110 },
  { month: "Feb", desktop: 380, mobile: 200 },
  { month: "Mar", desktop: 340, mobile: 170 },
  { month: "Apr", desktop: 460, mobile: 300 },
  { month: "May", desktop: 390, mobile: 290 },
  { month: "Jun", desktop: 520, mobile: 390 },
  { month: "Jul", desktop: 450, mobile: 390 },
  { month: "Aug", desktop: 580, mobile: 490 },
  { month: "Sep", desktop: 500, mobile: 460 },
  { month: "Oct", desktop: 610, mobile: 570 },
  { month: "Nov", desktop: 540, mobile: 570 },
  { month: "Dec", desktop: 650, mobile: 710 },
];

const config = {
  desktop: { label: "Desktop", color: "#733bff" },
  mobile: { label: "Mobile", color: "#14a39a" },
} satisfies SeriesConfig;

export default function DeviceChart() {
  return (
    <AreaChart
      data={data}
      config={config}
      animate
      margin={{ right: 16 }}
      aria-label="Monthly visitors by device"
    >
      <AreaChart.Grid />
      <AreaChart.XAxis dataKey="month" />
      <AreaChart.YAxis width={40} />
      <AreaChart.Series dataKey="desktop" stackId="visitors" type="monotone" fillOpacity={0.35} />
      <AreaChart.Series dataKey="mobile" stackId="visitors" type="monotone" fillOpacity={0.35} />
      <AreaChart.Tooltip />
      <AreaChart.Legend />
    </AreaChart>
  );
}
