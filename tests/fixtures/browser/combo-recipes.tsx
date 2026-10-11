import * as Chart from "@kind-ui/charts";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "@kind-ui/charts";
import { useState } from "react";

export type ComboPoint = {
  period: string;
  volume: number | null;
  buffer: number | null;
  latency: number | null;
};
export const loadData: ComboPoint[] = [
  { period: "09:00", volume: 28, buffer: 12, latency: 150 },
  { period: "10:00", volume: 45, buffer: 18, latency: 220 },
  { period: "11:00", volume: 38, buffer: 14, latency: 190 },
  { period: "12:00", volume: 0, buffer: 0, latency: 110 },
  { period: "13:00", volume: 54, buffer: 22, latency: 280 },
  { period: "14:00", volume: 42, buffer: 16, latency: 200 },
];
export const balanceData: ComboPoint[] = [
  { period: "Mon", volume: 14, buffer: 8, latency: 16 },
  { period: "Tue", volume: -9, buffer: -5, latency: 12 },
  { period: "Wed", volume: 0, buffer: 0, latency: 0 },
  { period: "Thu", volume: null, buffer: null, latency: null },
  { period: "Fri", volume: -6, buffer: -3, latency: -8 },
  { period: "Sat", volume: 20, buffer: 10, latency: 18 },
  { period: "Sun", volume: 18, buffer: 7, latency: 22 },
];
export const forecastData: ComboPoint[] = [
  { period: "Jan", volume: 24, buffer: 35, latency: 30 },
  { period: "Feb", volume: 32, buffer: 40, latency: 34 },
  { period: "Mar", volume: 38, buffer: 48, latency: 42 },
  { period: "Apr", volume: null, buffer: 57, latency: 50 },
  { period: "May", volume: null, buffer: 65, latency: 58 },
  { period: "Jun", volume: null, buffer: 75, latency: 68 },
];
export type ComboRecipeProps = { animate?: boolean | Chart.ComboAnimation; data?: ComboPoint[] };
const axis = { axisLine: false, tickLine: false, tickMargin: 8, fontSize: 11 };
const tasks = (value: unknown) => `${value} tasks`;
const ms = (value: unknown) => `${value} ms`;
const money = (value: unknown) => `$${value}k`;

/** Different native axes keep counts and latency in their own units. */
export function LoadCombo({ animate = false, data = loadData }: ComboRecipeProps) {
  const [visible, setVisible] = useState(["volume", "buffer", "latency"]);
  return (
    <Chart.Root
      config={{
        volume: { label: "Completed", color: "#2563eb", formatValue: tasks },
        buffer: { label: "Queued", color: "#93c5fd", formatValue: tasks },
        latency: { label: "Latency", color: "#d97706", formatValue: ms },
      }}
      visibleSeries={visible}
      onVisibleSeriesChange={setVisible}
    >
      <Chart.Legend />
      <ResponsiveContainer width="100%" height={250}>
        <Chart.ComboChart
          key={animate === false ? "static" : "motion"}
          data={data}
          animate={animate}
          aria-label="Workload and latency"
          margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis {...axis} dataKey="period" />
          <YAxis {...axis} yAxisId="tasks" width={36} domain={[0, 80]} />
          <YAxis
            {...axis}
            yAxisId="ms"
            orientation="right"
            width={40}
            domain={[0, 400]}
            tickFormatter={(v) => `${v}`}
          />
          <Chart.AreaSeries
            dataKey="buffer"
            yAxisId="tasks"
            type="monotone"
            fillOpacity={0.22}
            dot={false}
          />
          <Chart.BarSeries dataKey="volume" yAxisId="tasks" radius={3} maxBarSize={32} />
          <Chart.LineSeries
            dataKey="latency"
            yAxisId="ms"
            type="monotone"
            strokeWidth={2}
            dot={false}
          />
          <Chart.Tooltip />
        </Chart.ComboChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}

/** Sign stacking uses separate positive and negative totals, including a true zero. */
export function BalanceCombo({ animate = false, data = balanceData }: ComboRecipeProps) {
  const [visible, setVisible] = useState(["volume", "buffer", "latency"]);
  return (
    <Chart.Root
      config={{
        volume: { label: "Product", color: "#0d9488", formatValue: money },
        buffer: { label: "Services", color: "#99d5cb", formatValue: money },
        latency: { label: "Plan", color: "#7c3aed", formatValue: money },
      }}
      visibleSeries={visible}
      onVisibleSeriesChange={setVisible}
    >
      <Chart.Legend />
      <ResponsiveContainer width="100%" height={250}>
        <Chart.ComboChart
          key={animate === false ? "static" : "motion"}
          data={data}
          animate={animate}
          stackOffset="sign"
          aria-label="Net cash against plan"
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis {...axis} dataKey="period" />
          <YAxis {...axis} width={36} domain={[-20, 40]} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          <Chart.BarSeries dataKey="volume" stackId="cash" maxBarSize={30} />
          <Chart.BarSeries dataKey="buffer" stackId="cash" maxBarSize={30} />
          <Chart.LineSeries
            dataKey="latency"
            strokeDasharray="5 4"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
          <Chart.Tooltip />
        </Chart.ComboChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}

/** A projected envelope and a custom native marker distinguish forecast from actuals. */
export function ForecastCombo({ animate = false, data = forecastData }: ComboRecipeProps) {
  const [visible, setVisible] = useState(["volume", "buffer", "latency"]);
  return (
    <Chart.Root
      config={{
        volume: { label: "Actual", color: "#334155", formatValue: tasks },
        buffer: { label: "Capacity", color: "#cbd5e1", formatValue: tasks },
        latency: { label: "Forecast", color: "#e11d48", formatValue: tasks },
      }}
      visibleSeries={visible}
      onVisibleSeriesChange={setVisible}
    >
      <Chart.Legend />
      <ResponsiveContainer width="100%" height={250}>
        <Chart.ComboChart
          key={animate === false ? "static" : "motion"}
          data={data}
          animate={animate}
          aria-label="Actuals, forecast and capacity"
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis {...axis} dataKey="period" />
          <YAxis {...axis} width={36} domain={[0, 80]} />
          <Chart.AreaSeries dataKey="buffer" type="stepAfter" fillOpacity={0.3} strokeWidth={0} />
          <Chart.BarSeries dataKey="volume" maxBarSize={32} radius={3} />
          <Chart.LineSeries
            dataKey="latency"
            type="linear"
            strokeDasharray="4 3"
            strokeWidth={2}
            dot={({ cx, cy }) => (
              <path d={`M${cx},${(cy ?? 0) - 4} l4,4 l-4,4 l-4,-4 Z`} fill="#e11d48" />
            )}
          />
          <Chart.Tooltip />
        </Chart.ComboChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
