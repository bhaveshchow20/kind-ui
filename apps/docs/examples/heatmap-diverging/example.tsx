"use client";
import { createHeatmapScale, HeatmapChart, type HeatmapDatum } from "@kind-ui/charts";

const rows = ["North", "South", "East", "West"];
const columns = ["Apr", "May", "Jun", "Jul"];
const data: readonly HeatmapDatum[] = [
  { row: "North", column: "Apr", value: -12 },
  { row: "North", column: "May", value: -6 },
  { row: "North", column: "Jun", value: 0 },
  { row: "North", column: "Jul", value: 14 },
  { row: "South", column: "Apr", value: 4 },
  { row: "South", column: "May", value: 11 },
  { row: "South", column: "Jun", value: 18 },
  { row: "South", column: "Jul", value: 7 },
  { row: "East", column: "Apr", value: -20 },
  { row: "East", column: "May", value: -9 },
  { row: "East", column: "Jun", value: -3 },
  { row: "East", column: "Jul", value: null },
  { row: "West", column: "Apr", value: 2 },
  { row: "West", column: "May", value: 0 },
  { row: "West", column: "Jun", value: 9 },
  { row: "West", column: "Jul", value: 20 },
];
const scale = createHeatmapScale({
  domain: [-20, 20],
  colors: ["#9a3412", "#fff7ed", "#1e40af"],
});
const formatValue = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

export function RegionalHeatmap() {
  return (
    <HeatmapChart
      rows={rows}
      columns={columns}
      data={data}
      scale={scale}
      formatValue={formatValue}
      missingLabel="No report"
      animate
      config={{}}
      aria-label="Regional orders versus monthly target"
    >
      <HeatmapChart.Grid
        caption="Regional orders versus target"
        style={{ borderCollapse: "separate", borderSpacing: 3 }}
        cellProps={() => ({ style: { height: "2rem" } })}
      />
      <HeatmapChart.Legend label="Difference from monthly target" />
      <HeatmapChart.Tooltip valueAnimation="shuffle" />
      <HeatmapChart.DataTable
        caption="Regional orders versus target, exact values"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      />
    </HeatmapChart>
  );
}
