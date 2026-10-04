"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", capacity: 960, shipped: 640, target: 700 },
  { period: "Feb", capacity: 960, shipped: 730, target: 720 },
  { period: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { period: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { period: "May", capacity: 1120, shipped: 920, target: 880 },
  { period: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];
const config = {
  capacity: {
    label: "Capacity · units",
    color: "#b2a0ef",
    formatValue: (value) => `${value} units`,
  },
  shipped: { label: "Shipped · units", color: "#733bff", formatValue: (value) => `${value} units` },
  target: { label: "Target · units", color: "#087f78", formatValue: (value) => `${value} units` },
} satisfies Chart.SeriesConfig;

export function ProductionComboChart() {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.ComboChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 20, bottom: 8, left: 16 }}
          aria-label="Monthly production, capacity and target in units"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
          />
          <Chart.YAxis
            domain={[0, 1200]}
            ticks={[0, 400, 800, 1200]}
            width="auto"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Chart.AreaSeries
            dataKey="capacity"
            type="stepAfter"
            fillOpacity={0.18}
            strokeWidth={1}
          />
          <Chart.BarSeries dataKey="shipped" maxBarSize={32} radius={[4, 4, 0, 0]} />
          <Chart.LineSeries
            dataKey="target"
            type="linear"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
          />
          <Chart.Tooltip maxWidth={200} />
        </Chart.ComboChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
