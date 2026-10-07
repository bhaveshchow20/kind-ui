import type { DemoOptions } from "./demo-options";

export function activityCode(options: DemoOptions = {}, animate = true) {
  return `"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
const rings = [
  { key: "stand", value: ${options.stand ?? 9}, domain: [0, 12] as const },
  { key: "exercise", value: ${options.exercise ?? 30}, domain: [0, 60] as const },
  { key: "move", value: ${options.progress ?? 350}, domain: [0, 500] as const },
];
const config = {
  move: { label: "Move", color: "#fa315c", formatValue: (v: unknown) => v + " kcal" },
  exercise: { label: "Exercise", color: "#a4e936", formatValue: (v: unknown) => v + " min" },
  stand: { label: "Stand", color: "#29cbe0", formatValue: (v: unknown) => v + " hours" },
};
export function DailyActivity() {
  return <Chart.ActivityRings rings={rings} config={config} animate={${animate}}
    barGap={${options.gap ?? 5}} innerRadius="28%" outerRadius="90%"
    series={{cornerRadius: 20, background: {fill: "var(--muted)"}}}
    rootProps={{style: {border:0,padding:0,background:"transparent"}}} tooltip={{valueAnimation:${animate} ? "shuffle" : undefined}}
    responsive style={{width: "100%", height: 270}} aria-label="Daily activity" />;
}
`;
}
