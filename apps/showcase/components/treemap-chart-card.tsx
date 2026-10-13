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
        padding={options.gap ?? 3}
        groupHeaderHeight={24}
        animate={animate && entered && !reduced}
        formatValue={formatValue}
        interaction={{
          kind: "category",
          mode: "focus",
          eligibleKeys: data.map((node) => node.id),
          markActivation: "matching-legend",
        }}
      >
        <TreemapChart.Groups />
        <TreemapChart.Tiles
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
        {options.showLabels !== false && (
          <TreemapChart.Labels minWidth={40} padding={7}>
            {(node) => (
              <>
                <span className="block truncate">{node.label}</span>
                {options.showValues !== false && node.height >= 48 && (
                  <span className="block mt-1 tabular-nums font-normal">
                    {formatValue(node.value)}
                  </span>
                )}
              </>
            )}
          </TreemapChart.Labels>
        )}
        <TreemapChart.Tooltip valueAnimation="shuffle" />
        {options.showLegend !== false && <TreemapChart.Legend />}
        <TreemapChart.Breadcrumbs
          rootLabel={`All ${recipe.id === "treemap-market" ? "services" : "holdings"}`}
        />
      </TreemapChart>
      <table className="sr-only">
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
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
