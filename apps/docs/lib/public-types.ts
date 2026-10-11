import type * as Chart from "@kind-ui/charts";

// Focused documentation views of the installed public declarations.
// Keep native engine props in the original exported types rather than duplicating them here.
// Distribute over the visibility branches so controlled/defaulted ownership stays exclusive.
type DistributivePick<Props, Keys extends keyof Props> = Props extends unknown
  ? Pick<Props, Keys>
  : never;
export type ChartFrame = DistributivePick<
  Chart.LineChartProps,
  | "config"
  | "children"
  | "frameProps"
  | "nonce"
  | "aria-label"
  | "aria-labelledby"
  | "emphasis"
  | "visibleSeries"
  | "defaultVisibleSeries"
  | "onVisibleSeriesChange"
  | "interaction"
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
  Chart.LineChartProps,
  "data" | "config" | "children" | "frameProps" | "legendPosition" | "height" | "animate"
>;
export type LineSeries = Pick<
  Chart.LineSeriesProps,
  "dataKey" | "seriesKey" | "material" | "type" | "connectNulls" | "hide" | "yAxisId"
>;
export type MotionOptions = Chart.LineAnimation;

export type AreaChart = Pick<
  Chart.AreaChartProps,
  | "data"
  | "config"
  | "children"
  | "frameProps"
  | "legendPosition"
  | "animate"
  | "stackOffset"
  | "accessibilityLayer"
>;
export type AreaSeries = Pick<
  Chart.AreaSeriesProps,
  "dataKey" | "seriesKey" | "material" | "type" | "stackId" | "connectNulls" | "fillOpacity"
>;
