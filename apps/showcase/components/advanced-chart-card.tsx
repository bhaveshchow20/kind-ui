"use client";
import {
  ComboChart,
  Label,
  LabelList,
  PieChart,
  RadarChart,
  RadialBarChart,
  RadialBarLabel,
  ScatterChart,
  type SeriesConfig,
  Symbols,
} from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import { type AdvancedRecipe, advancedData, type Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";

export { advancedRecipes } from "@/lib/advanced-chart-recipes";

type PaletteConfig = Record<string, SeriesConfig[string] & { color: string }>;

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
  animate,
  replay,
  options = {},
}: {
  recipe: AdvancedRecipe;
  material: Finish;
  config: PaletteConfig;
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  const data = useMemo(() => advancedData(r.id, options), [r.id, options]);
  const pieData = useMemo(
    () =>
      data.map((row) => ({
        id: String(row.id),
        value: Number(row.value),
        fill: config[String(row.id)]?.color,
      })),
    [data, config],
  );
  if (r.family === "Combo")
    return (
      <ComboChart
        config={config}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: Object.keys(config),
        }}
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        margin={{ top: 20, right: 18, left: 0, bottom: 0 }}
      >
        {options.showGrid !== false && (
          <ComboChart.Grid
            horizontal={options.showGrid ?? true}
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
          />
        )}
        <ComboChart.XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ComboChart.YAxis
          tickLine={false}
          axisLine={false}
          width="auto"
          tickFormatter={(value) => (r.id === "combo" ? `$${value / 1000}k` : `${value} TB`)}
        />
        {r.id === "combo" ? (
          <ComboChart.Bar
            dataKey="a"
            radius={options.radius ?? 4}
            maxBarSize={28}
            material={material}
          />
        ) : (
          <ComboChart.Area
            dataKey="a"
            type={options.curve ?? "monotone"}
            fillOpacity={0.2}
            material={material}
          />
        )}
        <ComboChart.Line
          dataKey="b"
          type="monotone"
          material={material}
          strokeDasharray="4 4"
          dot={options.dots ?? false}
          strokeWidth={options.strokeWidth ?? 2.5}
        />
        <ComboChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
        {options.showLegend !== false && (
          <ComboChart.Legend aria-label={`Focus series for ${r.tag}`} />
        )}
      </ComboChart>
    );
  if (r.family === "Pie")
    return (
      <PieChart
        key={replay}
        config={config}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{
          kind: "category",
          mode: "focus",
          eligibleKeys: Object.keys(config),
        }}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
      >
        <PieChart.Series
          categoryKey="id"
          data={pieData}
          dataKey="value"
          nameKey="id"
          innerRadius={`${options.innerRadius ?? (r.id === "donut" ? 54 : 0)}%`}
          outerRadius="85%"
          cornerRadius={options.radius ?? 5}
          startAngle={options.rotation ?? 90}
          endAngle={(options.rotation ?? 90) + 360}
        />
        <PieChart.Tooltip
          itemKey={(entry) => String(entry.payload.id)}
          valueAnimation={animate ? "shuffle" : undefined}
        />
        {options.showLegend !== false && (
          <PieChart.Legend aria-label={`Focus series for ${r.tag}`} />
        )}
      </PieChart>
    );
  if (r.family === "Radar")
    return (
      <RadarChart
        config={config}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: Object.keys(config),
        }}
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        outerRadius={`${options.outerRadius ?? 70}%`}
      >
        {options.showGrid !== false && (
          <RadarChart.Grid
            gridType={options.gridType ?? (r.id === "radar-outline" ? "circle" : "polygon")}
            stroke="var(--chart-grid)"
          />
        )}
        <RadarChart.AngleAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
        <RadarChart.RadiusAxis
          domain={[0, 100]}
          tickCount={3}
          tick={{ fontSize: 10 }}
          axisLine={false}
        />
        {r.id === "radar-range" ? (
          <RadarChart.Series dataKey="range" seriesKey="a" isRange fillOpacity={0.2} />
        ) : (
          <>
            <RadarChart.Series
              dataKey="a"
              strokeWidth={options.strokeWidth ?? 3}
              fillOpacity={options.fillOpacity ?? (r.id === "radar-outline" ? 0 : 0.18)}
              dot={{
                r: 3,
                fill: config.a.color,
                stroke: "var(--background)",
                strokeWidth: 1.5,
              }}
            />
            <RadarChart.Series
              dataKey="b"
              strokeWidth={options.strokeWidth ?? 3}
              fill="none"
              strokeDasharray="4 4"
              dot={(props) => (
                <Symbols
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
        <RadarChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
        {options.showLegend !== false && (
          <RadarChart.Legend aria-label={`Focus series for ${r.tag}`} />
        )}
      </RadarChart>
    );
  if (r.family === "Radial")
    return (
      <RadialBarChart
        config={config}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: Object.keys(config),
        }}
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
        <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBarChart.RadiusAxis
          type="category"
          dataKey="category"
          tick={false}
          axisLine={false}
          tickLine={false}
        >
          {r.id === "gauge" && options.showLabels && (
            <Label position="center" value={`${options.progress ?? 72}%`} fill="currentColor" />
          )}
        </RadialBarChart.RadiusAxis>
        <RadialBarChart.Series
          dataKey="a"
          background
          cornerRadius={options.radius ?? 4}
          stackId={r.id === "radial-stacked" ? "work" : undefined}
        >
          {r.id !== "gauge" && options.showLabels && (
            <LabelList dataKey="category" fill="white" content={<RadialBarLabel fontSize={10} />} />
          )}
        </RadialBarChart.Series>
        {r.id !== "gauge" && (
          <RadialBarChart.Series
            dataKey="b"
            fillOpacity={0.5}
            cornerRadius={options.radius ?? 4}
            stackId={r.id === "radial-stacked" ? "work" : undefined}
          />
        )}
        <RadialBarChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
        {options.showLegend !== false && (
          <RadialBarChart.Legend aria-label={`Focus series for ${r.tag}`} />
        )}
      </RadialBarChart>
    );
  return (
    <ScatterChart
      config={config}
      frameProps={{ className: "chart-root" }}
      className="chart-canvas"
      interaction={{
        kind: "series",
        mode: "focus",
        eligibleKeys: Object.keys(config),
      }}
      key={replay}
      animate={animate}
      accessibilityLayer
      aria-label={r.tag}
      margin={{ top: 20, right: 18, left: 0, bottom: 10 }}
    >
      {options.showGrid !== false && (
        <ScatterChart.Grid
          horizontal={options.showGrid ?? true}
          vertical={options.showGrid ?? true}
          stroke="var(--chart-grid)"
          strokeDasharray="3 5"
        />
      )}
      <ScatterChart.XAxis
        dataKey="x"
        type="number"
        name={r.id === "bubble" ? "Traffic" : "Ad spend"}
        unit={r.id === "bubble" ? " req/s" : " USD"}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      <ScatterChart.YAxis
        dataKey="y"
        type="number"
        name={r.id === "bubble" ? "Latency" : "Conversions"}
        unit={r.id === "bubble" ? " ms" : ""}
        width="auto"
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      {r.id === "bubble" && <ScatterChart.ZAxis dataKey="z" name="Requests" range={[50, 340]} />}
      <ScatterChart.Series
        data={data}
        seriesKey="a"
        shape={(props) => (
          <Symbols
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
        <ScatterChart.Series
          data={data.map((row) => ({ ...row, y: row.social }))}
          seriesKey="b"
          shape={(props) => (
            <Symbols
              cx={props.cx}
              cy={props.cy}
              type={options.pointShape ?? "diamond"}
              size={options.width ?? 60}
              fill={config.b.color}
            />
          )}
        />
      )}
      <ScatterChart.Tooltip
        zDimension={r.id === "bubble" ? { dataKey: "z", name: "Requests" } : undefined}
        valueAnimation={animate ? "shuffle" : undefined}
      />
      {options.showLegend !== false && (
        <ScatterChart.Legend aria-label={`Focus series for ${r.tag}`} />
      )}
    </ScatterChart>
  );
}
function ChartExample(props: Parameters<typeof useChartExample>[0]) {
  return useChartExample(props);
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
      <ChartExample
        key={`${replay}-${entered}`}
        recipe={recipe}
        material={material}
        config={config}
        animate={chartAnimate}
        replay={replay}
        options={options}
      />
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
