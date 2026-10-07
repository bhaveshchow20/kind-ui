"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { id: "retail", value: 35 },
  { id: "service", value: 45 },
  { id: "other", value: 20 },
];
const categoryConfig = {
  retail: { color: "#2563eb" },
  service: { color: "#0f766e" },
  other: { color: "#7c3aed" },
} satisfies Chart.SeriesConfig;
export function PieOptions({
  status = "ready",
}: {
  status?: "ready" | "loading" | "selective-glow";
}) {
  const loading = status === "loading";
  return (
    <Chart.Root
      config={categoryConfig}
      interaction={{
        kind: "category",
        mode: "focus",
        eligibleKeys: data.map((row) => row.id),
        markActivation: "matching-legend",
      }}
    >
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.PieChart
          accessibilityLayer
          defaultPinnedCategory="service"
          loading={loading}
          loadingLabel="Loading allocation"
          aria-label="Allocation; retail 35, service 45, other 20"
        >
          <Chart.PieSeries
            data={data}
            dataKey="value"
            categoryKey="id"
            interactionBinding="root"
            glowCategories={status === "selective-glow" ? ["service"] : []}
            innerRadius={58}
            outerRadius={108}
            cornerRadius={8}
            paddingAngle={2}
          />
          <Chart.Tooltip itemKey={(entry) => entry.payload.id} />
        </Chart.PieChart>
      </Chart.ResponsiveContainer>
      <Chart.Legend />
      <div className="sr-only">
        <table>
          <caption>Allocation</caption>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.id}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chart.Root>
  );
}
