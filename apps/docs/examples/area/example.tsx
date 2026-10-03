"use client";
// Adapted from examples/chart/area-recipes.tsx at 218ac66.
import * as Chart from "@kind-ui/charts";
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & {
  material: "plain" | "paper";
  curve: "linear" | "monotone" | "stepAfter";
};
type Row = { period: string; value: number };
const data: Row[] = [
  { period: "Mon", value: 18 },
  { period: "Tue", value: 34 },
  { period: "Wed", value: 29 },
  { period: "Thu", value: 42 },
  { period: "Fri", value: 27 },
  { period: "Sat", value: 47 },
  { period: "Sun", value: 38 },
];
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  return (
    <section className="chart-example" aria-label="Area trend example">
      <Chart.Root
        config={{
          value: {
            label: "Completed tasks",
            color: "#91a8e7",
            formatValue: (value) => (typeof value === "number" ? `${value} tasks` : "No data"),
          },
        }}
      >
        <p className="chart-sr-only">
          Focus the chart and use Left or Right to inspect. All seven daily observations are
          present.
        </p>
        <ResponsiveContainer width="100%" height={290}>
          <Chart.AreaChart
            data={data}
            animate={s.animate}
            aria-label="Completed tasks by day"
            margin={{ top: 16, right: 14, left: 0, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis domain={[0, 60]} axisLine={false} tickLine={false} width={38} />
            <Chart.AreaSeries
              dataKey="value"
              type={s.curve}
              material={s.material}
              connectNulls={false}
              strokeWidth={2.5}
              dot={false}
              fillOpacity={0.24}
            />
            <Chart.Tooltip />
          </Chart.AreaChart>
        </ResponsiveContainer>
        <details>
          <summary>View data</summary>
          <div className="table-scroll">
            <table>
              <caption>Completed tasks</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period}>
                    <th scope="row">{row.period}</th>
                    <td>{row.value ?? "No data"}</td>
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
