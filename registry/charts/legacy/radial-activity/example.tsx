"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { key: "move", value: 350, domain: [0, 500] as const },
  { key: "exercise", value: 30, domain: [0, 60] as const },
  { key: "stand", value: 9, domain: [0, 12] as const },
];
const config = {
  move: { label: "Move", color: "#e02266", formatValue: (value: unknown) => `${value} kcal` },
  exercise: {
    label: "Exercise",
    color: "#327448",
    formatValue: (value: unknown) => `${value} min`,
  },
  stand: { label: "Stand", color: "#2469d4", formatValue: (value: unknown) => `${value} hours` },
} satisfies Chart.SeriesConfig;

function DailyActivityChartComposition({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.ActivityRings
      loading={state === "loading"}
      rings={data}
      config={config}
      rootProps={{
        defaultVisibleSeries: Object.keys(config),
        interaction: { kind: "category", eligibleKeys: data.map((ring) => ring.key) },
      }}
      aria-label="Daily activity"
    />
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function DailyActivityChart(props: import("react").ComponentProps<typeof DailyActivityChartComposition>) {
  return (
    <div className="chart-example">
      <DailyActivityChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Activity rings data">
          <caption>{"Daily activity: Move (kcal), Exercise (minutes), Stand (hours)"}</caption>
          <thead><tr><th scope="col">{"Activity"}</th><th scope="col">{"Original value"}</th></tr></thead>
          <tbody><tr><th scope="row">{"move"}</th><td>{350}</td></tr><tr><th scope="row">{"exercise"}</th><td>{30}</td></tr><tr><th scope="row">{"stand"}</th><td>{9}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
