import type * as Chart from "@kind-ui/charts";

// Focused documentation views of the installed public declarations.
// Keep native engine props in the original exported types rather than duplicating them here.
export type Root = Pick<
  Chart.RootProps,
  "config" | "emphasis" | "visibleSeries" | "onVisibleSeriesChange"
>;
export type SeriesMetadata = Chart.SeriesConfig[string];
export type Legend = Pick<Chart.LegendProps, "emphasis" | "hideIcon" | "children" | "className">;
export type Tooltip = Pick<
  Chart.TooltipProps,
  "itemKey" | "cursor" | "content" | "frameProps" | "maxWidth" | "filterNull" | "shared"
>;
export type TooltipContent = Pick<
  Chart.TooltipContentProps,
  "tooltip" | "missingValue" | "hideLabel" | "hideIndicator" | "indicator" | "itemKey"
>;

export type LineChart = Pick<
  Chart.ConfiguredLineChartProps,
  "data" | "config" | "xDataKey" | "curve" | "material" | "legend" | "animate"
>;
export type LineSeries = Pick<
  Chart.LineSeriesProps,
  "dataKey" | "seriesKey" | "material" | "type" | "connectNulls" | "hide" | "yAxisId"
>;
export type MotionOptions = Chart.LineAnimation;
