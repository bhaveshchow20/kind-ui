"use client";

import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import "@kind-ui/charts/styles.css";
import "./kind-chart.css";

export type BarChartDatum = { period: string; direct: number; partner: number };
export const barChartData: BarChartDatum[] = [
  { period: "Jan", direct: 38, partner: 24 },
  { period: "Feb", direct: 52, partner: 33 },
  { period: "Mar", direct: 45, partner: 30 },
  { period: "Apr", direct: 68, partner: 47 },
  { period: "May", direct: 61, partner: 42 },
  { period: "Jun", direct: 84, partner: 59 },
];
const config = {
  direct: { label: "Direct", color: "var(--kind-recipe-1)" },
  partner: { label: "Partners", color: "var(--kind-recipe-2)" },
} satisfies Chart.SeriesConfig;

/** Editable presentation; chart inspection, visibility and motion come from Kind UI. */
export function KindBarChart({ data = barChartData }: { data?: BarChartDatum[] }) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(Object.keys(config));
  return (
    <Card className="kind-recipe kind-recipe-bar">
      <CardHeader>
        <p className="kind-recipe-eyebrow">THE BIG PICTURE</p>
        <CardTitle>Orders by channel</CardTitle>
        <CardDescription>Compare the channels bringing people to your work.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="kind-recipe-metric">
          {data.reduce((sum, row) => sum + row.direct, 0).toLocaleString()}
          <span> direct orders</span>
        </p>
        <Chart.Root
          config={config}
          visibleSeries={visibleSeries}
          onVisibleSeriesChange={setVisibleSeries}
        >
          <Chart.Legend aria-label="Choose visible orders by channel series" />
          <div className="kind-recipe-plot">
            <Chart.ResponsiveContainer width="100%" height="100%">
              <Chart.BarChart
                data={data}
                animate
                accessibilityLayer
                aria-label="Orders by channel by month"
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
                <Chart.BarSeries dataKey="direct" radius={[5, 5, 0, 0]} />
                <Chart.BarSeries dataKey="partner" radius={[5, 5, 0, 0]} />
                <Chart.Tooltip />
              </Chart.BarChart>
            </Chart.ResponsiveContainer>
          </div>
        </Chart.Root>
        <details className="kind-recipe-values">
          <summary>View chart data</summary>
          <div className="kind-recipe-table-scroll">
            <table>
              <caption>Orders by channel (orders)</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Direct</th>
                  <th scope="col">Partners</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period}>
                    <th scope="row">{row.period}</th>
                    <td>{row.direct.toLocaleString()}</td>
                    <td>{row.partner.toLocaleString()}</td>
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
