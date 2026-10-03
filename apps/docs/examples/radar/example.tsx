"use client";

// Adapted from PolarExampleCard's Comparison example in examples/chart/polar-recipes.tsx
// and the five score records in examples/chart/polar.tsx, at 218ac66.
import * as Chart from "@kind-ui/charts";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
import "@kind-ui/charts/styles.css";

export type ExampleSettings = CommonSettings & { material: "plain" | "paper"; visible: string[] };

type Score = { category: string; actual: number; target: number };

const data: Score[] = [
  { category: "Speed", actual: 85, target: 75 },
  { category: "Quality", actual: 68, target: 80 },
  { category: "Reliability", actual: 92, target: 85 },
  { category: "Coverage", actual: 58, target: 70 },
  { category: "Efficiency", actual: 74, target: 65 },
];

const config = {
  actual: {
    label: "Actual",
    color: "#91a8e7",
    formatValue: (value: unknown) => `${value} points`,
  },
  target: {
    label: "Target",
    color: "#89bfb0",
    formatValue: (value: unknown) => `${value} points`,
  },
} satisfies Chart.SeriesConfig;

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);

  return (
    <section className="chart-example" aria-label="Actual and target radar comparison">
      <p className="chart-sr-only">
        Compare actual and target scores across five dimensions on the same 0–100 point scale. The
        dashed outline is the target. Every score is a finite number within that domain.
      </p>
      <Chart.Root
        config={config}
        emphasis={s.emphasis}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <Chart.Legend aria-label="Visible score series" />
        {s.visible.length === 0 && <p role="status">Choose a series to display.</p>}
        <ResponsiveContainer width="100%" height={340}>
          <Chart.RadarChart
            data={data}
            layout="centric"
            animate={s.animate}
            outerRadius="68%"
            margin={{ top: 24, right: 28, bottom: 24, left: 28 }}
            aria-label="Actual and target scores for Speed, Quality, Reliability, Coverage and Efficiency"
          >
            <PolarGrid gridType="polygon" stroke="var(--border, #dfe2e8)" />
            <PolarAngleAxis
              type="category"
              dataKey="category"
              tickLine={false}
              tick={{ fill: "var(--muted-foreground, #59616f)", fontSize: 12 }}
            />
            <PolarRadiusAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              angle={90}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground, #59616f)", fontSize: 12 }}
            />
            <Chart.RadarSeries<Score, number>
              dataKey="actual"
              material={s.material}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Chart.RadarSeries<Score, number>
              dataKey="target"
              material={s.material}
              fill="none"
              strokeDasharray="5 4"
              strokeWidth={2}
            />
            <Chart.Tooltip />
          </Chart.RadarChart>
        </ResponsiveContainer>
      </Chart.Root>
      <p className="chart-sr-only">
        The legend toggles whole series. Focus the chart and use Left or Right to inspect a
        dimension; Enter toggles the tooltip and Escape dismisses it. Automatic category paint
        emphasis is not implemented for radar.
      </p>
      <details>
        <summary>View data</summary>
        <div className="table-scroll">
          <table>
            <caption>Actual and target scores — all five dimensions, in points</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                <th scope="col">Actual</th>
                <th scope="col">Target</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.category}>
                  <th scope="row">{row.category}</th>
                  <td>{row.actual}</td>
                  <td>{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
