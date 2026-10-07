"use client";
import * as Chart from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";
import {
  type BoxRow,
  boxRows,
  conversionData,
  heatmapData,
  histogramBins,
  type NewRecipe,
  sankeyData,
  waterfallEntries,
} from "@/lib/new-chart-recipes";

function NewChart({
  recipe: r,
  material,
  colors,
  animate,
  entranceKey,
  options = {},
}: {
  recipe: NewRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  entranceKey: string;
  options?: DemoOptions;
}) {
  const [distributionVisible, setDistributionVisible] = useState([
    r.family === "Histogram" ? "count" : "spread",
  ]);
  const bins = useMemo(() => histogramBins(r.id), [r.id]);
  const rows = useMemo(() => boxRows(r.id), [r.id]);
  const heat = useMemo(() => heatmapData(r.id), [r.id]);
  const water = useMemo(() => Chart.computeWaterfallData(waterfallEntries(r.id)), [r.id]);
  const flow = useMemo(() => sankeyData(r.id), [r.id]);
  const scale = useMemo(
    () => Chart.createHeatmapScale({ domain: [0, heat.max], colors }),
    [heat.max, colors],
  );
  if (r.family === "Line") {
    return (
      <Chart.LineChart
        key={entranceKey}
        data={conversionData}
        config={{
          trials: { label: "Trial starts", color: colors[0] },
          paid: { label: "Paid conversions", color: colors[1] },
        }}
        xDataKey="month"
        responsive
        style={{ width: "100%", height: 280 }}
        rootProps={{ className: "chart-root" }}
        animate={animate}
        material={material}
        curve={options.curve ?? "monotone"}
        series={[
          {
            seriesKey: "trials",
            dataKey: "trials",
            dot: options.dots ?? false,
            strokeWidth: options.strokeWidth ?? 3,
          },
          {
            seriesKey: "paid",
            dataKey: "paid",
            dot: options.dots ?? false,
            strokeWidth: options.strokeWidth ?? 3,
          },
        ]}
        aria-label={r.tag}
        yAxis={{ width: "auto", tick: { fontSize: 11 } }}
        xAxis={{ tick: { fontSize: 11 } }}
        grid={
          options.showGrid === false
            ? false
            : { stroke: "var(--chart-grid)", vertical: false, strokeDasharray: "3 5" }
        }
        legend={options.showLegend === false ? false : undefined}
        tooltip={{ valueAnimation: animate ? "shuffle" : undefined }}
      />
    );
  }
  if (r.family === "Histogram") {
    const latency = r.id === "histogram-latency";
    const density = options.density ?? latency;
    return (
      <Chart.Root
        key={entranceKey}
        className="chart-root"
        visibleSeries={distributionVisible}
        onVisibleSeriesChange={setDistributionVisible}
        config={{
          count: { label: density ? "Density" : latency ? "Requests" : "Orders", color: colors[0] },
        }}
      >
        <div className="chart-canvas">
          <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <Chart.HistogramChart
              bins={bins}
              measure={density ? "density" : "count"}
              animate={animate}
              aria-label={r.tag}
              margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
              xAxisProps={{
                tickLine: false,
                axisLine: false,
                tick: { fontSize: 11 },
                tickFormatter: (value) => (latency ? `${value} ms` : `$${value}`),
              }}
              yAxisProps={{
                width: "auto",
                tickLine: false,
                axisLine: false,
                tick: { fontSize: 11 },
                ...(density ? { tickFormatter: (value: number) => value.toFixed(3) } : {}),
              }}
            >
              <Chart.CartesianGrid
                horizontal={options.showGrid ?? true}
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <Chart.HistogramSeries
                material={material}
                stroke={options.binBorders === false ? "none" : "var(--background)"}
                strokeWidth={1.5}
              />
              <Chart.Tooltip
                valueAnimation={animate ? "shuffle" : undefined}
                labelFormatter={(_label, entries) => {
                  const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
                  return bin ? `${bin.lower}–${bin.upper} ${latency ? "ms" : "USD"}` : "";
                }}
                formatter={(value) => [
                  density ? Number(value).toFixed(4) : String(value),
                  density
                    ? latency
                      ? "Density per ms"
                      : "Density per dollar"
                    : latency
                      ? "Requests"
                      : "Orders",
                ]}
              />
            </Chart.HistogramChart>
          </Chart.ResponsiveContainer>
        </div>
        {options.showLegend !== false && <Chart.Legend />}
      </Chart.Root>
    );
  }
  if (r.family === "Box Plot") {
    const horizontal = r.id === "box-regions";
    return (
      <Chart.Root
        key={entranceKey}
        className="chart-root"
        visibleSeries={distributionVisible}
        onVisibleSeriesChange={setDistributionVisible}
        config={{
          spread: {
            label: horizontal ? "Weekly growth" : "Request time",
            color: colors[0],
          },
        }}
      >
        <div className="chart-canvas">
          <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <Chart.BoxPlotChart
              data={rows}
              layout={horizontal ? "vertical" : "horizontal"}
              animate={animate}
              aria-label={r.tag}
              margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
            >
              <Chart.CartesianGrid
                vertical={horizontal && (options.showGrid ?? true)}
                horizontal={!horizontal && (options.showGrid ?? true)}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <Chart.XAxis
                type={horizontal ? "number" : "category"}
                {...(horizontal
                  ? {
                      domain: ["dataMin", "dataMax"],
                      tickFormatter: (value: number) => `${value} pp`,
                    }
                  : { dataKey: "category" })}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Chart.YAxis
                width="auto"
                type={horizontal ? "category" : "number"}
                {...(horizontal
                  ? { dataKey: "category" }
                  : {
                      domain: [0, "dataMax"],
                      tickFormatter: (value: number) => `${value} ms`,
                    })}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Chart.ReferenceLine
                {...(horizontal ? { x: 0 } : { y: 0 })}
                stroke="var(--chart-axis)"
              />
              <Chart.BoxPlotSeries<BoxRow>
                strokeWidth={options.strokeWidth ?? 3}
                dataKey="summary"
                seriesKey="spread"
                barSize={options.width ?? 32}
                outlierRadius={options.outlierRadius ?? 3}
                material={material}
                fillOpacity={0.65}
              />
              <Chart.Tooltip
                valueAnimation={animate ? "shuffle" : undefined}
                formatter={(_value, _name, item) => [
                  String((item.payload as BoxRow).summary.median) + (horizontal ? " pp" : " ms"),
                  "Median",
                ]}
              />
            </Chart.BoxPlotChart>
          </Chart.ResponsiveContainer>
        </div>
        {options.showLegend !== false && <Chart.Legend />}
      </Chart.Root>
    );
  }
  if (r.family === "Heatmap")
    return (
      <Chart.HeatmapChart
        key={entranceKey}
        className="showcase-heatmap"
        rows={heat.rows}
        columns={heat.columns}
        data={heat.data}
        scale={scale}
        animate={animate}
        formatValue={(value) => (r.id === "heatmap-retention" ? `${value}%` : String(value))}
      >
        <Chart.HeatmapGrid
          caption={r.tag}
          material={material}
          layout={{
            gap: options.gap ?? 4,
            rowLabels: options.showLabels === false ? "hidden" : "visible",
            columnLabels: options.showLabels === false ? "hidden" : "visible",
          }}
          cellProps={() => ({ style: { borderRadius: options.radius ?? 5 } })}
          Cell={(options.showValues ?? r.id === "heatmap-retention") ? undefined : () => null}
        />
        <Chart.HeatmapLegend label={r.id === "heatmap-retention" ? "Active users" : "Tickets"} />
        <Chart.HeatmapTooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.HeatmapChart>
    );
  if (r.family === "Waterfall")
    return (
      <Chart.Root
        key={entranceKey}
        className="chart-root"
        config={{ range: { label: "Balance", color: colors[0] } }}
      >
        <div className="chart-canvas">
          <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <Chart.WaterfallChart
              data={water}
              animate={animate}
              accessibilityLayer
              aria-label={r.tag}
              margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
            >
              <Chart.CartesianGrid
                horizontal={options.showGrid ?? true}
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <Chart.XAxis
                dataKey="id"
                tickFormatter={(id) => water.find((row) => row.id === id)?.label ?? String(id)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Chart.YAxis
                width="auto"
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Chart.ReferenceLine y={0} stroke="var(--chart-axis)" />
              {(options.connectors ?? true) && (
                <Chart.WaterfallConnectors data={water} stroke="var(--chart-axis)" />
              )}
              <Chart.WaterfallSeries
                material={material}
                radius={options.radius ?? 4}
                maxBarSize={options.width ?? 35}
              >
                {water.map((row) => (
                  <Chart.Cell
                    key={row.id}
                    fill={colors[row.kind !== "delta" ? 0 : (row.value ?? 0) < 0 ? 2 : 1]}
                  />
                ))}
              </Chart.WaterfallSeries>
              <Chart.Tooltip
                formatter={(_value, _name, item) => {
                  const row = item.payload as Chart.WaterfallDatum;
                  return [`$${row.value?.toLocaleString("en-US")}`, row.label];
                }}
              />
            </Chart.WaterfallChart>
          </Chart.ResponsiveContainer>
        </div>
      </Chart.Root>
    );
  return (
    <div className="showcase-sankey">
      <div className="chart-canvas">
        <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <Chart.SankeyChart
            key={entranceKey}
            data={flow}
            animate={animate}
            nodeWidth={options.nodeWidth ?? 12}
            nodePadding={options.nodePadding ?? 24}
            margin={{ top: 12, bottom: 12, left: 65, right: 85 }}
            node={(props) => (
              <g>
                <Chart.SankeyNode {...props} color={colors[props.index % colors.length]} />
                {options.showLabels !== false && (
                  <text
                    x={props.x < 100 ? props.x - 8 : props.x + props.width + 8}
                    y={props.y + props.height / 2}
                    textAnchor={props.x < 100 ? "end" : "start"}
                    dominantBaseline="middle"
                    fill="currentColor"
                    fontSize={11}
                  >
                    {props.payload.name}
                  </text>
                )}
              </g>
            )}
            link={(props) => (
              <Chart.SankeyLink
                {...props}
                material="gradient"
                color={
                  colors[
                    flow.nodes.findIndex((node) => node.id === props.payload.source.id) %
                      colors.length
                  ]
                }
                targetColor={
                  colors[
                    flow.nodes.findIndex((node) => node.id === props.payload.target.id) %
                      colors.length
                  ]
                }
                pathProps={{ opacity: options.linkOpacity ?? 0.45 }}
              />
            )}
          />
        </Chart.ResponsiveContainer>
      </div>
      <Chart.SankeyTable data={flow} caption={r.tag} className="sr-only" />
    </div>
  );
}
export function NewChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  recipe: NewRecipe;
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
      <NewChart
        entranceKey={`${replay}-${chartAnimate}`}
        recipe={recipe}
        material={material}
        colors={colors}
        animate={chartAnimate}
        options={options}
      />
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
