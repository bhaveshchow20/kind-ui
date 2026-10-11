import type { DemoOptions } from "./demo-options";

export function activityCode(options: DemoOptions = {}, animate = true) {
  return `"use client";
import { ActivityRings } from "@kind-ui/charts";
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
  return <ActivityRings rings={rings} config={config} animate={${animate}}
    barGap={${options.gap ?? 5}} innerRadius="28%" outerRadius="90%"
    frameProps={{style: {border:0,padding:0,background:"transparent"}}}
    responsive style={{width: "100%", height: 270}} aria-label="Daily activity">
    <ActivityRings.Series cornerRadius={20} background={{fill:"var(--muted)"}} />
    <ActivityRings.Tooltip valueAnimation={${animate} ? "shuffle" : undefined} />
    ${options.showLegend === false ? "" : "<ActivityRings.Legend />"}
  </ActivityRings>;
}
`;
}
