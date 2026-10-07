"use client";
import * as Chart from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { type AdvancedRecipe, advancedData, type Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";

export { advancedRecipes } from "@/lib/advanced-chart-recipes";

type PaletteConfig = Record<string, Chart.SeriesConfig[string] & { color: string }>;

function formatAdvancedValue(id: string, value: unknown) {
  if (typeof value !== "number") return String(value);
  const number = value.toLocaleString("en-US");
  if (id === "combo" || id === "pie") return `$${number}`;
  if (id === "combo-area") return `${number} TB`;
  if (id === "radial-stacked") return `${number} h`;
  if (id === "gauge") return `${number}%`;
  return number;
}

function useChartExample({
  recipe: r,
  material,
  config,
  visible,
  animate,
  replay,
  options = {},
}: {
  recipe: AdvancedRecipe;
  material: Finish;
  config: PaletteConfig;
  visible: string[];
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  const data = useMemo(() => advancedData(r.id, options), [r.id, options]);
  const pieData = useMemo(
    () =>
      data
        .filter((row) => visible.includes(String(row.id)))
        .map((row) => ({
          id: String(row.id),
          value: Number(row.value),
          fill: config[String(row.id)]?.color,
        })),
    [data, visible, config],
  );
  if (r.family === "Combo")
    return (
      <Chart.ComboChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        margin={{ top: 20, right: 18, left: 0, bottom: 0 }}
      >
        <Chart.CartesianGrid
          horizontal={options.showGrid ?? true}
          vertical={false}
          stroke="var(--chart-grid)"
          strokeDasharray="3 5"
        />
        <Chart.XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Chart.YAxis
          tickLine={false}
          axisLine={false}
          width="auto"
          tickFormatter={(value) => (r.id === "combo" ? `$${value / 1000}k` : `${value} TB`)}
        />
        {r.id === "combo" ? (
          <Chart.BarSeries
            dataKey="a"
            radius={options.radius ?? 4}
            maxBarSize={28}
            material={material}
          />
        ) : (
          <Chart.AreaSeries
            dataKey="a"
            type={options.curve ?? "monotone"}
            fillOpacity={0.2}
            material={material}
          />
        )}
        <Chart.LineSeries
          dataKey="b"
          type="monotone"
          material={material}
          strokeDasharray="4 4"
          dot={options.dots ?? false}
          strokeWidth={options.strokeWidth ?? 2.5}
        />
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.ComboChart>
    );
  if (r.family === "Pie")
    return (
      <Chart.PieChart key={replay} animate={animate} accessibilityLayer aria-label={r.tag}>
        <Chart.PieSeries
          data={pieData}
          dataKey="value"
          nameKey="id"
          innerRadius={`${options.innerRadius ?? (r.id === "donut" ? 54 : 0)}%`}
          outerRadius="85%"
          cornerRadius={options.radius ?? 5}
          startAngle={options.rotation ?? 90}
          endAngle={(options.rotation ?? 90) + 360}
        />
        <Chart.Tooltip
          itemKey={(entry) => String(entry.payload.id)}
          valueAnimation={animate ? "shuffle" : undefined}
        />
      </Chart.PieChart>
    );
  if (r.family === "Radar")
    return (
      <Chart.RadarChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        outerRadius={`${options.outerRadius ?? 70}%`}
        selection={r.id === "radar" ? "series" : "none"}
      >
        <Chart.PolarGrid
          gridType={options.gridType ?? (r.id === "radar-outline" ? "circle" : "polygon")}
          stroke="var(--chart-grid)"
        />
        <Chart.PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
        <Chart.PolarRadiusAxis
          domain={[0, 100]}
          tickCount={3}
          tick={{ fontSize: 10 }}
          axisLine={false}
        />
        {r.id === "radar-range" ? (
          <Chart.RadarSeries dataKey="range" seriesKey="a" isRange fillOpacity={0.2} />
        ) : (
          <>
            <Chart.RadarSeries
              dataKey="a"
              strokeWidth={options.strokeWidth ?? 3}
              fillOpacity={options.fillOpacity ?? (r.id === "radar-outline" ? 0 : 0.18)}
              dot={{ r: 3, fill: config.a.color, stroke: "var(--background)", strokeWidth: 1.5 }}
            />
            <Chart.RadarSeries
              dataKey="b"
              strokeWidth={options.strokeWidth ?? 3}
              fill="none"
              strokeDasharray="4 4"
              dot={(props) => (
                <Chart.Symbols
                  cx={props.cx}
                  cy={props.cy}
                  type="diamond"
                  size={70}
                  fill={config.b.color}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                />
              )}
            />
          </>
        )}
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.RadarChart>
    );
  if (r.family === "Radial")
    return (
      <Chart.RadialBarChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        startAngle={options.rotation ?? (r.id === "gauge" ? 180 : 90)}
        endAngle={
          (options.rotation ?? (r.id === "gauge" ? 180 : 90)) - (r.id === "gauge" ? 180 : 360)
        }
        innerRadius={r.id === "gauge" ? "55%" : "20%"}
        outerRadius={`${options.outerRadius ?? 90}%`}
        cy={r.id === "gauge" ? "65%" : "50%"}
        barGap={3}
      >
        <Chart.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <Chart.PolarRadiusAxis
          type="category"
          dataKey="category"
          tick={false}
          axisLine={false}
          tickLine={false}
        >
          {r.id === "gauge" && (
            <Chart.Label
              position="center"
              value={`${options.progress ?? 72}%`}
              fill="currentColor"
            />
          )}
        </Chart.PolarRadiusAxis>
        <Chart.RadialBarSeries
          dataKey="a"
          background
          cornerRadius={options.radius ?? 4}
          stackId={r.id === "radial-stacked" ? "work" : undefined}
        >
          {r.id !== "gauge" && (
            <Chart.LabelList
              dataKey="category"
              fill="white"
              content={<Chart.RadialBarLabel fontSize={10} />}
            />
          )}
        </Chart.RadialBarSeries>
        {r.id !== "gauge" && (
          <Chart.RadialBarSeries
            dataKey="b"
            fillOpacity={0.5}
            cornerRadius={options.radius ?? 4}
            stackId={r.id === "radial-stacked" ? "work" : undefined}
          />
        )}
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.RadialBarChart>
    );
  return (
    <Chart.ScatterChart
      key={replay}
      animate={animate}
      accessibilityLayer
      aria-label={r.tag}
      margin={{ top: 20, right: 18, left: 0, bottom: 10 }}
    >
      <Chart.CartesianGrid
        horizontal={options.showGrid ?? true}
        vertical={options.showGrid ?? true}
        stroke="var(--chart-grid)"
        strokeDasharray="3 5"
      />
      <Chart.XAxis
        dataKey="x"
        type="number"
        name={r.id === "bubble" ? "Traffic" : "Ad spend"}
        unit={r.id === "bubble" ? " req/s" : " USD"}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      <Chart.YAxis
        dataKey="y"
        type="number"
        name={r.id === "bubble" ? "Latency" : "Conversions"}
        unit={r.id === "bubble" ? " ms" : ""}
        width="auto"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      {r.id === "bubble" && <Chart.ZAxis dataKey="z" name="Requests" range={[50, 340]} />}
      <Chart.ScatterSeries
        data={data}
        seriesKey="a"
        shape={(props) => (
          <Chart.Symbols
            cx={props.cx}
            cy={props.cy}
            type={options.pointShape ?? "circle"}
            size={
              r.id === "bubble"
                ? (Number(props.size ?? 60) * (options.width ?? 60)) / 60
                : (options.width ?? 60)
            }
            fill={config.a.color}
          />
        )}
      />
      {r.id !== "bubble" && (
        <Chart.ScatterSeries
          data={data.map((row) => ({ ...row, y: row.social }))}
          seriesKey="b"
          shape={(props) => (
            <Chart.Symbols
              cx={props.cx}
              cy={props.cy}
              type={options.pointShape ?? "diamond"}
              size={options.width ?? 60}
              fill={config.b.color}
            />
          )}
        />
      )}
      <Chart.ScatterTooltip
        zDimension={r.id === "bubble" ? { dataKey: "z", name: "Requests" } : undefined}
        valueAnimation={animate ? "shuffle" : undefined}
      />
    </Chart.ScatterChart>
  );
}
function ChartExample(props: Parameters<typeof useChartExample>[0]) {
  const chart = useChartExample(props);
  return (
    <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
      {chart}
    </Chart.ResponsiveContainer>
  );
}

export function AdvancedChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  recipe: AdvancedRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const chartAnimate = animate && entered && !reduced;
  const [visible, setVisible] = useState<string[]>([...recipe.keys]);
  const config: PaletteConfig = useMemo(
    () =>
      Object.fromEntries(
        recipe.keys.map((k, i) => [
          k,
          {
            label: recipe.labels[i],
            color: colors[i],
            formatValue: (value: unknown) => formatAdvancedValue(recipe.id, value),
            ...(recipe.id === "scatter" ||
            (recipe.family === "Radar" && recipe.id !== "radar-range")
              ? {
                  legendShape:
                    recipe.id === "scatter"
                      ? (options.pointShape ?? (i === 0 ? "circle" : "diamond"))
                      : i === 0
                        ? "circle"
                        : "diamond",
                }
              : {}),
          },
        ]),
      ),
    [recipe, colors, options.pointShape],
  );
  return (
    <motion.article
      ref={cardRef}
      className="chart-card"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="card-top">
        <h3 className="chart-tag">{recipe.tag}</h3>
      </div>
      <Chart.Root
        className="chart-root"
        emphasis="auto"
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <div className="chart-canvas">
          <ChartExample
            key={`${replay}-${entered}`}
            recipe={recipe}
            material={material}
            config={config}
            visible={visible}
            animate={chartAnimate}
            replay={replay}
            options={options}
          />
        </div>
        {options.showLegend !== false && (
          <Chart.Legend aria-label={`Visible series for ${recipe.tag}`} />
        )}
      </Chart.Root>
      {visible.length === 0 && (
        <p className="all-hidden" role="status">
          All series hidden. Select a legend item to show it.
        </p>
      )}
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
