import type * as Chart from "@kind-ui/charts";
export type PieChartReference = Pick<
  Chart.PieChartProps,
  "animate" | "animationDirection" | "accessibilityLayer"
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
  | "glowCategories"
  | "emphasisKey"
>;
export type PieMotionReference = Chart.PieAnimation;
