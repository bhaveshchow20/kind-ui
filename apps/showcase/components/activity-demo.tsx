"use client";
import * as Chart from "@kind-ui/charts";
import { useReducedMotion } from "motion/react";
import type { DemoOptions } from "@/lib/demo-options";

export function ActivityDemo({ options }: { options: DemoOptions }) {
  const reduced = useReducedMotion();
  return (
    <article className="chart-card activity-card">
      <div className="card-top">
        <h3 className="chart-tag">Daily activity</h3>
      </div>
      <Chart.ActivityRings
        rings={[
          { key: "stand", value: options.stand ?? 9, domain: [0, 12] },
          { key: "exercise", value: options.exercise ?? 30, domain: [0, 60] },
          { key: "move", value: options.progress ?? 350, domain: [0, 500] },
        ]}
        config={{
          move: { label: "Move", color: "#fa315c", formatValue: (v: unknown) => `${v} kcal` },
          exercise: {
            label: "Exercise",
            color: "#a4e936",
            formatValue: (v: unknown) => `${v} min`,
          },
          stand: { label: "Stand", color: "#29cbe0", formatValue: (v: unknown) => `${v} hours` },
        }}
        animate={!reduced}
        barGap={options.gap ?? 5}
        innerRadius="28%"
        outerRadius="90%"
        series={{ cornerRadius: 20, background: { fill: "var(--muted)" } }}
        rootProps={{ className: "chart-root" }}
        tooltip={{ valueAnimation: reduced ? undefined : "shuffle" }}
        responsive
        style={{ width: "100%", height: 270 }}
        aria-label="Daily activity"
      />
    </article>
  );
}
