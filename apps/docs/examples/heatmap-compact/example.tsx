"use client";
import { createHeatmapScale, HeatmapChart } from "@kind-ui/charts";

const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const columns = Array.from({ length: 26 }, (_, index) => `Week ${index + 1}`);
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({ row, column, value: (r + c) % 5 })),
);
const scale = createHeatmapScale({ domain: [0, 4], colors: ["#eef4eb", "#327448"] });

export function CompactActivityHeatmap() {
  return (
    <div style={{ containerType: "inline-size", minWidth: 0, width: "100%" }}>
      <HeatmapChart
        rows={rows}
        columns={columns}
        data={data}
        scale={scale}
        config={{}}
        aria-label="Heatmap chart"
      >
        <HeatmapChart.Grid
          caption="Contributions by day and week"
          layout={{
            cellSize: "clamp(6px, calc((100cqw - 84px) / 26), 28px)",
            gap: 3,
            rowLabels: "hidden",
            columnLabels: "hidden",
          }}
          Cell={() => <span aria-hidden="true" />}
        />
        <HeatmapChart.Tooltip />
      </HeatmapChart>
    </div>
  );
}
