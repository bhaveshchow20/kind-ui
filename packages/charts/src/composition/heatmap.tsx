"use client";

import {
  HeatmapCellContent,
  HeatmapDataTable,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapChart as NativeHeatmapChart,
} from "../heatmap.js";

export const HeatmapChart = /* @__PURE__ */ Object.assign(NativeHeatmapChart, {
  Grid: HeatmapGrid,
  Tooltip: HeatmapTooltip,
  Legend: HeatmapLegend,
  DataTable: HeatmapDataTable,
  Cell: HeatmapCellContent,
});
