"use client";

import { RadialBarChart, type SeriesConfig } from "@kind-ui/charts";

const percent = (value: unknown) => `${value}%`;

const config = {
  design: { label: "Design", color: "#733bff", formatValue: percent },
  build: { label: "Build", color: "#008b83", formatValue: percent },
  review: { label: "Review", color: "#b85c13", formatValue: percent },
} satisfies SeriesConfig;

const data = [
  { stage: "design", label: "Design 92%", progress: 92 },
  { stage: "build", label: "Build 76%", progress: 76 },
  { stage: "review", label: "Review 58%", progress: 58 },
];

export default function ProjectProgressChart() {
  return (
    <RadialBarChart
      config={config}
      data={data}
      categoryKey="stage"
      height={280}
      animate
      startAngle={90}
      endAngle={-270}
      innerRadius="18%"
      outerRadius="94%"
      barCategoryGap="4%"
      aria-label="Project completion by stage"
    >
      <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
      <RadialBarChart.RadiusAxis type="category" dataKey="stage" tick={false} axisLine={false} />
      <RadialBarChart.Series dataKey="progress" background cornerRadius={5}>
        <RadialBarChart.Labels dataKey="label" fill="white" content={<RadialBarChart.Label />} />
      </RadialBarChart.Series>
      <RadialBarChart.Tooltip
        itemKey={(entry) => entry.payload.stage}
        labelFormatter={() => "Completion"}
      />
    </RadialBarChart>
  );
}
