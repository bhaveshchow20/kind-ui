"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { location: "North", orders: 124 },
  { location: "East", orders: 186 },
  { location: "Central", orders: 238 },
  { location: "West", orders: 162 },
  { location: "South", orders: 208 },
];

const config = {
  orders: { label: "Orders", color: "#733bff" },
} satisfies SeriesConfig;

export default function OrdersChart() {
  return (
    <BarChart
      data={data}
      config={config}
      animate
      emphasis="category"
      aria-label="Weekly pickup orders by location"
    >
      <BarChart.Grid vertical={false} />
      <BarChart.XAxis dataKey="location" />
      <BarChart.YAxis width={40} />
      <BarChart.Series dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={48} />
      <BarChart.Tooltip />
      <BarChart.Legend />
    </BarChart>
  );
}
