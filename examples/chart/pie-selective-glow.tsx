"use client";
import * as Chart from "@kind-ui/charts";

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

function AllocationMaterialChart({
  material = "plain",
  glowCategories,
}: {
  material?: "plain" | "clay" | "glow";
  glowCategories?: readonly string[];
}) {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart animate accessibilityLayer aria-label="Team allocation: 1,000 hours">
          <Chart.PieSeries
            data={data}
            dataKey="hours"
            categoryKey="key"
            glowCategories={glowCategories}
            nameKey="key"
            innerRadius={58}
            material={material}
            outerRadius={108}
            cornerRadius={8}
            paddingAngle={2}
          >
            {data.map((row) => (
              <Chart.Cell key={row.key} fill={config[row.key].color} />
            ))}
            <Chart.LabelList
              dataKey="share"
              position="inside"
              fill="white"
              stroke="none"
              style={{ fill: "white", fontWeight: 600 }}
            />
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={(entry) => String(entry.payload?.key ?? entry.name)} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}

// The rounded donut geometry from the Pie guide works with the same identity seam.
export function SelectiveGlowChart() {
  return (
    <article className="pie-card" aria-label="Highlighted Design allocation">
      <h2>Selective Design glow</h2>
      <AllocationMaterialChart material="plain" glowCategories={["design"]} />
      <p>Design is highlighted; the allocation values are unchanged.</p>
      <table>
        <caption>Team allocation</caption>
        <tbody>
          {data.map((row) => (
            <tr key={row.key}>
              <th scope="row">{config[row.key].label}</th>
              <td>{row.hours} hours</td>
              <td>{row.share}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
