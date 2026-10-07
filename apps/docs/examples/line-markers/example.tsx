"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Mon", response: 140 },
  { period: "Tue", response: 128 },
  { period: "Wed", response: 156 },
  { period: "Thu", response: 119 },
  { period: "Fri", response: 134 },
  { period: "Sat", response: 108 },
  { period: "Sun", response: 121 },
];
const config = {
  response: {
    label: "Response time",
    color: "#733bff",
    formatValue: (value: unknown) => `${value} ms`,
  },
} satisfies Chart.SeriesConfig;

function Diamond({ cx, cy }: Pick<Chart.DotProps, "cx" | "cy">) {
  if (cx == null || cy == null) return <g />;
  return (
    <path
      d={`M ${cx} ${cy - 4} l 4 4 -4 4 -4 -4 Z`}
      fill="var(--kind-ui-chart-background, #fff)"
      stroke="var(--color-response)"
      strokeWidth={1.5}
    />
  );
}
export function ResponseTimeChart() {
  return (
    <Chart.LineChart
      data={data}
      config={config}
      aria-label="Response time in milliseconds"
      legend={{}}
      margin={{ top: 36, right: 28, left: 0, bottom: 12 }}
    >
      <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
      <Chart.XAxis height={48} dataKey="period" axisLine={false} tickLine={false} tickMargin={8} />
      <Chart.YAxis domain={[0, 200]} axisLine={false} tickLine={false} tickMargin={8} width={72} />
      <Chart.LineSeries dataKey="response" strokeWidth={2.5} dot={<Diamond />}>
        <Chart.LabelList
          dataKey="response"
          position="top"
          offset={14}
          fill="var(--kind-ui-chart-foreground, #111827)"
          fontSize={12}
        />
      </Chart.LineSeries>
      <Chart.Tooltip />
    </Chart.LineChart>
  );
}
