"use client";

import { OutsidePlot } from "../family-root.js";

import {
  HeatmapCellContent,
  HeatmapDataTable,
  HeatmapGrid,
  HeatmapLegend,
  type HeatmapLegendProps,
  HeatmapTooltip,
  HeatmapChart as NativeHeatmapChart,
} from "../heatmap.js";

function FamilyHeatmapLegend(props: HeatmapLegendProps) {
  return (
    <OutsidePlot>
      <HeatmapLegend {...props} />
    </OutsidePlot>
  );
}

export const HeatmapChart = /* @__PURE__ */ Object.assign(NativeHeatmapChart, {
  Content: OutsidePlot,
  Grid: HeatmapGrid,
  Tooltip: HeatmapTooltip,
  Legend: FamilyHeatmapLegend,
  DataTable: HeatmapDataTable,
  Cell: HeatmapCellContent,
});
