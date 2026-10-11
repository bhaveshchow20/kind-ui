"use client";
import { BarChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Design ops", hours: 42 },
  { period: "Research", hours: 36 },
  { period: "Prototyping", hours: 28 },
  { period: "Testing", hours: 24 },
  { period: "Review", hours: 18 },
];
const config = {
  hours: { label: "Hours", color: "#14a39a", formatValue: (value) => `${value} h` },
} satisfies SeriesConfig;

export function WorkshopHoursChart() {
  return (
    <figure style={{ margin: 0 }}>
      <>
        <>
          <BarChart
            legendPosition="top"
            config={config}
            defaultVisibleSeries={Object.keys(config)}
            width="100%"
            height={280}
            data={data}
            layout="vertical"
            animate
            accessibilityLayer
            emphasis="category"
            margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
            aria-label="Workshop hours by topic"
          >
            <BarChart.Grid vertical horizontal={false} strokeDasharray="3 3" stroke="#ccc" />
            <BarChart.XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              height={40}
              interval="preserveStartEnd"
              minTickGap={32}
              tick={{ fill: "#666" }}
            />
            <BarChart.YAxis
              type="category"
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={160}
              interval={0}
              tick={{ fill: "#666" }}
            />
            <BarChart.Series dataKey="hours" radius={[0, 5, 5, 0]} maxBarSize={28} />
            <BarChart.Tooltip />
            <BarChart.Legend />
          </BarChart>
        </>
      </>
    </figure>
  );
}
