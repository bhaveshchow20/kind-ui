import type * as Chart from "@kind-ui/charts";

export type ComboChartReference = Pick<
  Chart.ComboChartProps,
  | "config"
  | "children"
  | "frameProps"
  | "interaction"
  | "data"
  | "animate"
  | "layout"
  | "stackOffset"
  | "barCategoryGap"
  | "barGap"
  | "accessibilityLayer"
>;
export type ComboMotionReference = Chart.ComboAnimation;
export type ComboBarReference = Pick<
  Chart.BarSeriesProps,
  | "dataKey"
  | "seriesKey"
  | "xAxisId"
  | "yAxisId"
  | "stackId"
  | "maxBarSize"
  | "radius"
  | "fill"
  | "material"
>;
