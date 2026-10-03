"use client";
import * as Chart from "@kind-ui/charts";
import * as Recharts from "recharts";
import { Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
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
  const heat = useMemo(() => heatmapData(r.id), [r.id]);
  const water = useMemo(() => Chart.computeWaterfallData(waterfallEntries(r.id)), [r.id]);
  const flow = useMemo(() => sankeyData(r.id), [r.id]);
  const scale = useMemo(
    () => Chart.createHeatmapScale({ domain: [0, heat.max], colors }),
    [heat.max, colors],
  );
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
          <Recharts.ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <Chart.WaterfallChart
              data={water}
              animate={animate}
              accessibilityLayer
              aria-label={r.tag}
              margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
            >
              <Recharts.CartesianGrid
                vertical={false}
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
              />
              <Recharts.XAxis
                dataKey="id"
                tickFormatter={(id) => water.find((row) => row.id === id)?.label ?? String(id)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Recharts.YAxis
                width={48}
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Recharts.ReferenceLine y={0} stroke="var(--chart-axis)" />
              <Chart.WaterfallConnectors data={water} stroke="var(--chart-axis)" />
              <Chart.WaterfallSeries material={material} radius={4}>
                {water.map((row) => (
                  <Recharts.Cell
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
          </Recharts.ResponsiveContainer>
        </div>
      </Chart.Root>
    );
  return (
    <div className="showcase-sankey">
      <div className="chart-canvas">
        <Recharts.ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
        </Recharts.ResponsiveContainer>
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
                  <span className="typescript-badge">TS</span>chart-{recipe.id}.tsx
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
        key={replay}
        recipe={recipe}
        material={material}
        colors={colors}
        animate={animate}
      />
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
