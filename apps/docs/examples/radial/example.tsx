"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

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

export function ProjectProgressChart({
  labels = "hidden",
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
