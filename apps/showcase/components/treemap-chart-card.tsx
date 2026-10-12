"use client";

import { TreemapChart } from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";
import {
  type TreemapRecipe,
  type TreemapRecord,
  treemapAccessors,
  treemapArea,
  treemapData,
  treemapEncoding,
  treemapMetric,
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
  const chartAnimate = animate && entered && !reduced;
  const [showData, setShowData] = useState(false);
  const data = useMemo(() => treemapData(recipe.id), [recipe.id]);
  const encoding = useMemo(() => treemapEncoding(recipe, colors), [recipe, colors]);
  const holdings = recipe.id === "treemap-exposure";
  const area = (value: number) => treemapArea(recipe.id, value);
  const metric = (value: number | null | undefined) => treemapMetric(recipe.id, value);
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
      <TreemapChart<TreemapRecord>
        key={`${replay}-${chartAnimate}`}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        height={235}
        config={{}}
        aria-label={recipe.tag}
        data={data}
        accessors={treemapAccessors}
        encoding={encoding}
        padding={options.gap ?? 3}
        groupHeaderHeight={22}
        layout="stable"
        animate={chartAnimate}
        formatValue={area}
      >
        <TreemapChart.Groups<TreemapRecord> />
        <TreemapChart.Tiles<TreemapRecord>
          tileProps={() => ({
            style: {
              borderRadius: options.radius ?? 4,
              borderColor: "var(--background, #fff)",
              ...(material === "clay"
                ? { boxShadow: "inset 0 1px 0 #ffffff60, inset 0 -2px 3px #00000012" }
                : material === "glow"
                  ? { boxShadow: "inset 0 0 0 1px #ffffff40" }
                  : {}),
            },
          })}
        />
        {options.showLabels !== false && (
          <TreemapChart.Labels<TreemapRecord> minWidth={45} minHeight={18} padding={6}>
            {(node) => (
              <>
                <strong className="block truncate">{node.label}</strong>
                {options.showValues !== false && node.height >= 44 && (
                  <span className="block tabular-nums">{metric(node.datum.metric)}</span>
                )}
              </>
            )}
          </TreemapChart.Labels>
        )}
        <TreemapChart.Tooltip<TreemapRecord>>
          {(node) => (
            <>
              <strong>{node.label}</strong>
              <div>{area(node.value)}</div>
              {holdings && (
                <div>
                  {node.kind === "group"
                    ? "Group total"
                    : `Signed position: ${metric(node.datum.signedPosition)}`}
                </div>
              )}
              <div>
                {node.kind === "group"
                  ? "Color metric is not aggregated"
                  : metric(node.datum.metric)}
              </div>
              <div>
                {node.rootShare == null
                  ? "—"
                  : `${(node.rootShare * 100).toFixed(1)}% of supplied ${holdings ? "gross positions" : "sample"}`}
              </div>
            </>
          )}
        </TreemapChart.Tooltip>
        <TreemapChart.Breadcrumbs rootLabel={`All ${holdings ? "positions" : "sectors"}`} />
        {options.showLegend !== false && <TreemapChart.ColorLegend />}
        <TreemapChart.Content>
          <button
            type="button"
            className="mt-2 text-xs text-[var(--muted-foreground)] underline underline-offset-4"
            aria-expanded={showData}
            onClick={() => setShowData((current) => !current)}
          >
            {showData ? "Hide data" : "View data"}
          </button>
        </TreemapChart.Content>
        {showData && (
          <TreemapChart.DataTable<TreemapRecord>
            caption={`${recipe.tag} · supplied sample · October 12`}
            scope="root"
          />
        )}
      </TreemapChart>
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
        {recipe.areaLabel} · {recipe.colorLabel} · Illustrative snapshot
        {holdings ? " · Share of gross positions, not NAV" : " · Share of supplied sample"}
      </p>
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
