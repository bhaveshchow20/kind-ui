"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Design ops", hours: 42 },
  { period: "Research", hours: 36 },
  { period: "Prototyping", hours: 28 },
  { period: "Testing", hours: 24 },
  { period: "Review", hours: 18 },
];
const config = {
  hours: { label: "Hours", color: "#14a39a", formatValue: (value) => `${value} h` },
} satisfies Chart.SeriesConfig;

export function WorkshopHoursChart() {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BarChart
          data={data}
          layout="vertical"
          animate
          accessibilityLayer
          emphasis="category"
          margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
          aria-label="Workshop hours by topic"
        >
          <Chart.CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <Chart.XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <Chart.YAxis
            type="category"
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            width={160}
            interval={0}
          />
          <Chart.BarSeries dataKey="hours" radius={[0, 5, 5, 0]} maxBarSize={28} />
          <Chart.Tooltip />
        </Chart.BarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
