"use client";
import { RadialBarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [{ period: "October", committed: 64, reserved: 22 }];
const config = {
  committed: {
    label: "Committed",
    color: "#733bff",
    formatValue: (value: unknown) => `${value} hours`,
  },
  reserved: {
    label: "Reserved",
    color: "#008b83",
    formatValue: (value: unknown) => `${value} hours`,
  },
} satisfies SeriesConfig;

export function TeamCapacityChart() {
  return (
    <>
      <>
        <RadialBarChart
          legendPosition="top"
          config={config}
          interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
          width="100%"
          height={280}
          data={data}
          animate
          startAngle={210}
          endAngle={-30}
          innerRadius="62%"
          outerRadius="90%"
          barCategoryGap="10%"
          aria-label="October team capacity: 64 hours committed and 22 reserved out of 100 hours"
        >
          <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBarChart.RadiusAxis
            type="category"
            dataKey="period"
            tick={false}
            axisLine={false}
          />
          <RadialBarChart.Series
            dataKey="committed"
            stackId="capacity"
            background={{ fill: "#e9e5f1" }}
          />
          <RadialBarChart.Series dataKey="reserved" stackId="capacity" />
          <RadialBarChart.Tooltip />
          <RadialBarChart.Legend aria-label="Capacity allocation" />
        </RadialBarChart>
      </>
    </>
  );
}
