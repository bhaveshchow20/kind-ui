"use client";
import { RadialBarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Design", label: "Design 92%", progress: 92 },
  { period: "Build", label: "Build 76%", progress: 76 },
  { period: "Review", label: "Review 58%", progress: 58 },
];
const config = {
  Design: { label: "Design", color: "#733bff", formatValue: (value: unknown) => `${value}%` },
  Build: { label: "Build", color: "#008b83", formatValue: (value: unknown) => `${value}%` },
  Review: { label: "Review", color: "#b85c13", formatValue: (value: unknown) => `${value}%` },
} satisfies SeriesConfig;

export function ProjectProgressChart({
  labels = "visible",
}: {
  labels?: "hidden" | "visible" | "loading";
}) {
  return (
    <RadialBarChart
      config={config}
      height={280}
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
      <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
      <RadialBarChart.RadiusAxis type="category" dataKey="period" tick={false} axisLine={false} />
      <RadialBarChart.Series dataKey="progress" background={{ fill: "#e9e5f1" }} cornerRadius={5}>
        {labels === "visible" && (
          <RadialBarChart.Labels
            fill="white"
            dataKey="label"
            content={<RadialBarChart.Label fontSize={11} />}
          />
        )}
      </RadialBarChart.Series>
      <RadialBarChart.Tooltip itemKey={(entry) => String(entry.payload?.period ?? entry.name)} />
    </RadialBarChart>
  );
}
