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
export type CandlestickRecordReference = Chart.CandlestickRecord;
export type CandlestickPointReference = Chart.CandlestickPoint;
export type CandlestickAccessorsReference = Chart.CandlestickAccessors<Chart.CandlestickRecord>;
export type CandlestickDataOptionsReference = Chart.CandlestickDataOptions<Chart.CandlestickRecord>;
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
  "seriesKey" | "axisProps" | "fill" | "fillOpacity" | "rising" | "falling" | "unchanged"
>;
export type CandlestickOverlayReference = Pick<
  Chart.CandlestickOverlayProps,
  "seriesKey" | "dataKey" | "includeInDomain" | "stroke" | "connectNulls"
>;
export type CandlestickReadoutReference = Chart.CandlestickReadoutProps;
export type CandlestickTooltipReference = Chart.CandlestickTooltipProps;
export type CandlestickTableReference = Pick<
  Chart.CandlestickTableProps,
  "caption" | "renderMetadata" | "metadataLabel"
>;

export type CandlestickReferenceLineReference = Pick<
  Chart.CandlestickReferenceLineProps,
  "x" | "y" | "ifOverflow" | "label" | "stroke"
>;

export type CandlestickCrosshairReference = Pick<
  Chart.CandlestickCrosshairProps,
  "mode" | "showLabels" | "labelProps" | "stroke" | "strokeWidth" | "strokeOpacity"
>;
export type CandlestickCurrentPriceReference = Pick<
  Chart.CandlestickCurrentPriceProps,
  | "seriesKey"
  | "orientation"
  | "lineVisible"
  | "axisLabelVisible"
  | "rising"
  | "falling"
  | "unchanged"
  | "lineProps"
  | "labelProps"
  | "labelTextColor"
  | "children"
>;
export type CandlestickControlsReference = Pick<
  Chart.CandlestickControlsProps,
  | "zoomFactor"
  | "disabled"
  | "zoomInProps"
  | "zoomOutProps"
  | "resetProps"
  | "children"
  | "className"
>;
export type CandlestickHistoryNavigatorReference = Pick<
  Chart.CandlestickHistoryNavigatorProps,
  "height" | "brushProps" | "overviewProps" | "className"
>;
