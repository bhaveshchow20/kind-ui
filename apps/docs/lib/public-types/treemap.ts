import type * as Chart from "@kind-ui/charts";
export type TreemapRootReference = Pick<
  Chart.TreemapChartProps,
  | "width"
  | "height"
  | "empty"
  | "aria-label"
  | "aria-labelledby"
  | "data"
  | "accessors"
  | "encoding"
  | "config"
  | "children"
  | "frameProps"
  | "formatValue"
  | "viewId"
  | "defaultViewId"
  | "onViewChange"
  | "defaultActiveId"
  | "activeId"
  | "onActiveChange"
  | "defaultSelectedId"
  | "selectedId"
  | "onSelectionChange"
  | "onActivate"
  | "depth"
  | "padding"
  | "groupHeaderHeight"
  | "layout"
  | "animate"
  | "loading"
  | "loadingLabel"
>;
export type TreemapStandardDatumReference = Chart.TreemapDatum;
export type TreemapAccessorsReference = Chart.TreemapAccessors<Chart.TreemapDatum>;
export type TreemapNodeReference = Chart.TreemapNode<Chart.TreemapDatum>;
export type TreemapItemReference = Chart.TreemapItem<Chart.TreemapDatum>;
export type TreemapColorEncodingReference = Chart.TreemapColorEncoding<Chart.TreemapDatum>;
export type TreemapTilesReference = Pick<Chart.TreemapTilesProps, "tileProps" | "children">;
export type TreemapGroupsReference = Pick<
  Chart.TreemapGroupsProps,
  "groupProps" | "headerProps" | "children"
>;
export type TreemapLabelsReference = Pick<
  Chart.TreemapLabelsProps,
  "minWidth" | "minHeight" | "padding" | "labelProps" | "children"
>;
export type TreemapTooltipReference = Pick<Chart.TreemapTooltipProps, "children">;
export type TreemapBreadcrumbsReference = Pick<Chart.TreemapBreadcrumbsProps, "rootLabel">;
export type TreemapTableReference = Pick<
  Chart.TreemapDataTableProps,
  "caption" | "scope" | "children" | "rowProps"
>;
