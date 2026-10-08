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
  Chart.BarSeriesProps,
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
