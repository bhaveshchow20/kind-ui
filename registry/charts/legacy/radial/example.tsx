"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Design", label: "Design 92%", progress: 92 },
  { period: "Build", label: "Build 76%", progress: 76 },
  { period: "Review", label: "Review 58%", progress: 58 },
];
const config = {
  Design: { label: "Design", color: "#733bff", formatValue: (value: unknown) => `${value}%` },
  Build: { label: "Build", color: "#008b83", formatValue: (value: unknown) => `${value}%` },
  Review: { label: "Review", color: "#b85c13", formatValue: (value: unknown) => `${value}%` },
} satisfies Chart.SeriesConfig;

function ProjectProgressChartComposition({
  labels = "visible",
}: {
  labels?: "hidden" | "visible" | "loading";
}) {
  return (
    <Chart.Root config={config}>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.RadialBarChart
          loading={labels === "loading"}
          data={data}
          categoryKey="period"
          animate
          animationDirection="clockwise"
          startAngle={90}
          endAngle={-270}
          innerRadius="18%"
          outerRadius="94%"
          barCategoryGap="4%"
          aria-label="Project completion: Design 92%, Build 76%, Review 58%"
        >
          <Chart.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <Chart.PolarRadiusAxis type="category" dataKey="period" tick={false} axisLine={false} />
          <Chart.RadialBarSeries
            dataKey="progress"
            background={{ fill: "#e9e5f1" }}
            cornerRadius={5}
          >
            {labels === "visible" && (
              <Chart.LabelList
                fill="white"
                dataKey="label"
                content={<Chart.RadialBarLabel fontSize={11} />}
              />
            )}
          </Chart.RadialBarSeries>
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.period ?? entry.name)} />
        </Chart.RadialBarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function ProjectProgressChart(props: import("react").ComponentProps<typeof ProjectProgressChartComposition>) {
  return (
    <div className="chart-example">
      <ProjectProgressChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Radial Chart data">
          <caption>{"Project completion"}</caption>
          <thead><tr><th scope="col">{"Stage"}</th><th scope="col">{"Complete (%)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Design"}</th><td>{92}</td></tr><tr><th scope="row">{"Build"}</th><td>{76}</td></tr><tr><th scope="row">{"Review"}</th><td>{58}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
