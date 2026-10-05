"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const columns = Array.from({ length: 26 }, (_, index) => `Week ${index + 1}`);
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({ row, column, value: (r + c) % 5 })),
);
const scale = Chart.createHeatmapScale({ domain: [0, 4], colors: ["#eef4eb", "#327448"] });

export function CompactActivityHeatmap() {
  return (
    <Chart.HeatmapChart rows={rows} columns={columns} data={data} scale={scale}>
      <Chart.HeatmapGrid
        caption="Contributions by day and week"
        layout={{ cellSize: 12, gap: 3, rowLabels: "hidden", columnLabels: "hidden" }}
        Cell={() => <span aria-hidden="true" />}
      />
      <Chart.HeatmapTooltip />
    </Chart.HeatmapChart>
  );
}
