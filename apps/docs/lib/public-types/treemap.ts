import type * as Chart from "@kind-ui/charts";
export type TreemapRootReference = Pick<
  Chart.TreemapChartProps,
  | "aria-label"
  | "data"
  | "config"
  | "height"
  | "padding"
  | "formatValue"
  | "interaction"
  | "accessors"
  | "encoding"
  | "animate"
  | "loading"
  | "loadingLabel"
>;
export type TreemapNodeReference = Chart.TreemapNode;
export type TreemapAccessorsReference = Chart.TreemapAccessors<Chart.TreemapNode>;
export type TreemapHierarchyNodeReference = Chart.TreemapHierarchyNode<Chart.TreemapNode>;
export type TreemapItemReference = Chart.TreemapItem<Chart.TreemapNode>;
export type TreemapColorEncodingReference = Chart.TreemapColorEncoding<Chart.TreemapNode>;
export type TreemapTilesReference = Pick<Chart.TreemapTilesProps, "tileProps" | "children">;
export type TreemapGroupsReference = Pick<
  Chart.TreemapGroupsProps,
  "groupProps" | "headerProps" | "children"
>;
export type TreemapLabelsReference = Pick<
  Chart.TreemapLabelsProps,
  "minWidth" | "minHeight" | "padding" | "labelProps" | "children"
>;
export type TreemapTooltipReference = Pick<
  Chart.TreemapTooltipProps,
  "children" | "valueAnimation"
>;
export type TreemapBreadcrumbsReference = Pick<Chart.TreemapBreadcrumbsProps, "rootLabel">;
export type TreemapTableReference = Pick<
  Chart.TreemapDataTableProps,
  "caption" | "scope" | "children" | "rowProps"
>;
