"use client";

import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { subject: "Fiction", print: 184, digital: 116 },
  { subject: "History", print: 128, digital: 72 },
  { subject: "Science", print: 156, digital: 104 },
  { subject: "Arts", print: 112, digital: 88 },
  { subject: "Travel", print: 96, digital: 64 },
];

const config = {
  print: { label: "Print", color: "#733bff" },
  digital: { label: "Digital", color: "#14a39a" },
} satisfies SeriesConfig;

export default function LoansChart() {
  return (
    <BarChart data={data} config={config} animate aria-label="Library loans by subject and format">
      <BarChart.Grid vertical={false} />
      <BarChart.XAxis dataKey="subject" />
      <BarChart.YAxis width={40} />
      <BarChart.Series dataKey="print" maxBarSize={32} />
      <BarChart.Series dataKey="digital" maxBarSize={32} />
      <BarChart.Tooltip />
      <BarChart.Legend />
    </BarChart>
  );
}
