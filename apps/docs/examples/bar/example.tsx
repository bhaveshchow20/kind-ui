"use client";
// Adapted from examples/chart/bar-recipes.tsx: VerticalBars, at 218ac66.
import * as Chart from "@kind-ui/charts";
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & { material: "plain" | "paper"; visible: string[] };
type Row = { category: string; value: number };
const data: Row[] = [
  { category: "North", value: 18 },
  { category: "East", value: 34 },
  { category: "South", value: 27 },
  { category: "West", value: 47 },
];
const key = (row: unknown) =>
  row && typeof row === "object" && "category" in row ? String(row.category) : undefined;
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  return (
    <section className="chart-example" aria-label="Bar category comparison example">
      <Chart.Root
        config={{
          value: { label: "Completed tasks", color: "#91a8e7", formatValue: (v) => `${v} tasks` },
        }}
        emphasis={s.emphasis}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <Chart.Legend />
        <p className="chart-sr-only">
          Hover a category or use the chart's Left/Right keys. Emphasis preserves every value; the
          legend controls series visibility.
        </p>
        <ResponsiveContainer width="100%" height={290}>
          <Chart.BarChart
            data={data}
            animate={s.animate}
            emphasis="category"
            aria-label="Completed tasks by region"
            margin={{ top: 16, right: 14, left: 0, bottom: 8 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="category" axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis domain={[0, 60]} axisLine={false} tickLine={false} width={38} />
            <Chart.BarSeries<Row, number>
              dataKey="value"
              emphasisKey={key}
              material={s.material}
              radius={[3, 3, 0, 0]}
              maxBarSize={50}
            />
            <Chart.Tooltip />
          </Chart.BarChart>
        </ResponsiveContainer>
        <p className="chart-sr-only">
          This positive, top-level categorical dataset is eligible for bar emphasis. Zero,
          missing/range/function/nested keys and custom peers can force fallback.
        </p>
        <details>
          <summary>View data</summary>
          <div className="table-scroll">
            <table>
              <caption>Completed tasks</caption>
              <thead>
                <tr>
                  <th scope="col">Region</th>
                  <th scope="col">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{row.category}</th>
                    <td>{row.value}</td>
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
