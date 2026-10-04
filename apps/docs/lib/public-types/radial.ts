import type * as Chart from "@kind-ui/charts";
export type RadialBarChart = Pick<
  Chart.RadialBarChartProps,
  | "data"
  | "animate"
  | "animationDirection"
  | "startAngle"
  | "endAngle"
  | "innerRadius"
  | "outerRadius"
>;
export type RadialBarSeries = Pick<
  Chart.RadialBarSeriesProps,
  "dataKey" | "seriesKey" | "background" | "material" | "stackId" | "cornerRadius"
>;
export type RadialBarLabel = Pick<
  Chart.RadialBarLabelProps,
  "show" | "fontSize" | "minFontSize" | "padding"
>;
