"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const rows = ["Mon", "Tue", "Wed", "Thu"];
const columns = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
const data: readonly Chart.HeatmapDatum[] = [
  { row: "Mon", column: "08:00", value: 12 },
  { row: "Mon", column: "10:00", value: 34 },
  { row: "Mon", column: "12:00", value: 48 },
  { row: "Mon", column: "14:00", value: 39 },
  { row: "Mon", column: "16:00", value: 27 },
  { row: "Mon", column: "18:00", value: 8 },
  { row: "Tue", column: "08:00", value: 16 },
  { row: "Tue", column: "10:00", value: 42 },
  { row: "Tue", column: "12:00", value: 56 },
  { row: "Tue", column: "14:00", value: 45 },
  { row: "Tue", column: "16:00", value: 31 },
  { row: "Tue", column: "18:00", value: 0 },
  { row: "Wed", column: "08:00", value: 11 },
  { row: "Wed", column: "10:00", value: 29 },
  { row: "Wed", column: "12:00", value: null },
  { row: "Wed", column: "14:00", value: 41 },
  { row: "Wed", column: "16:00", value: 24 },
  { row: "Wed", column: "18:00", value: 6 },
  { row: "Thu", column: "08:00", value: 18 },
  { row: "Thu", column: "10:00", value: 47 },
  { row: "Thu", column: "12:00", value: 60 },
  { row: "Thu", column: "14:00", value: 52 },
  { row: "Thu", column: "16:00", value: 33 },
];
const scale = Chart.createHeatmapScale({
  domain: [0, 60],
  colors: ["#eff6ff", "#93c5fd", "#2563eb", "#1e3a8a"],
});

export function MaterialHeatmap({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
}) {
  return (
    <Chart.HeatmapChart
      rows={rows}
      columns={columns}
      data={data}
      scale={scale}
      animate
      missingLabel="No report"
    >
      <Chart.HeatmapGrid
        caption="Support requests by day and hour"
        style={{ borderCollapse: "separate", borderSpacing: 3 }}
        cellProps={() => ({ style: { height: "2rem" } })}
        material={appearance === "default" ? undefined : appearance}
      />
      <Chart.HeatmapLegend label="Requests per two-hour interval" />
      <Chart.HeatmapTooltip valueAnimation="shuffle" />
      <Chart.HeatmapDataTable
        caption="Support requests, exact values"
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
