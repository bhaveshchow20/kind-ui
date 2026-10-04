"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const rows = ["North", "South", "East", "West"];
const columns = ["Apr", "May", "Jun", "Jul"];
const data: readonly Chart.HeatmapDatum[] = [
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
const scale = Chart.createHeatmapScale({
  domain: [-20, 20],
  colors: ["#9a3412", "#fff7ed", "#1e40af"],
});
const formatValue = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

export function RegionalHeatmap() {
  return (
    <Chart.HeatmapChart
      rows={rows}
      columns={columns}
      data={data}
      scale={scale}
      formatValue={formatValue}
      missingLabel="No report"
      animate
    >
      <Chart.HeatmapGrid
        caption="Regional orders versus target"
        style={{ borderCollapse: "separate", borderSpacing: 3 }}
        cellProps={() => ({ style: { height: "2rem" } })}
      />
      <Chart.HeatmapLegend label="Difference from monthly target" />
      <Chart.HeatmapTooltip valueAnimation="shuffle" />
      <Chart.HeatmapDataTable
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
    </Chart.HeatmapChart>
  );
}
