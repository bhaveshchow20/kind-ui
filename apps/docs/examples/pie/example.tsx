"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const config = {
  design: { label: "Design", color: "#733bff", formatValue: (value: unknown) => `${value} hours` },
  engineering: {
    label: "Engineering",
    color: "#2675e8",
    formatValue: (value: unknown) => `${value} hours`,
  },
  operations: {
    label: "Operations",
    color: "#d87427",
    formatValue: (value: unknown) => `${value} hours`,
  },
  research: {
    label: "Research",
    color: "#188e78",
    formatValue: (value: unknown) => `${value} hours`,
  },
} satisfies Chart.SeriesConfig;
const data: { key: keyof typeof config; hours: number; share: string }[] = [
  { key: "design", hours: 420, share: "42%" },
  { key: "engineering", hours: 310, share: "31%" },
  { key: "operations", hours: 170, share: "17%" },
  { key: "research", hours: 100, share: "10%" },
];

export function TeamAllocationChart({ shape = "pie" }: { shape?: "pie" | "donut" }) {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart animate accessibilityLayer aria-label="Team allocation: 1,000 hours">
          <Chart.PieSeries
            data={data}
            dataKey="hours"
            nameKey="key"
            innerRadius={shape === "donut" ? 58 : 0}
            outerRadius={108}
            paddingAngle={2}
          >
            {data.map((row) => (
              <Chart.Cell key={row.key} fill={config[row.key].color} />
            ))}
            <Chart.LabelList dataKey="share" position="inside" fill="white" stroke="none" />
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
