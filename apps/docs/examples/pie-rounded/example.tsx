"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

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
} satisfies Chart.SeriesConfig;
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
    <Chart.Root
      config={config}
      defaultVisibleSeries={Object.keys(config)}
      interaction={{ kind: "category", eligibleKeys: data.map((row) => row.key) }}
    >
      <Chart.Legend aria-label="Allocation categories" />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart
          animate={false}
          accessibilityLayer
          aria-label={`${pie ? "Rounded pie" : petal ? "Petal donut" : "Rounded donut"}: team allocation, 1,000 hours`}
        >
          <Chart.PieSeries
            interactionBinding="root"
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
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
      <div className="sr-only">
        <table>
          <caption>Team allocation (1,000 hours)</caption>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Hours</th>
              <th scope="col">Share of total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.key}>
                <th scope="row">{config[row.key].label}</th>
                <td>{row.hours}</td>
                <td>{row.share}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chart.Root>
  );
}
