import type * as Chart from "@kind-ui/charts";

export type CandlestickChartReference = Pick<
  Chart.CandlestickChartProps,
  | "data"
  | "timeMode"
  | "accessors"
  | "spacing"
  | "viewport"
  | "defaultViewport"
  | "onViewportChange"
  | "followLatest"
  | "overscan"
  | "selection"
  | "defaultSelection"
  | "onSelectionChange"
  | "onInspect"
  | "priceScale"
  | "autoscale"
  | "priceDomain"
  | "priceBounds"
  | "pricePadding"
  | "volumeRatio"
  | "formatTime"
  | "formatPrice"
  | "formatVolume"
  | "loading"
  | "loadingLabel"
  | "empty"
  | "animate"
  | "config"
  | "children"
  | "frameProps"
  | "width"
  | "height"
>;
export type CandlestickDatumReference = Chart.CandlestickDatum;
export type CandlestickPointReference = Chart.CandlestickPoint;
export type CandlestickAccessorsReference = Chart.CandlestickAccessors<Chart.CandlestickDatum>;
export type CandlestickDataOptionsReference = Chart.CandlestickDataOptions<Chart.CandlestickDatum>;
export type CandlestickViewportReference = Chart.CandlestickViewport;
export type CandlestickViewportChangeReference = Chart.CandlestickViewportChange;
export type CandlestickPriceDomainReference = Chart.CandlestickPriceDomainOptions;
export type CandlestickSeriesReference = Chart.CandlestickSeriesProps;
export type CandlestickMarkReference = Pick<
  Chart.CandlestickMarkProps,
  "center" | "width" | "open" | "high" | "low" | "close" | "direction"
>;
export type CandlestickVolumeReference = Pick<
  Chart.CandlestickVolumeProps,
  "seriesKey" | "axisProps" | "fill" | "fillOpacity"
>;
export type CandlestickOverlayReference = Pick<
  Chart.CandlestickOverlayProps,
  "seriesKey" | "dataKey" | "includeInDomain" | "stroke" | "connectNulls"
>;
export type CandlestickContentReference = Chart.CandlestickContentProps;
export type CandlestickTooltipReference = Chart.CandlestickTooltipProps;
export type CandlestickDataTableReference = Pick<
  Chart.CandlestickDataTableProps,
  "caption" | "renderMetadata" | "metadataLabel"
>;

export type CandlestickReferenceLineReference = Pick<
  Chart.CandlestickReferenceLineProps,
  "x" | "y" | "ifOverflow" | "label" | "stroke"
>;
