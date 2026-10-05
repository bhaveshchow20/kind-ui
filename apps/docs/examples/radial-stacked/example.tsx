"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";

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
} satisfies Chart.SeriesConfig;

export function TeamCapacityChart() {
  const [visible, setVisible] = useState<string[]>(["committed", "reserved"]);
  return (
    <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
      <Chart.Legend aria-label="Capacity allocation" />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.RadialBarChart
          data={data}
          animate
          startAngle={210}
          endAngle={-30}
          innerRadius="62%"
          outerRadius="90%"
          barCategoryGap="10%"
          aria-label="October team capacity: 64 hours committed and 22 reserved out of 100 hours"
        >
          <Chart.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <Chart.PolarRadiusAxis type="category" dataKey="period" tick={false} axisLine={false} />
          <Chart.RadialBarSeries
            dataKey="committed"
            stackId="capacity"
            background={{ fill: "#e9e5f1" }}
          />
          <Chart.RadialBarSeries dataKey="reserved" stackId="capacity" />
          <Chart.Tooltip />
        </Chart.RadialBarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
