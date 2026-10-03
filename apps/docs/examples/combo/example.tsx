"use client";
// Adapted from the upstream workload Combo component example at 218ac66.
import * as Chart from "@kind-ui/charts";
import { useCallback, useState } from "react";
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & { visible: string[] };
const data = [
  { period: "09:00", volume: 28, buffer: 12, latency: 150 },
  { period: "10:00", volume: 45, buffer: 18, latency: 220 },
  { period: "11:00", volume: 38, buffer: 14, latency: 190 },
  { period: "12:00", volume: 22, buffer: 9, latency: 150 },
  { period: "13:00", volume: 54, buffer: 22, latency: 280 },
  { period: "14:00", volume: 42, buffer: 16, latency: 200 },
];
const config = {
  volume: { label: "Completed", color: "#91a8e7", formatValue: (v: unknown) => `${v} tasks` },
  buffer: { label: "Queued", color: "#89bfb0", formatValue: (v: unknown) => `${v} tasks` },
  latency: { label: "Latency", color: "#dda0b9", formatValue: (v: unknown) => `${v} ms` },
} satisfies Chart.SeriesConfig;
const axis = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  fontSize: "0.75rem",
  interval: "preserveStartEnd" as const,
};
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const [axisScale, setAxisScale] = useState(1);
  const resizeAxes = useCallback(() => {
    const fontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (Number.isFinite(fontSize) && fontSize > 0) setAxisScale(fontSize / 16);
  }, []);
  return (
    <section className="chart-example combo-demo" aria-label="Workload and latency example">
      <div className="combo-demo-heading">
        <div>
          <h2>Hourly workload</h2>
          <p>Tasks and response time, 09:00–14:00</p>
        </div>
      </div>
      <Chart.Root
        config={config}
        emphasis={s.emphasis}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <p className="chart-sr-only" id="combo-instructions">
          Toggle a series in the legend. Focus the chart and use Left or Right; Escape dismisses
          inspection.
        </p>
        <div className="combo-plot">
          <ResponsiveContainer width="100%" height="100%" onResize={resizeAxes}>
            <Chart.ComboChart
              data={data}
              animate={s.animate}
              aria-label="Tasks and latency by hour"
              aria-describedby="combo-instructions"
              margin={{ top: 12 * axisScale, right: 4, left: 0, bottom: 12 * axisScale }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                {...axis}
                fontSize={12 * axisScale}
                key={axisScale}
                dataKey="period"
                height={30 * axisScale}
                minTickGap={24 * axisScale}
              />
              <YAxis {...axis} yAxisId="tasks" width={40 * axisScale} domain={[0, 80]} />
              <YAxis
                {...axis}
                yAxisId="ms"
                orientation="right"
                width={46 * axisScale}
                domain={[0, 400]}
              />
              <Chart.AreaSeries
                dataKey="buffer"
                yAxisId="tasks"
                type="monotone"
                fillOpacity={0.18}
                dot={false}
              />
              <Chart.BarSeries<(typeof data)[number], number>
                dataKey="volume"
                yAxisId="tasks"
                radius={3}
                maxBarSize={32}
              />
              <Chart.LineSeries<(typeof data)[number], number>
                dataKey="latency"
                yAxisId="ms"
                type="monotone"
                strokeWidth={2}
                dot={false}
              />
              <Chart.Tooltip />
            </Chart.ComboChart>
          </ResponsiveContainer>
        </div>
        <Chart.Legend />
        <p className="combo-units">
          Left axis: tasks <span aria-hidden="true">·</span> Right axis: milliseconds
        </p>
        <details>
          <summary>View data</summary>
          <div className="table-scroll">
            <table>
              <caption>Workload and latency</caption>
              <thead>
                <tr>
                  <th scope="col">Hour</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Queued</th>
                  <th scope="col">Latency (ms)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period}>
                    <th scope="row">{row.period}</th>
                    <td>{row.volume}</td>
                    <td>{row.buffer}</td>
                    <td>{row.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Chart.Root>
    </section>
  );
}
