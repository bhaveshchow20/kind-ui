import type * as Chart from "@kind-ui/charts";

// Focused documentation views of the installed public declarations.
// Keep native engine props in the original exported types rather than duplicating them here.
export type Root = Pick<
  Chart.RootProps,
  "config" | "emphasis" | "visibleSeries" | "onVisibleSeriesChange"
>;
export type SeriesMetadata = Chart.SeriesConfig[string];
export type Legend = Pick<Chart.LegendProps, "emphasis" | "hideIcon" | "children" | "className">;
export type Tooltip = Pick<
  Chart.TooltipProps,
  "itemKey" | "cursor" | "content" | "frameProps" | "maxWidth" | "filterNull" | "shared"
>;
export type TooltipContent = Pick<
  Chart.TooltipContentProps,
  "tooltip" | "missingValue" | "hideLabel" | "hideIndicator" | "indicator" | "itemKey"
>;

export type LineChart = Pick<Chart.LineChartProps, "data" | "animate" | "responsive" | "margin">;
export type LineSeries = Pick<
  Chart.LineSeriesProps,
  "dataKey" | "seriesKey" | "material" | "type" | "connectNulls" | "hide" | "yAxisId"
>;
export type AreaChart = Pick<Chart.AreaChartProps, "data" | "animate" | "responsive" | "margin">;
export type AreaSeries = Pick<
  Chart.AreaSeriesProps,
  "dataKey" | "seriesKey" | "material" | "connectNulls" | "stackId" | "baseValue" | "hide"
>;
export type BarChart = Pick<
  Chart.BarChartProps,
  "data" | "animate" | "responsive" | "layout" | "emphasis" | "stackOffset"
>;
export type BarSeries = Pick<
  Chart.BarSeriesProps,
  "dataKey" | "seriesKey" | "material" | "emphasisKey" | "stackId" | "radius" | "hide"
>;
export type ComboChart = Pick<Chart.ComboChartProps, "data" | "animate" | "responsive" | "margin">;
export type MotionOptions = Chart.LineAnimation;
export type ComboMotion = Chart.ComboAnimation;

export type PieChart = Pick<Chart.PieChartProps, "animate" | "responsive" | "margin">;
export type PieSeries = Pick<
  Chart.PieSeriesProps,
  "data" | "dataKey" | "nameKey" | "innerRadius" | "outerRadius" | "material" | "emphasisKey"
>;
export type ScatterChart = Pick<Chart.ScatterChartProps, "animate" | "responsive" | "margin">;
export type ScatterSeries = Pick<
  Chart.ScatterSeriesProps,
  "data" | "seriesKey" | "material" | "shape" | "xAxisId" | "yAxisId" | "zAxisId" | "hide"
>;
export type ScatterTooltip = Pick<
  Chart.ScatterTooltipProps,
  "pointLabel" | "zDimension" | "missingValue" | "axisId" | "content"
>;
export type ScatterZDimension = Chart.ScatterSizeDimension;
export type RadarChart = Pick<Chart.RadarChartProps, "data" | "animate" | "responsive" | "margin">;
export type RadarSeries = Pick<
  Chart.RadarSeriesProps,
  "dataKey" | "seriesKey" | "material" | "hide"
>;
export type RadialBarChart = Pick<
  Chart.RadialBarChartProps,
  "data" | "animate" | "responsive" | "startAngle" | "endAngle"
>;
export type RadialBarSeries = Pick<
  Chart.RadialBarSeriesProps,
  "dataKey" | "seriesKey" | "material" | "hide" | "background"
>;
export type RadialBarLabel = Pick<
  Chart.RadialBarLabelProps,
  "show" | "fontSize" | "minFontSize" | "padding" | "formatter"
>;

export type HistogramChart = Pick<
  Chart.HistogramChartProps,
  "bins" | "measure" | "animate" | "xAxisProps" | "yAxisProps"
>;
export type HistogramSeries = Pick<
  Chart.HistogramSeriesProps,
  "seriesKey" | "material" | "shape" | "hide"
>;
export type HistogramBin = Chart.HistogramBin;
export type HistogramAudit = Chart.HistogramBinningResult;
export type BoxPlotChart = Pick<
  Chart.BoxPlotChartProps,
  "data" | "animate" | "layout" | "responsive"
>;
export type BoxPlotSeries = Pick<
  Chart.BoxPlotSeriesProps,
  "dataKey" | "seriesKey" | "material" | "shape" | "markProps" | "outlierRadius"
>;
export type BoxPlotMark = Pick<
  Chart.BoxPlotMarkProps,
  "coordinates" | "center" | "size" | "orientation" | "outlierRadius" | "material"
>;
export type BoxPlotSummary = Chart.BoxPlotSummary;
export type WaterfallChart = Pick<
  Chart.WaterfallChartProps,
  "data" | "animate" | "layout" | "responsive"
>;
export type WaterfallSeries = Pick<
  Chart.WaterfallSeriesProps,
  "seriesKey" | "material" | "hide" | "shape" | "xAxisId" | "yAxisId"
>;
export type WaterfallConnectors = Pick<
  Chart.WaterfallConnectorsProps,
  "data" | "seriesKey" | "hide" | "xAxisId" | "yAxisId" | "position"
>;
export type WaterfallDatum = Chart.WaterfallDatum;

export type SankeyChart = Pick<
  Chart.SankeyChartProps,
  "data" | "animate" | "node" | "link" | "empty"
>;
export type SankeyNode = Pick<Chart.SankeyNodeProps, "payload" | "color" | "finish" | "rectProps">;
export type SankeyLink = Pick<
  Chart.SankeyLinkProps,
  "payload" | "material" | "finish" | "color" | "targetColor" | "pathProps"
>;
export type SankeyTable = Pick<
  Chart.SankeyTableProps,
  "data" | "caption" | "formatValue" | "onInspect" | "activeLinkId"
>;
export type SankeyFlowNode = Chart.SankeyFlowNode;
export type SankeyFlowLink = Chart.SankeyFlowLink;
export type HeatmapChart = Pick<
  Chart.HeatmapChartProps,
  "rows" | "columns" | "data" | "duplicates" | "scale" | "formatValue" | "missingLabel" | "animate"
>;
export type HeatmapGrid = Pick<
  Chart.HeatmapGridProps,
  "caption" | "material" | "Cell" | "cellProps" | "rowLabel" | "columnLabel"
>;
export type HeatmapTooltip = Pick<Chart.HeatmapTooltipProps, "Content" | "className">;
export type HeatmapLegend = Pick<Chart.HeatmapLegendProps, "label" | "className">;
export type HeatmapDataTable = Pick<Chart.HeatmapDataTableProps, "caption" | "className">;
export type HeatmapDatum = Chart.HeatmapDatum;
export type HeatmapScaleOptions = Chart.HeatmapScaleOptions;
export type EmphasisTarget = Chart.EmphasisTarget;
export type EmphasisMark = Pick<
  Chart.EmphasisMarkProps,
  "target" | "enabled" | "keyboardActive" | "children"
>;
