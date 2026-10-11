"use client";

import { OutsidePlot } from "../family-root.js";

import {
  HeatmapCellContent,
  HeatmapDataTable,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapChart as NativeHeatmapChart,
} from "../heatmap.js";

export const HeatmapChart = /* @__PURE__ */ Object.assign(NativeHeatmapChart, {
  Content: OutsidePlot,
  Grid: HeatmapGrid,
  Tooltip: HeatmapTooltip,
  Legend: HeatmapLegend,
  DataTable: HeatmapDataTable,
  Cell: HeatmapCellContent,
});
