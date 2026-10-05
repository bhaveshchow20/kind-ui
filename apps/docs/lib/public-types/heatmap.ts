import type * as Chart from "@kind-ui/charts";
export type HeatmapGridReference = Pick<
  Chart.HeatmapGridProps,
  "caption" | "layout" | "Cell" | "cellProps" | "rowLabel" | "columnLabel"
>;
export type HeatmapLayoutReference = NonNullable<Chart.HeatmapGridProps["layout"]>;
