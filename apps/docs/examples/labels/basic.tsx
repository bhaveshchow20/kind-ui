"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", orders: 182 },
  { month: "Feb", orders: 205 },
  { month: "Mar", orders: 194 },
  { month: "Apr", orders: 248 },
  { month: "May", orders: 231 },
  { month: "Jun", orders: 296 },
];

const config = {
  orders: { label: "Orders", color: "#94a3b8" },
} satisfies SeriesConfig;

export default function OrdersChart() {
  return (
    <BarChart data={data} config={config} margin={{ top: 20 }} aria-label="Monthly orders">
      <BarChart.XAxis dataKey="month" />
      <BarChart.Series dataKey="orders" radius={4}>
        {data.map((row) => (
          <BarChart.Cell key={row.month} fill={row.month === "Jun" ? "#733bff" : "#94a3b8"} />
        ))}
        <BarChart.Labels dataKey="orders" position="top" offset={6} fontSize={12} />
      </BarChart.Series>
    </BarChart>
  );
}
