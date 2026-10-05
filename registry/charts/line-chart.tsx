"use client";

import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import "@kind-ui/charts/styles.css";
import "./kind-chart.css";

export type LineChartDatum = { period: string; current: number; previous: number };
export const lineChartData: LineChartDatum[] = [
  { period: "Jan", current: 38, previous: 24 },
  { period: "Feb", current: 52, previous: 33 },
  { period: "Mar", current: 45, previous: 30 },
  { period: "Apr", current: 68, previous: 47 },
  { period: "May", current: 61, previous: 42 },
  { period: "Jun", current: 84, previous: 59 },
];
const config = {
  current: { label: "This year", color: "var(--kind-recipe-1)" },
  previous: { label: "Last year", color: "var(--kind-recipe-2)" },
} satisfies Chart.SeriesConfig;

/** Editable presentation; chart inspection, visibility and motion come from Kind UI. */
export function KindLineChart({ data = lineChartData }: { data?: LineChartDatum[] }) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(Object.keys(config));
  return (
    <Card className="kind-recipe kind-recipe-line">
      <CardHeader>
        <p className="kind-recipe-eyebrow">THE BIG PICTURE</p>
        <CardTitle>Revenue momentum</CardTitle>
        <CardDescription>A clear view of the rhythm behind your revenue.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="kind-recipe-metric">
          {data.reduce((sum, row) => sum + row.current, 0).toLocaleString()}
          <span> thousand USD · this year</span>
        </p>
        <Chart.Root
          config={config}
          visibleSeries={visibleSeries}
          onVisibleSeriesChange={setVisibleSeries}
        >
          <Chart.Legend aria-label="Choose visible revenue momentum series" />
          <div className="kind-recipe-plot">
            <Chart.ResponsiveContainer width="100%" height="100%">
              <Chart.LineChart
                data={data}
                animate
                accessibilityLayer
                aria-label="Revenue momentum by month"
                margin={{ top: 16, right: 12, bottom: 0, left: 0 }}
              >
                <Chart.CartesianGrid vertical={false} stroke="var(--kind-recipe-grid)" />
                <Chart.XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={16}
                />
                <Chart.YAxis tickLine={false} axisLine={false} width={36} />
                <Chart.LineSeries dataKey="current" strokeWidth={3} dot={false} />
                <Chart.LineSeries dataKey="previous" strokeWidth={3} dot={false} />
                <Chart.Tooltip />
              </Chart.LineChart>
            </Chart.ResponsiveContainer>
          </div>
        </Chart.Root>
        <details className="kind-recipe-values">
          <summary>View chart data</summary>
          <div className="kind-recipe-table-scroll">
            <table>
              <caption>Revenue momentum (thousand USD)</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">This year</th>
                  <th scope="col">Last year</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period}>
                    <th scope="row">{row.period}</th>
                    <td>{row.current.toLocaleString()}</td>
                    <td>{row.previous.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
