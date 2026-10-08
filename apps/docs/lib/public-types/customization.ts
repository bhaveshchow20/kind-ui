import type * as Chart from "@kind-ui/charts";

export type FillPatternReference = Chart.FillPattern;
export type BackgroundPatternReference = Chart.ChartBackgroundPatternProps;
export type LinePresentationReference = Pick<
  Chart.LineSeriesProps,
  "pointStyle" | "activePointStyle" | "dashAnimation"
>;
export type AreaPresentationReference = Pick<
  Chart.AreaSeriesProps,
  "pointStyle" | "activePointStyle" | "pattern"
>;
export type BarProjectionReference = Pick<Chart.BarSeriesProps, "pattern" | "projection">;
export type LoadingReference = Pick<Chart.ComboChartProps, "loading" | "loadingLabel">;
export type PercentFormattingReference = Chart.PercentStackOptions;
export type SankeyLabelReference = Pick<
  Chart.SankeyNodeLabelProps,
  | "node"
  | "data"
  | "nodeConfig"
  | "position"
  | "side"
  | "offset"
  | "iconSize"
  | "iconGap"
  | "showValues"
  | "valueFormatter"
  | "children"
>;
