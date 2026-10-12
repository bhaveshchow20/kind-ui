import type * as Chart from "@kind-ui/charts";
export type PieChartReference = Pick<
  Chart.PieChartProps,
  | "config"
  | "children"
  | "frameProps"
  | "interaction"
  | "animate"
  | "animationDirection"
  | "accessibilityLayer"
  | "defaultPinnedCategory"
  | "loading"
  | "loadingLabel"
>;
export type PieSeriesReference = Pick<
  Chart.PieSeriesProps,
  | "data"
  | "dataKey"
  | "categoryKey"
  | "nameKey"
  | "innerRadius"
  | "outerRadius"
  | "material"
  | "emphasisKey"
  | "glowCategories"
>;
export type PieMotionReference = Chart.PieAnimation;
