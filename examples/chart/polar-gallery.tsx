import * as Chart from "@kind-ui/charts";
import {
  Cell,
  Label,
  LabelList,
  type LabelProps,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "@kind-ui/charts";
import { type ComponentProps, useId, useState } from "react";

export type GalleryPoint = { category: string; actual: number; target: number };
export const radarVariants = [
  "default",
  "dots",
  "lines-only",
  "label-custom",
  "grid-custom",
  "grid-none",
  "grid-circle",
  "grid-circle-no-lines",
  "grid-circle-fill",
  "grid-fill",
  "multiple",
  "legend",
] as const;
export const radialVariants = ["simple", "label", "grid", "text", "shape", "stacked"] as const;
type RadarVariant = (typeof radarVariants)[number];
type RadialVariant = (typeof radialVariants)[number];
const details: Record<RadarVariant | RadialVariant, string> = {
  default: "Single filled radar with a polygon grid.",
  dots: "Point marks retain the native radar dot API.",
  "lines-only": "Two unfilled outlines without radial grid spokes.",
  "label-custom": "Custom angle ticks combine each category with both scores.",
  "grid-custom": "One consumer-specified radius, without radial spokes.",
  "grid-none": "Axes and filled radar without a grid.",
  "grid-circle": "Concentric circles with radial spokes.",
  "grid-circle-no-lines": "Concentric circles without radial spokes.",
  "grid-circle-fill": "Filled concentric circles.",
  "grid-fill": "Filled polygon grid.",
  multiple: "Two filled radar series on a shared scale.",
  legend: "Two filled series with the shared controlled legend.",
  simple: "Category-colored radial bars with native background tracks.",
  label: "Category names follow the actual ring bands and arc endpoints.",
  grid: "Category-colored bars with a native circular polar grid.",
  text: "A rounded progress arc with an independently optional center summary.",
  shape: "A short progress arc and consumer-specified circular grid radii.",
  stacked: "Two series stack within one half-circle ring, with a total summary.",
};
function ScoreTick({
  x,
  y,
  textAnchor,
  payload,
  data,
}: {
  x?: number | string;
  y?: number | string;
  textAnchor?: ComponentProps<"text">["textAnchor"];
  payload?: { value?: unknown };
  data: readonly GalleryPoint[];
}) {
  const row = data.find((entry) => entry.category === payload?.value);
  return (
    <text data-gallery-tick="" x={x} y={y} textAnchor={textAnchor} fontSize={10}>
      <tspan>{row ? `${row.actual} / ${row.target}` : ""}</tspan>
      <tspan x={x} dy={13}>
        {String(payload?.value ?? "")}
      </tspan>
    </text>
  );
}
function CenterSummary({ viewBox, value }: LabelProps) {
  if (!viewBox || !("cx" in viewBox)) return <g />;
  return (
    <text
      data-gallery-summary=""
      x={viewBox.cx}
      y={viewBox.cy}
      textAnchor="middle"
      dominantBaseline="middle"
    >
      <tspan x={viewBox.cx} fontSize={24} fontWeight={600}>
        {value}
      </tspan>
      <tspan x={viewBox.cx} dy={22} fontSize={11}>
        points
      </tspan>
    </text>
  );
}
const config = {
  actual: {
    label: "Actual",
    color: "var(--chart-1, #171717)",
    formatValue: (value: unknown) => `${value} points`,
  },
  target: {
    label: "Target",
    color: "var(--chart-2, #626262)",
    formatValue: (value: unknown) => `${value} points`,
  },
} satisfies Chart.SeriesConfig;
const colors = ["#334e68", "#486b56", "#835d3a", "#655382", "#356d76"];

/** Host composition for all current official gallery paths; every Kind primitive is a public export. */
export function PolarGalleryCard({
  kind,
  data,
  animate,
  material = "plain",
  showText = true,
  tooltips = true,
  categoryColors = colors,
}: {
  kind: "radar" | "radial";
  data: readonly GalleryPoint[];
  animate: boolean | Chart.RadarAnimation;
  material?: Chart.PolarMaterial;
  showText?: boolean;
  tooltips?: boolean;
  categoryColors?: readonly string[];
}) {
  const selectId = useId();
  const [radarVariant, setRadarVariant] = useState<RadarVariant>("default");
  const [radialVariant, setRadialVariant] = useState<RadialVariant>("label");
  const [visible, setVisible] = useState(["actual", "target"]);
  const [center, setCenter] = useState(true);
  const radar = kind === "radar";
  const variant = radar ? radarVariant : radialVariant;
  const multiple = ["lines-only", "label-custom", "multiple", "legend"].includes(radarVariant);
  const circle = radarVariant.startsWith("grid-circle");
  const gridFill = radarVariant === "grid-fill" || radarVariant === "grid-circle-fill";
  const singleRing = ["text", "shape", "stacked"].includes(radialVariant);
  const stacked = radialVariant === "stacked";
  const rows = singleRing ? data.slice(0, 1) : data;
  const summary = rows[0] ? rows[0].actual + (stacked ? rows[0].target : 0) : 0;
  return (
    <article className="polar-card" data-gallery={kind} data-variant={variant}>
      <h2>{radar ? "Radar gallery" : "Radial gallery"}</h2>
      <label htmlFor={selectId}>
        {radar ? "Radar variation" : "Radial variation"}{" "}
        {radar ? (
          <select
            id={selectId}
            value={radarVariant}
            onChange={(event) => {
              const next = radarVariants.find((mode) => mode === event.target.value);
              if (next) setRadarVariant(next);
            }}
          >
            {radarVariants.map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </select>
        ) : (
          <select
            id={selectId}
            value={radialVariant}
            onChange={(event) => {
              const next = radialVariants.find((mode) => mode === event.target.value);
              if (next) setRadialVariant(next);
            }}
          >
            {radialVariants.map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </select>
        )}
      </label>
      {!radar && singleRing && (
        <label className="polar-center-control">
          <input
            type="checkbox"
            checked={center}
            onChange={(event) => setCenter(event.target.checked)}
          />{" "}
          Center summary
        </label>
      )}
      <p>{details[variant]}</p>
      <Chart.Root
        config={(radar && multiple) || stacked ? config : { actual: config.actual }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend aria-label={`${kind} gallery visible series`} />
        <ResponsiveContainer width="100%" height={300}>
          {radar ? (
            <Chart.RadarChart
              data={data}
              animate={animate}
              outerRadius="68%"
              aria-label="Radar gallery scores"
            >
              <PolarAngleAxis
                dataKey="category"
                tick={radarVariant === "label-custom" ? <ScoreTick data={data} /> : true}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              {radarVariant !== "grid-none" && (
                <PolarGrid
                  gridType={circle ? "circle" : "polygon"}
                  radialLines={
                    !["lines-only", "grid-custom", "grid-circle-no-lines"].includes(radarVariant)
                  }
                  {...(radarVariant === "grid-custom" ? { polarRadius: [96] } : {})}
                  {...(gridFill ? { fill: "var(--color-actual)", fillOpacity: 0.08 } : {})}
                  data-gallery-grid={variant}
                />
              )}
              <Chart.RadarSeries
                material={material}
                dataKey="actual"
                fillOpacity={radarVariant === "lines-only" ? 0 : 0.25}
                dot={radarVariant === "dots" ? { r: 4, fillOpacity: 1 } : false}
              />
              {multiple && (
                <Chart.RadarSeries
                  material={material}
                  dataKey="target"
                  fillOpacity={radarVariant === "lines-only" ? 0 : 0.18}
                />
              )}
              <Chart.Tooltip {...(tooltips ? {} : { active: false })} />
            </Chart.RadarChart>
          ) : (
            <Chart.RadialBarChart
              data={rows}
              animate={animate}
              startAngle={radialVariant === "label" ? -90 : 0}
              endAngle={
                radialVariant === "label"
                  ? 380
                  : radialVariant === "text"
                    ? 250
                    : radialVariant === "shape"
                      ? 100
                      : stacked
                        ? 180
                        : 360
              }
              innerRadius={singleRing ? "55%" : "16%"}
              outerRadius="90%"
              barCategoryGap="12%"
              aria-label="Radial gallery scores"
            >
              <PolarAngleAxis type="number" domain={[0, stacked ? 200 : 100]} tick={false} />
              <PolarRadiusAxis
                type="category"
                dataKey="category"
                tick={false}
                tickLine={false}
                axisLine={false}
              >
                {singleRing && center && <Label value={summary} content={CenterSummary} />}
              </PolarRadiusAxis>
              {radialVariant === "grid" && <PolarGrid gridType="circle" />}
              {["text", "shape"].includes(radialVariant) && (
                <>
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    polarRadius={[radialVariant === "text" ? 110 : 106]}
                    fill="var(--border, #e5e5e5)"
                    stroke="none"
                  />
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    polarRadius={[radialVariant === "text" ? 82 : 84]}
                    fill="var(--card, white)"
                    stroke="none"
                  />
                </>
              )}
              <Chart.RadialBarSeries
                material={material}
                dataKey="actual"
                background={radialVariant !== "grid" && !stacked}
                cornerRadius={singleRing ? 5 : 0}
                {...(stacked ? { stackId: "scores" } : {})}
              >
                {!singleRing &&
                  rows.map((row, index) => (
                    <Cell
                      key={row.category}
                      fill={categoryColors[index % categoryColors.length] ?? "var(--color-actual)"}
                    />
                  ))}
                <LabelList
                  fill="white"
                  dataKey="category"
                  content={<Chart.RadialBarLabel show={showText} />}
                />
              </Chart.RadialBarSeries>
              {stacked && (
                <Chart.RadialBarSeries
                  material={material}
                  dataKey="target"
                  stackId="scores"
                  cornerRadius={5}
                >
                  <LabelList
                    fill="white"
                    dataKey="target"
                    content={<Chart.RadialBarLabel show={showText} />}
                  />
                </Chart.RadialBarSeries>
              )}
              <Chart.Tooltip {...(tooltips ? {} : { active: false })} />
            </Chart.RadialBarChart>
          )}
        </ResponsiveContainer>
      </Chart.Root>
      <details>
        <summary>View values</summary>
        <table>
          <caption>{kind} gallery values</caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">Actual</th>
              {((radar && multiple) || stacked) && <th scope="col">Target</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <th scope="row">{row.category}</th>
                <td>{row.actual}</td>
                {((radar && multiple) || stacked) && <td>{row.target}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="polar-source">Styling and data are owned by this example.</p>
    </article>
  );
}
