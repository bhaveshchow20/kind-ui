"use client";

import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import "@kind-ui/charts/styles.css";
import "./kind-chart.css";

export type AreaChartDatum = { period: string; current: number; previous: number };
export const areaChartData: AreaChartDatum[] = [
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
export function KindAreaChart({ data = areaChartData }: { data?: AreaChartDatum[] }) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(Object.keys(config));
  return (
    <Card className="kind-recipe kind-recipe-area">
      <CardHeader>
        <p className="kind-recipe-eyebrow">THE BIG PICTURE</p>
        <CardTitle>Audience growth</CardTitle>
        <CardDescription>See how your audience builds over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="kind-recipe-metric">
          {data.reduce((sum, row) => sum + row.current, 0).toLocaleString()}
          <span> thousand visitors · this year</span>
        </p>
        <Chart.Root
          config={config}
          visibleSeries={visibleSeries}
          onVisibleSeriesChange={setVisibleSeries}
        >
          <Chart.Legend aria-label="Choose visible audience growth series" />
          <div className="kind-recipe-plot">
            <Chart.ResponsiveContainer width="100%" height="100%">
              <Chart.AreaChart
                data={data}
                animate
                accessibilityLayer
                aria-label="Audience growth by month"
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
                <Chart.AreaSeries dataKey="current" fillOpacity={0.18} strokeWidth={2} />
                <Chart.AreaSeries dataKey="previous" fillOpacity={0.18} strokeWidth={2} />
                <Chart.Tooltip />
              </Chart.AreaChart>
            </Chart.ResponsiveContainer>
          </div>
        </Chart.Root>
        <details className="kind-recipe-values">
          <summary>View chart data</summary>
          <div className="kind-recipe-table-scroll">
            <table>
              <caption>Audience growth (thousand visitors)</caption>
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
