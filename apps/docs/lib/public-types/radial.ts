import type * as Chart from "@kind-ui/charts";
export type RadialBarChart = Pick<
  Chart.RadialBarChartProps,
  | "categoryKey"
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

export type ActivityRingsReference = Pick<
  Chart.ActivityRingsProps,
  | "rings"
  | "config"
  | "domain"
  | "animate"
  | "height"
  | "series"
  | "labels"
  | "legend"
  | "tooltip"
  | "rootProps"
  | "loading"
  | "loadingLabel"
>;
export type ActivityRingReference = Chart.ActivityRing;
