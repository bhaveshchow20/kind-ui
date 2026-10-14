"use client";

// Native composition parts preserve identity, registration, props and defaults.
export {
  type ActiveDotProps,
  AreaRevealShape,
  type AreaRevealShapeProps,
  type AxisDomainItem,
  type BarShapeProps,
  BarStack,
  type BarStackProps,
  Brush,
  type BrushProps,
  CartesianGrid,
  type CartesianGridProps,
  Cell,
  type CellProps,
  type Coordinate,
  Curve,
  type CurveProps,
  type DataKey,
  Dot,
  type DotItemDotProps,
  type DotProps,
  ErrorBar,
  type ErrorBarProps,
  getRelativeCoordinate,
  Label,
  LabelList,
  type LabelListProps,
  type LabelProps,
  LineDrawShape,
  type LineDrawShapeProps,
  type Margin,
  type NumberDomain,
  type PieLabelRenderProps,
  type PieSectorShapeProps,
  PolarAngleAxis,
  type PolarAngleAxisProps,
  PolarGrid,
  type PolarGridProps,
  PolarRadiusAxis,
  type PolarRadiusAxisProps,
  Polygon,
  type PolygonProps,
  type RadialBarSectorProps,
  Rectangle,
  type RectangleProps,
  ReferenceArea,
  type ReferenceAreaProps,
  ReferenceDot,
  type ReferenceDotProps,
  ReferenceLine,
  type ReferenceLineProps,
  ResponsiveContainer,
  type ResponsiveContainerProps,
  type ScaleFunction,
  type ScatterShapeProps,
  Sector,
  type SectorProps,
  Symbols,
  type SymbolsProps,
  type TooltipContentProps as TooltipRenderProps,
  type TooltipPayloadEntry,
  type TooltipValueType,
  useChartHeight,
  useChartWidth,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  type XAxisProps,
  type XAxisTickContentProps,
  YAxis,
  type YAxisProps,
  type YAxisTickContentProps,
  ZAxis,
  type ZAxisProps,
} from "recharts";
export type {
  ActivityRing,
  ActivityRingDatum,
  ActivityRingsProps,
  ActivitySeriesProps,
} from "./activity-rings.js";
export {
  type LineAnimation,
  LineSeries,
  type LineSeriesProps,
  Tooltip,
  type TooltipProps,
} from "./animation.js";
export type { AreaAnimation } from "./area-chart.js";
export type { AreaMaterial } from "./area-material.js";
export { AreaSeries, type AreaSeriesProps } from "./area-series.js";
export type { BarAnimation } from "./bar-chart.js";
export type { BarMaterial } from "./bar-material.js";
export { type BarProjection, BarSeries, type BarSeriesProps } from "./bar-series.js";
export type { BoxPlotMaterial } from "./box-material.js";
export {
  BoxPlotMark,
  type BoxPlotMarkProps,
  BoxPlotSeries,
  type BoxPlotSeriesProps,
  type BoxPlotShapeProps,
  type BoxPlotSummary,
  boxPlotExtent,
  validateBoxPlotSummary,
} from "./box-plot.js";
export {
  ChartBackgroundPattern,
  type ChartBackgroundPatternDefinition,
  type ChartBackgroundPatternProps,
  type ChartBackgroundPatternRenderProps,
  defineChartBackgroundPattern,
} from "./chart-background-pattern.js";
export {
  type ChartIdentity,
  type ChartInteractionConfig,
  type ChartInteractionEvent,
  type ChartInteractionRequest,
  useChartInteraction,
} from "./chart-interaction.js";
export type { ComboAnimation } from "./combo-chart.js";
export { ActivityRings } from "./composition/activity.js";
export { AreaChart, type AreaChartProps } from "./composition/area.js";
export { BarChart, type BarChartProps } from "./composition/bar.js";
export { BoxPlotChart, type BoxPlotChartProps } from "./composition/box-plot.js";
export { ComboChart, type ComboChartProps } from "./composition/combo.js";
export { HeatmapChart } from "./composition/heatmap.js";
export { HistogramChart, type HistogramChartProps } from "./composition/histogram.js";
export { LineChart, type LineChartProps } from "./composition/line.js";
export { PieChart, type PieChartProps } from "./composition/pie.js";
export { RadarChart, type RadarChartProps } from "./composition/radar.js";
export { RadialBarChart, type RadialBarChartProps } from "./composition/radial-bar.js";
export { SankeyChart } from "./composition/sankey.js";
export { ScatterChart, type ScatterChartProps } from "./composition/scatter.js";
export { WaterfallChart, type WaterfallChartProps } from "./composition/waterfall.js";
export {
  EmphasisMark,
  type EmphasisMarkProps,
  type EmphasisTarget,
  useEmphasis,
} from "./emphasis.js";
export {
  type FillPattern,
  FillPatternSwatch,
  type FillPatternSwatchProps,
} from "./fill-pattern.js";
export {
  HeatmapCellContent,
  type HeatmapCellContentProps,
  type HeatmapChartProps,
  HeatmapDataTable,
  type HeatmapDataTableProps,
  HeatmapGrid,
  type HeatmapGridProps,
  HeatmapLegend,
  type HeatmapLegendProps,
  type HeatmapMaterial,
  HeatmapTooltip,
  type HeatmapTooltipProps,
} from "./heatmap.js";
export {
  createHeatmapModel,
  createHeatmapScale,
  type HeatmapCell,
  type HeatmapDatum,
  type HeatmapDuplicatePolicy,
  type HeatmapModel,
  type HeatmapModelOptions,
  type HeatmapScale,
  type HeatmapScaleOptions,
} from "./heatmap-model.js";
export type { HistogramXAxisProps, HistogramYAxisProps } from "./histogram-chart.js";
export {
  binHistogram,
  type HistogramBin,
  type HistogramBinningResult,
  type HistogramMeasure,
} from "./histogram-data.js";
export {
  HistogramSeries,
  type HistogramSeriesProps,
  type HistogramShapeProps,
} from "./histogram-series.js";
export { Legend, type LegendProps } from "./legend.js";
export type { LineDashAnimation } from "./line-dash.js";
export type { LineMaterial } from "./line-material.js";
export {
  createPercentStack,
  formatPercent,
  type NormalizedValue,
  type PercentStackOptions,
} from "./percent-stack.js";
export type { PieAnimation } from "./pie-chart.js";
export type { PieMaterial } from "./pie-material.js";
export { PieSeries, type PieSeriesProps } from "./pie-series.js";
export { PointMarker, type PointMarkerProps, type PointStyle } from "./point-marker.js";
export type {
  RadarAnimation,
  RadialBarAnimation,
} from "./polar-chart.js";
export type { PolarMaterial } from "./polar-material.js";
export {
  RadarSeries,
  type RadarSeriesProps,
  RadialBarSeries,
  type RadialBarSeriesProps,
} from "./polar-series.js";
export { RadialBarLabel, type RadialBarLabelProps } from "./radial-bar-label.js";
export type { RevealDirection } from "./reveal-clip.js";
export type { SankeyAnimation } from "./sankey-chart.js";
export type { SankeyNodeConfig } from "./sankey-colors.js";
export type { SankeyChartProps } from "./sankey-composition.js";
export {
  CompoundSankeyLegend as SankeyLegend,
  type CompoundSankeyLegendProps as SankeyLegendProps,
} from "./sankey-composition.js";
export {
  prepareSankeyData,
  type SankeyFlowData,
  type SankeyFlowLink,
  type SankeyFlowNode,
} from "./sankey-data.js";
export type { SankeyFinish } from "./sankey-finish.js";
export {
  SankeyLink,
  type SankeyLinkProps,
  type SankeyMaterial,
  SankeyNode,
  type SankeyNodeProps,
} from "./sankey-marks.js";
export { SankeyNodeLabel, type SankeyNodeLabelProps } from "./sankey-node-label.js";
export { SankeyTable, type SankeyTableProps } from "./sankey-table.js";
export type { ScatterAnimation } from "./scatter-chart.js";
export type { ScatterMaterial } from "./scatter-material.js";
export { ScatterSeries, type ScatterSeriesProps } from "./scatter-series.js";
export {
  type ScatterSizeDimension,
  ScatterTooltip,
  ScatterTooltipContent,
  type ScatterTooltipContentProps,
  type ScatterTooltipProps,
} from "./scatter-tooltip.js";
export { TooltipContent, type TooltipContentProps } from "./tooltip-content.js";
export {
  resolveTreemapColors,
  type TreemapColorEncoding,
  type TreemapColorLegend,
  type TreemapColorReadout,
  type TreemapColorStop,
  type TreemapResolvedColors,
} from "./treemap/encoding.js";
export {
  type TreemapBreadcrumbsProps,
  TreemapChart,
  type TreemapChartProps,
  type TreemapColorLegendProps,
  type TreemapContextValue,
  type TreemapDataTableProps,
  type TreemapGroupsProps,
  type TreemapItem,
  type TreemapLabelsProps,
  type TreemapLayoutOptions,
  type TreemapRectangle,
  type TreemapTileProps,
  type TreemapTilesProps,
  type TreemapTooltipProps,
  useTreemap,
} from "./treemap/index.js";
export {
  normalizeTreemap,
  type TreemapAccessors,
  type TreemapHierarchyNode,
  type TreemapModel,
  type TreemapNode,
} from "./treemap/model.js";
export type { SeriesColor, SeriesConfig } from "./types.js";
export {
  computeWaterfallData,
  type WaterfallDatum,
  type WaterfallEntry,
} from "./waterfall-data.js";
export {
  WaterfallConnectors,
  type WaterfallConnectorsProps,
  WaterfallSeries,
  type WaterfallSeriesProps,
} from "./waterfall-series.js";
