"use client";
import { type ComboAnimation, ComboChart, type SeriesConfig } from "@kind-ui/charts";

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
} satisfies SeriesConfig;

type Entrance = "independent" | "together" | "lineOnly";
const entrances = {
  independent: {
    areaReveal: false,
    barReveal: { revealDurationMs: 1000 },
    lineReveal: { revealDurationMs: 600 },
  },
  together: { revealDurationMs: 900 },
  lineOnly: { areaReveal: false, barReveal: false, lineReveal: { revealDurationMs: 900 } },
} satisfies Record<Entrance, ComboAnimation>;

export function ProductionMotionChart({ entrance = "independent" }: { entrance?: Entrance }) {
  return (
    <>
      <>
        <ComboChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          key={entrance}
          data={data}
          animate={entrances[entrance]}
          accessibilityLayer
          margin={{ top: 20, right: 20, bottom: 8, left: 0 }}
          aria-label="Monthly production, capacity and target in units"
        >
          <ComboChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
          <ComboChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={40}
            tick={{ fill: "#666" }}
          />
          <ComboChart.YAxis
            domain={[0, 1200]}
            ticks={[0, 400, 800, 1200]}
            width={80}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tick={{ fill: "#666" }}
          />
          <ComboChart.Area dataKey="capacity" type="stepAfter" fillOpacity={0.18} strokeWidth={1} />
          <ComboChart.Bar dataKey="shipped" maxBarSize={32} radius={[4, 4, 0, 0]} />
          <ComboChart.Line
            dataKey="target"
            type="linear"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
          />
          <ComboChart.Tooltip maxWidth={200} />
          <ComboChart.Legend />
        </ComboChart>
      </>
    </>
  );
}
