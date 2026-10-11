"use client";
import { PieChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { id: "retail", value: 35 },
  { id: "service", value: 45 },
  { id: "other", value: 20 },
];
const categoryConfig = {
  retail: { color: "#2563eb" },
  service: { color: "#0f766e" },
  other: { color: "#7c3aed" },
} satisfies SeriesConfig;
export function PieOptions({
  status = "ready",
}: {
  status?: "ready" | "loading" | "selective-glow";
}) {
  const loading = status === "loading";
  return (
    <>
      <>
        <PieChart
          config={categoryConfig}
          interaction={{
            kind: "category",
            mode: "focus",
            eligibleKeys: data.map((row) => row.id),
            markActivation: "matching-legend",
          }}
          width="100%"
          height={280}
          accessibilityLayer
          defaultPinnedCategory="service"
          loading={loading}
          loadingLabel="Loading allocation"
          aria-label="Allocation; retail 35, service 45, other 20"
        >
          <PieChart.Series
            data={data}
            dataKey="value"
            categoryKey="id"
            glowCategories={status === "selective-glow" ? ["service"] : []}
            innerRadius={58}
            outerRadius={108}
            cornerRadius={8}
            paddingAngle={2}
          />
          <PieChart.Tooltip itemKey={(entry) => entry.payload.id} />
          <PieChart.Legend />
        </PieChart>
      </>
    </>
  );
}
