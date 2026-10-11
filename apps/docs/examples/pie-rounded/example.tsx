"use client";
import { PieChart, type SeriesConfig } from "@kind-ui/charts";

const config = {
  design: { label: "Design", color: "#733bff", formatValue: (value: unknown) => `${value} hours` },
  engineering: {
    label: "Engineering",
    color: "#2469d4",
    formatValue: (value: unknown) => `${value} hours`,
  },
  operations: {
    label: "Operations",
    color: "#b65c16",
    formatValue: (value: unknown) => `${value} hours`,
  },
  research: {
    label: "Research",
    color: "#147c68",
    formatValue: (value: unknown) => `${value} hours`,
  },
} satisfies SeriesConfig;
const data: { key: keyof typeof config; hours: number; share: string }[] = [
  { key: "design", hours: 420, share: "42%" },
  { key: "engineering", hours: 310, share: "31%" },
  { key: "operations", hours: 170, share: "17%" },
  { key: "research", hours: 100, share: "10%" },
];

export function RoundedAllocationChart({
  geometry = "rounded-donut",
}: {
  geometry?: "rounded-pie" | "rounded-donut" | "petal-donut";
}) {
  const petal = geometry === "petal-donut";
  const pie = geometry === "rounded-pie";
  return (
    <>
      <>
        <PieChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          interaction={{ kind: "category", eligibleKeys: data.map((row) => row.key) }}
          width="100%"
          height={280}
          animate={false}
          accessibilityLayer
          aria-label={`${pie ? "Rounded pie" : petal ? "Petal donut" : "Rounded donut"}: team allocation, 1,000 hours`}
        >
          <PieChart.Series
            data={data}
            dataKey="hours"
            nameKey="key"
            categoryKey="key"
            innerRadius={pie ? 0 : petal ? 68 : 58}
            outerRadius={108}
            startAngle={90}
            endAngle={-270}
            cornerRadius={petal ? 20 : 8}
            paddingAngle={petal ? 8 : 2}
          />
          <PieChart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
          <PieChart.Legend aria-label="Allocation categories" />
        </PieChart>
      </>
    </>
  );
}
