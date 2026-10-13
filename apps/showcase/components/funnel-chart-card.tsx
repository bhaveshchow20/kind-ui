"use client";
import { FunnelChart } from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import type { Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";
import { checkoutStages, type FunnelRecipe } from "@/lib/funnel-recipes";
import { demoEntry } from "@/lib/utils";

const formatValue = (value: number) => value.toLocaleString("en-US");
export function FunnelChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  recipe: FunnelRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  void material;
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const chartAnimate = animate && entered && !reduced;
  const config = useMemo(
    () =>
      Object.fromEntries(
        checkoutStages.map((stage, index) => [
          stage.id,
          { label: stage.label, color: demoEntry(colors, index % Math.max(1, colors.length)) },
        ]),
      ),
    [colors],
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
      <FunnelChart
        key={`${replay}-${chartAnimate}`}
        data={checkoutStages}
        config={config}
        frameProps={{ className: "chart-root" }}
        responsive
        style={{ width: "100%", height: 220 }}
        aria-label={recipe.tag}
        denominator="first"
        ratioLabel="Share of basket sessions"
        formatValue={formatValue}
        animate={chartAnimate}
      >
        <FunnelChart.Stages geometry="trapezoid" />
        {options.showLabels !== false && (
          <FunnelChart.Labels
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 8,
              fontSize: 11,
            }}
            render={(stage) => (
              <span>
                {stage.label}{" "}
                <strong>{stage.value === null ? "Unknown" : formatValue(stage.value)}</strong>
              </span>
            )}
          />
        )}
        <FunnelChart.Tooltip />
        {options.showLegend !== false && <FunnelChart.Legend />}
      </FunnelChart>
      <p className="chart-context">{recipe.context}</p>
      <div className="sr-only">
        <table>
          <caption>Checkout sessions</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Sessions</th>
              <th scope="col">Share of basket sessions</th>
            </tr>
          </thead>
          <tbody>
            {checkoutStages.map((stage) => (
              <tr key={stage.id}>
                <th scope="row">{stage.label}</th>
                <td>{formatValue(stage.value)}</td>
                <td>{(stage.value / 2400) * 100}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.article>
  );
}
