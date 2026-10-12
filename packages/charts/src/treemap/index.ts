"use client";
import { TreemapChartRoot } from "./chart.js";
import {
  TreemapBreadcrumbs,
  TreemapColorLegend,
  TreemapContent,
  TreemapDataTable,
  TreemapGroups,
  TreemapLabels,
  TreemapTiles,
  TreemapTooltip,
} from "./parts.js";
export const TreemapChart = /* @__PURE__ */ Object.assign(TreemapChartRoot, {
  Tiles: TreemapTiles,
  Groups: TreemapGroups,
  Labels: TreemapLabels,
  Tooltip: TreemapTooltip,
  ColorLegend: TreemapColorLegend,
  Breadcrumbs: TreemapBreadcrumbs,
  Content: TreemapContent,
  DataTable: TreemapDataTable,
});
export type { TreemapChartProps, TreemapContextValue, TreemapItem } from "./chart.js";
export { useTreemap } from "./chart.js";
export type { TreemapLayoutOptions, TreemapRectangle } from "./layout.js";
export type {
  TreemapBreadcrumbsProps,
  TreemapColorLegendProps,
  TreemapDataTableProps,
  TreemapGroupsProps,
  TreemapLabelsProps,
  TreemapTilesProps,
  TreemapTooltipProps,
} from "./parts.js";
