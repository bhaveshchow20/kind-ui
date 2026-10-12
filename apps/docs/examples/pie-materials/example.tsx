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

export function AllocationMaterialChart({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
}) {
  return (
    <figure style={{ margin: 0 }}>
      <>
        <>
          <PieChart
            legendPosition="top"
            config={config}
            defaultVisibleSeries={Object.keys(config)}
            interaction={{ kind: "category", eligibleKeys: data.map((row) => row.key) }}
            width="100%"
            height={280}
            animate
            accessibilityLayer
            aria-label="Team allocation: 1,000 hours"
          >
            <PieChart.Series
              data={data}
              dataKey="hours"
              nameKey="key"
              categoryKey="key"
              innerRadius={58}
              {...(appearance !== "default" ? { material: appearance } : {})}
              outerRadius={108}
              paddingAngle={0}
            >
              {data.map((row) => (
                <PieChart.Cell key={row.key} fill={config[row.key].color} />
              ))}
              <PieChart.Labels
                dataKey="share"
                position="inside"
                fill="white"
                stroke="none"
                style={{ fill: "white", fontWeight: 600 }}
              />
            </PieChart.Series>
            <PieChart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
            <PieChart.Legend />
          </PieChart>
        </>
      </>
    </figure>
  );
}
