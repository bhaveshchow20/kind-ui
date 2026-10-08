import type * as Chart from "@kind-ui/charts";
export type WaterfallChart = Pick<
  Chart.WaterfallChartProps,
  "data" | "layout" | "animate" | "accessibilityLayer" | "barCategoryGap"
>;
export type WaterfallSeries = Pick<
  Chart.WaterfallSeriesProps,
  "seriesKey" | "material" | "hide" | "radius" | "shape"
>;
export type WaterfallConnectors = Pick<
  Chart.WaterfallConnectorsProps,
  "data" | "seriesKey" | "hide" | "position" | "xAxisId" | "yAxisId"
>;
export type WaterfallInput = Chart.WaterfallEntry;
export type WaterfallResult = Chart.WaterfallDatum;
