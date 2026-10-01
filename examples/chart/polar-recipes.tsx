import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import {
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export type PolarPoint = {
  category: string;
  actual: number;
  target: number;
  range: [number, number];
};
export type PolarRecipe = "Comparison" | "Outline" | "Range" | "Rings" | "Stacked" | "Gauge";
export const polarRecipes: PolarRecipe[] = [
  "Comparison",
  "Outline",
  "Range",
  "Rings",
  "Stacked",
  "Gauge",
];
const descriptions: Record<PolarRecipe, string> = {
  Comparison: "Compare actual and target scores on the same 0–100 scale.",
  Outline: "Unfilled polygons and point marks emphasize differences across dimensions.",
  Range: "A native range radar shows the lower and upper bounds of each score.",
  Rings: "Grouped radial bars compare each category against its target.",
  Stacked: "Stacked arcs share a fixed 0–200 angle scale for additive quantities.",
  Gauge: "A half-circle progress meter keeps its numeric 0–100 domain explicit.",
};
export function PolarRecipeCard({
  recipe,
  data,
  animate,
}: {
  recipe: PolarRecipe;
  data: PolarPoint[];
  animate: boolean | Chart.RadarAnimation;
}) {
  const radar = recipe === "Comparison" || recipe === "Outline" || recipe === "Range";
  const gauge = recipe === "Gauge";
  const range = recipe === "Range";
  const [visible, setVisible] = useState<string[]>(
    range ? ["range"] : gauge ? ["actual"] : ["actual", "target"],
  );
  const config = {
    actual: {
      label: "Actual",
      color: "var(--chart-1)",
      formatValue: (value: unknown) => `${value} points`,
    },
    target: {
      label: "Target",
      color: "var(--chart-2)",
      formatValue: (value: unknown) => `${value} points`,
    },
    range: {
      label: "Expected range",
      color: "var(--chart-1)",
      formatValue: (value: unknown) =>
        Array.isArray(value) ? `${value.join("–")} points` : String(value),
    },
  } satisfies Chart.SeriesConfig;
  const rows = gauge ? data.slice(0, 1) : data;
  return (
    <article className="polar-card">
      <h2>{recipe}</h2>
      <p>{descriptions[recipe]}</p>
      <Chart.Root
        config={
          range
            ? { range: config.range }
            : gauge
              ? { actual: config.actual }
              : { actual: config.actual, target: config.target }
        }
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend aria-label={`${recipe} visible series`} />
        {visible.length === 0 && <p role="status">Choose a series to display.</p>}
        <ResponsiveContainer width="100%" height={300}>
          {radar ? (
            <Chart.RadarChart
              data={rows}
              animate={animate}
              outerRadius="72%"
              aria-label={`${recipe} scores`}
            >
              <PolarGrid gridType={recipe === "Outline" ? "circle" : "polygon"} />
              <PolarAngleAxis dataKey="category" tickLine={false} />
              <PolarRadiusAxis domain={[0, 100]} tickCount={3} />
              {range ? (
                <Chart.RadarSeries dataKey="range" isRange fillOpacity={0.2} />
              ) : (
                <>
                  <Chart.RadarSeries
                    dataKey="actual"
                    fillOpacity={recipe === "Outline" ? 0 : 0.2}
                    dot={recipe === "Outline"}
                  />
                  <Chart.RadarSeries
                    dataKey="target"
                    fill="none"
                    strokeDasharray="5 4"
                    dot={recipe === "Outline"}
                  />
                </>
              )}
              <Chart.Tooltip />
            </Chart.RadarChart>
          ) : (
            <Chart.RadialBarChart
              data={rows}
              animate={animate}
              startAngle={gauge ? 180 : 90}
              endAngle={gauge ? 0 : -270}
              innerRadius={gauge ? "55%" : "20%"}
              outerRadius="85%"
              cy={gauge ? "68%" : "50%"}
              aria-label={`${recipe} scores`}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, recipe === "Stacked" ? 200 : 100]}
                tick={false}
              />
              <PolarRadiusAxis
                type="category"
                dataKey="category"
                tick={!gauge}
                axisLine={false}
                tickLine={false}
              />
              <Chart.RadialBarSeries
                dataKey="actual"
                background
                cornerRadius={recipe === "Stacked" ? 0 : 5}
                {...(recipe === "Stacked" ? { stackId: "scores" } : {})}
              >
                {gauge && <LabelList dataKey="actual" position="insideEnd" />}
              </Chart.RadialBarSeries>
              {!gauge && (
                <Chart.RadialBarSeries
                  dataKey="target"
                  fillOpacity={0.55}
                  {...(recipe === "Stacked" ? { stackId: "scores" } : {})}
                />
              )}
              <Chart.Tooltip />
            </Chart.RadialBarChart>
          )}
        </ResponsiveContainer>
      </Chart.Root>
      {rows.length === 0 && <p role="status">No scores yet.</p>}
      <details>
        <summary>View values</summary>
        <table>
          <caption>{recipe} score data</caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">{range ? "Range" : "Actual"}</th>
              {!range && !gauge && <th scope="col">Target</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <th scope="row">{row.category}</th>
                <td>{range ? row.range.join("–") : row.actual}</td>
                {!range && !gauge && <td>{row.target}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  );
}
