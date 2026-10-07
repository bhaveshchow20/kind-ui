import type * as Chart from "@kind-ui/charts";

export type ComboChartReference = Pick<
  Chart.ComboChartProps,
  | "data"
  | "animate"
  | "layout"
  | "stackOffset"
  | "barCategoryGap"
  | "barGap"
  | "accessibilityLayer"
  | "children"
>;
export type ComboMotionReference = Chart.ComboAnimation;
export type ComboBarReference = Pick<
  Omit<Chart.BarSeriesProps, "material"> & { material?: "plain" | "clay" | "glow" },
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
