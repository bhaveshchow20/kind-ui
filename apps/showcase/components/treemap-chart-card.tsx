"use client";
import { TreemapChart } from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import type { Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";
import {
  type TreemapRecipe,
  treemapArea,
  treemapConfig,
  treemapData,
  treemapRows,
} from "@/lib/treemap-recipes";

export function TreemapChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  recipe: TreemapRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const reduced = useReducedMotion();
  const data = useMemo(() => treemapData(recipe.id), [recipe.id]);
  const config = useMemo(() => treemapConfig(data, colors), [data, colors]);
  const rows = useMemo(() => treemapRows(data), [data]);
  const formatValue = (value: number) => treemapArea(recipe.id, value);
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
      <div className="chart-summary">
        <strong>{recipe.summary}</strong>
        <span>{recipe.summaryLabel}</span>
      </div>
      <TreemapChart
        key={replay}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        height={260}
        config={config}
        aria-label={recipe.tag}
        data={data}
        padding={options.gap ?? 6}
        animate={animate && entered && !reduced}
        formatValue={formatValue}
        interaction={{
          kind: "category",
          mode: "focus",
          eligibleKeys: data.map((node) => node.id),
          markActivation: "matching-legend",
        }}
      >
        <TreemapChart.Tiles
          labels={options.showLabels !== false}
          children={
            options.showLabels !== false && options.showValues === false
              ? (node) => <span className="block truncate p-[5px] text-xs">{node.label}</span>
              : undefined
          }
          tileProps={() => ({
            style: {
              borderRadius: options.radius ?? 4,
              ...(material === "clay"
                ? { boxShadow: "inset 0 1px 0 #ffffff60, inset 0 -2px 3px #00000012" }
                : material === "glow"
                  ? { boxShadow: "inset 0 0 0 1px #ffffff40" }
                  : {}),
            },
          })}
        />
        <TreemapChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} />
        {options.showLegend !== false && <TreemapChart.Legend />}
      </TreemapChart>
      <div className="sr-only">
        <table>
          <caption>
            {recipe.tag} · {recipe.areaLabel} · Synthetic example
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.path}</th>
                <td>{formatValue(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
