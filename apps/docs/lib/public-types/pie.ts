import type * as Chart from "@kind-ui/charts";
export type PieChartReference = Pick<
  Chart.PieChartProps,
  | "animate"
  | "animationDirection"
  | "accessibilityLayer"
  | "defaultPinnedCategory"
  | "loading"
  | "loadingLabel"
>;
export type PieSeriesReference = Pick<
  Omit<Chart.PieSeriesProps, "material"> & { material?: "plain" | "clay" | "glow" },
  | "data"
  | "dataKey"
  | "categoryKey"
  | "nameKey"
  | "innerRadius"
  | "outerRadius"
  | "material"
  | "emphasisKey"
  | "interactionBinding"
  | "glowCategories"
>;
export type PieMotionReference = Chart.PieAnimation;
