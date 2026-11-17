"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { day: "Mon", pickup: 24, delivery: 41 },
  { day: "Tue", pickup: 30, delivery: 38 },
  { day: "Wed", pickup: 27, delivery: 45 },
  { day: "Thu", pickup: 35, delivery: 52 },
  { day: "Fri", pickup: 42, delivery: 61 },
];

const config = {
  pickup: { label: "Pickup", color: "#0f8b8d" },
  delivery: { label: "Delivery", color: "#733bff" },
} satisfies SeriesConfig;

export default function OrdersChart() {
  return (
    <BarChart
      data={data}
      config={config}
      height={240}
      interaction={{
        kind: "series",
        eligibleKeys: Object.keys(config),
        defaultSelected: "delivery",
      }}
      legendPosition="top"
      aria-label="Daily orders by fulfillment"
    >
      <BarChart.Grid />
      <BarChart.XAxis dataKey="day" />
      <BarChart.YAxis width={32} />
      <BarChart.Series dataKey="pickup" />
      <BarChart.Series dataKey="delivery" />
      <BarChart.Tooltip />
      <BarChart.Legend />
    </BarChart>
  );
}
