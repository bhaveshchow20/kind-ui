"use client";
import * as Chart from "@kind-ui/charts";
import { Check, Copy } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Finish } from "@/lib/advanced-chart-recipes";
import {
  heatmapData,
  conversionData,
  histogramBins,
  boxRows,
  type BoxRow,
  type NewRecipe,
  newCode,
  sankeyData,
  waterfallEntries,
} from "@/lib/new-chart-recipes";

function NewChart({
  recipe: r,
  material,
  colors,
  animate,
}: {
  recipe: NewRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
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
        curve="monotone"
        aria-label={r.tag}
        yAxis={{ width: "auto", tick: { fontSize: 11 } }}
        xAxis={{ tick: { fontSize: 11 } }}
        grid={{
          stroke: "var(--chart-grid)",
          vertical: false,
          strokeDasharray: "3 5",
        }}
        tooltip={{ valueAnimation: animate ? "shuffle" : undefined }}
      />
    );
  }
  if (r.family === "Histogram") {
    const density = r.id === "histogram-latency";
    return (
      <Chart.Root
        className="chart-root"
        visibleSeries={distributionVisible}
        onVisibleSeriesChange={setDistributionVisible}
        config={{
          count: { label: density ? "Density" : "Orders", color: colors[0] },
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
                tickFormatter: (value) => (density ? `${value} ms` : `$${value}`),
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
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <Chart.HistogramSeries material={material} />
              <Chart.Tooltip
                valueAnimation={animate ? "shuffle" : undefined}
                labelFormatter={(_label, entries) => {
                  const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
                  return bin ? `${bin.lower}–${bin.upper} ${density ? "ms" : "USD"}` : "";
                }}
                formatter={(value) => [
                  density ? Number(value).toFixed(4) : String(value),
                  density ? "Density per ms" : "Orders",
                ]}
              />
            </Chart.HistogramChart>
          </Chart.ResponsiveContainer>
        </div>
        <Chart.Legend />
      </Chart.Root>
    );
  }
  if (r.family === "Box Plot") {
    const horizontal = r.id === "box-regions";
    return (
      <Chart.Root
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
                vertical={horizontal}
                horizontal={!horizontal}
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
                dataKey="summary"
                seriesKey="spread"
                barSize={32}
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
        <Chart.Legend />
      </Chart.Root>
    );
  }
  if (r.family === "Heatmap")
    return (
      <Chart.HeatmapChart
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
          Cell={r.id === "heatmap-support" ? () => null : undefined}
        />
        <Chart.HeatmapLegend label={r.id === "heatmap-retention" ? "Active users" : "Tickets"} />
        <Chart.HeatmapTooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.HeatmapChart>
    );
  if (r.family === "Waterfall")
    return (
      <Chart.Root className="chart-root" config={{ range: { label: "Balance", color: colors[0] } }}>
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
              <Chart.WaterfallConnectors data={water} stroke="var(--chart-axis)" />
              <Chart.WaterfallSeries material={material} radius={4}>
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
                  return [`$${row.value?.toLocaleString()}`, row.label];
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
            data={flow}
            animate={animate}
            nodeWidth={12}
            nodePadding={24}
            margin={{ top: 12, bottom: 12, left: 65, right: 85 }}
            node={(props) => (
              <g>
                <Chart.SankeyNode {...props} color={colors[props.index % colors.length]} />
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
                pathProps={{ opacity: 0.45 }}
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
}: {
  recipe: NewRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
}) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const chartAnimate = animate && entered;
  const [copied, setCopied] = useState(false);
  const code = newCode(recipe, material, colors, animate);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
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
        <div className="card-code-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label={`Copy code for ${recipe.tag}`}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
          <span className="action-divider" />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" aria-label="View chart code">
                Code
              </Button>
            </DialogTrigger>
            <DialogContent className="code-dialog">
              <DialogTitle className="sr-only">{recipe.tag} code</DialogTitle>
              <DialogDescription className="sr-only">
                A complete Kind UI chart example with the current palette and motion settings.
              </DialogDescription>
              <div className="code-block-header">
                <span className="code-file">
                  <span className="typescript-badge">TS</span>chart-{recipe.id}
                  .tsx
                </span>
                <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy code">
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
              <CodeBlock code={code} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <NewChart
        key={`${replay}-${entered}`}
        recipe={recipe}
        material={material}
        colors={colors}
        animate={chartAnimate}
      />
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
