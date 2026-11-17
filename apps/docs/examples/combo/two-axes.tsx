"use client";

import { ComboChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", retail: 42000, wholesale: 26000, margin: 18 },
  { month: "Feb", retail: 47000, wholesale: 28000, margin: 20 },
  { month: "Mar", retail: 44000, wholesale: 34000, margin: 19 },
  { month: "Apr", retail: 52000, wholesale: 31000, margin: 23 },
  { month: "May", retail: 58000, wholesale: 36000, margin: 25 },
  { month: "Jun", retail: 63000, wholesale: 39000, margin: 27 },
];

const dollars = (value: unknown) => `$${Number(value).toLocaleString("en-US")}`;
const compactDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
});

const config = {
  retail: { label: "Retail", color: "#733bff", formatValue: dollars },
  wholesale: { label: "Wholesale", color: "#b2a0ef", formatValue: dollars },
  margin: { label: "Margin", color: "#0f8b8d", formatValue: (value) => `${value}%` },
} satisfies SeriesConfig;

export default function RevenueMarginChart() {
  return (
    <ComboChart
      data={data}
      config={config}
      animate
      aria-label="Monthly revenue by channel in US dollars, with margin percentage on the right axis"
    >
      <ComboChart.Grid />
      <ComboChart.XAxis dataKey="month" />
      <ComboChart.YAxis yAxisId="revenue" width={48} tickFormatter={compactDollars.format} />
      <ComboChart.YAxis
        yAxisId="margin"
        orientation="right"
        width={40}
        domain={[0, 40]}
        tickFormatter={(value: number) => `${value}%`}
      />
      <ComboChart.Bar dataKey="retail" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
      <ComboChart.Bar dataKey="wholesale" yAxisId="revenue" stackId="revenue" maxBarSize={32} />
      <ComboChart.Line dataKey="margin" yAxisId="margin" strokeWidth={2} dot={false} />
      <ComboChart.Tooltip />
      <ComboChart.Legend />
    </ComboChart>
  );
}
