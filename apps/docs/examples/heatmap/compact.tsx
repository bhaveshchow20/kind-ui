"use client";

import { createHeatmapScale, HeatmapChart } from "@kind-ui/charts";

const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const columns = Array.from({ length: 26 }, (_, index) => `Week ${index + 1}`);
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({ row, column, value: (r * 3 + c * 7) % 5 })),
);

const scale = createHeatmapScale({ domain: [0, 4], colors: ["#e8f3ec", "#2f7d4a"] });

export default function ActivityHeatmap() {
  return (
    <div style={{ containerType: "inline-size" }}>
      <HeatmapChart
        config={{}}
        rows={rows}
        columns={columns}
        data={data}
        scale={scale}
        aria-label="Contributions by day and week"
      >
        <HeatmapChart.Grid
          caption="Contributions by day and week"
          layout={{
            cellSize: "clamp(6px, calc((100cqw - 84px) / 26), 28px)",
            gap: 3,
            rowLabels: "hidden",
            columnLabels: "hidden",
          }}
          Cell={() => null}
        />
        <HeatmapChart.Tooltip />
      </HeatmapChart>
    </div>
  );
}
