import type * as Chart from "@kind-ui/charts";

export type BarChartComponent = Pick<
  Chart.BarChartProps,
  | "data"
  | "animate"
  | "emphasis"
  | "layout"
  | "barGap"
  | "barCategoryGap"
  | "stackOffset"
  | "accessibilityLayer"
>;
export type BarSeriesComponent = Pick<
  Omit<Chart.BarSeriesProps, "material"> & { material?: "plain" | "clay" | "glow" },
  | "dataKey"
  | "seriesKey"
  | "stackId"
  | "material"
  | "emphasisKey"
  | "radius"
  | "maxBarSize"
  | "fill"
  | "hide"
>;
