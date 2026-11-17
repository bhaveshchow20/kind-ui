"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { quarter: "Q1", print: 32, digital: 48 },
  { quarter: "Q2", print: 28, digital: 56 },
  { quarter: "Q3", print: 30, digital: 61 },
  { quarter: "Q4", print: 26, digital: 70 },
];

const config = {
  print: { label: "Print", color: "#e07a2f" },
  digital: { label: "Digital", color: "#733bff" },
} satisfies SeriesConfig;

export default function LoansChart() {
  return (
    <BarChart data={data} config={config} aria-label="Library loans by quarter, in thousands">
      <BarChart.Grid />
      <BarChart.XAxis dataKey="quarter" />
      <BarChart.YAxis width={40} />
      <BarChart.Series dataKey="print" material="clay" radius={6} />
      <BarChart.Series dataKey="digital" material="clay" radius={6} />
      <BarChart.Tooltip />
      <BarChart.Legend />
    </BarChart>
  );
}
