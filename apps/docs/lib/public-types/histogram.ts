import type * as Chart from "@kind-ui/charts";

/** Histogram owns numeric axes and consumes explicit validated bin intervals. */
export type HistogramChartReference = Pick<
  Chart.HistogramChartProps,
  | "bins"
  | "measure"
  | "config"
  | "children"
  | "frameProps"
  | "interaction"
  | "animate"
  | "accessibilityLayer"
>;
/** Native quantitative rectangles; shape receives corrected bounds and the original bin. */
export type HistogramSeriesReference = Pick<
  Chart.HistogramSeriesProps,
  "seriesKey" | "material" | "shape" | "hide" | "fill" | "stroke"
>;
/** Raw observations are assigned using explicit edges with separate discard accounting. */
export type HistogramBinningReference = Chart.HistogramBinningResult;

export type HistogramXAxisReference = Chart.HistogramXAxisProps;
export type HistogramYAxisReference = Chart.HistogramYAxisProps;
