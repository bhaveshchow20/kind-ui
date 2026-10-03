"use client";

// Adapted from PolarExampleCard's Rings example in examples/chart/polar-recipes.tsx
// and the five score records in examples/chart/polar.tsx, at 218ac66.
import * as Chart from "@kind-ui/charts";
import { LabelList, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
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

// Keep the source's explicit three-category subset: two series produce six bands.
const rows = data.slice(0, 3);
const plottedCategories = new Set(rows.map((row) => row.category));

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

function angleTick(value: unknown) {
  // Zero and 100 share the top of a full turn; the nearby prose labels its endpoint.
  return value === 100 ? "" : String(value);
}

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);

  return (
    <section className="chart-example" aria-label="Grouped radial score rings">
      <p className="chart-sr-only">
        This Rings example plots Speed, Quality and Reliability from the five source dimensions. Two
        grouped series make six bands. Coverage and Efficiency remain in the data table. Scores use
        a fixed 0–100 point angle scale: zero starts at the top and 100 is a full clockwise turn.
        These are comparisons, not additive stacks.
      </p>
      <Chart.Root
        config={config}
        emphasis={s.emphasis}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <Chart.Legend aria-label="Visible score series" />
        {s.visible.length === 0 && <p role="status">Choose a series to display.</p>}
        <ResponsiveContainer width="100%" height={360}>
          <Chart.RadialBarChart
            data={rows}
            layout="radial"
            animate={s.animate}
            startAngle={90}
            endAngle={-270}
            innerRadius="12%"
            outerRadius="82%"
            barCategoryGap="4%"
            barGap={2}
            margin={{ top: 24, right: 24, bottom: 24, left: 24 }}
            aria-label="Actual and target scores for Speed, Quality and Reliability"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              radius="88%"
              tickCount={5}
              niceTicks="none"
              tickFormatter={angleTick}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground, #59616f)", fontSize: 12 }}
            />
            <PolarRadiusAxis
              type="category"
              dataKey="category"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <Chart.RadialBarSeries<Score, number>
              dataKey="actual"
              material={s.material}
              background
              cornerRadius={5}
            >
              <LabelList
                dataKey="category"
                fill="white"
                content={<Chart.RadialBarLabel fontSize={11} style={{ fill: "white" }} />}
              />
            </Chart.RadialBarSeries>
            <Chart.RadialBarSeries<Score, number>
              dataKey="target"
              material={s.material}
              fillOpacity={0.55}
              cornerRadius={5}
            >
              <LabelList
                dataKey="target"
                fill="var(--foreground, #25252b)"
                content={
                  <Chart.RadialBarLabel
                    fontSize={11}
                    style={{ fill: "var(--foreground, #25252b)" }}
                  />
                }
              />
            </Chart.RadialBarSeries>
            <Chart.Tooltip />
          </Chart.RadialBarChart>
        </ResponsiveContainer>
      </Chart.Root>
      <p className="chart-sr-only">
        Category names follow the actual bands and target values follow their paired bands. Labels
        that cannot fit are omitted; the tooltip and table retain the values. The legend toggles
        whole series. Focus the chart and use Left or Right to inspect; Enter toggles the tooltip
        and Escape dismisses it. Automatic category paint emphasis is not implemented for radial
        bars.
      </p>
      <details>
        <summary>View data</summary>
        <div className="table-scroll">
          <table>
            <caption>All source dimensions — scores in points and chart subset</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                <th scope="col">Actual</th>
                <th scope="col">Target</th>
                <th scope="col">In chart subset</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.category}>
                  <th scope="row">{row.category}</th>
                  <td>{row.actual}</td>
                  <td>{row.target}</td>
                  <td>{plottedCategories.has(row.category) ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
