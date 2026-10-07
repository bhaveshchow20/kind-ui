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
export {
  type ActivityRing,
  type ActivityRingDatum,
  ActivityRings,
  type ActivityRingsProps,
} from "./activity-rings.js";
export {
  type LineAnimation,
  LineSeries,
  type LineSeriesProps,
  Tooltip,
  type TooltipProps,
} from "./animation.js";
export { type AreaAnimation, AreaChart, type AreaChartProps } from "./area-chart.js";
export type { AreaMaterial } from "./area-material.js";
export { AreaSeries, type AreaSeriesProps } from "./area-series.js";
export {
  type BarAnimation,
  BarChart,
  type BarChartProps,
} from "./bar-chart.js";
export type { BarMaterial } from "./bar-material.js";
export { type BarProjection, BarSeries, type BarSeriesProps } from "./bar-series.js";
export type { BoxPlotMaterial } from "./box-material.js";
export {
  BoxPlotChart,
  type BoxPlotChartProps,
  BoxPlotMark,
  type BoxPlotMarkProps,
  BoxPlotSeries,
  type BoxPlotSeriesProps,
  type BoxPlotShapeProps,
  type BoxPlotSummary,
  boxPlotExtent,
  validateBoxPlotSummary,
} from "./box-plot.js";
export { type ComboAnimation, ComboChart, type ComboChartProps } from "./combo-chart.js";
export {
  type ConfiguredLineChartProps,
  type ConfiguredLineSeries,
  LineChart,
  type LineChartProps,
} from "./configured-line-chart.js";
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
  HeatmapChart,
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
export { HistogramChart, type HistogramChartProps } from "./histogram-chart.js";
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
export { type PieAnimation, PieChart, type PieChartProps } from "./pie-chart.js";
export type { PieMaterial } from "./pie-material.js";
export { PieSeries, type PieSeriesProps } from "./pie-series.js";
export { PointMarker, type PointMarkerProps, type PointStyle } from "./point-marker.js";
export {
  type RadarAnimation,
  RadarChart,
  type RadarChartProps,
  type RadialBarAnimation,
  RadialBarChart,
  type RadialBarChartProps,
} from "./polar-chart.js";
export type { PolarMaterial } from "./polar-material.js";
export {
  RadarSeries,
  type RadarSeriesProps,
  RadialBarSeries,
  type RadialBarSeriesProps,
} from "./polar-series.js";
export type { RadarSelectionProps } from "./radar-interaction.js";
export { RadialBarLabel, type RadialBarLabelProps } from "./radial-bar-label.js";
export type { RevealDirection } from "./reveal-clip.js";
export { Root, type RootProps } from "./root.js";
export { type SankeyAnimation, SankeyChart, type SankeyChartProps } from "./sankey-chart.js";
export type { SankeyNodeConfig } from "./sankey-colors.js";
export {
  prepareSankeyData,
  type SankeyFlowData,
  type SankeyFlowLink,
  type SankeyFlowNode,
} from "./sankey-data.js";
export type { SankeyFinish } from "./sankey-finish.js";
export { SankeyLegend, type SankeyLegendProps } from "./sankey-legend.js";
export {
  SankeyLink,
  type SankeyLinkProps,
  type SankeyMaterial,
  SankeyNode,
  type SankeyNodeProps,
} from "./sankey-marks.js";
export { SankeyNodeLabel, type SankeyNodeLabelProps } from "./sankey-node-label.js";
export { SankeyTable, type SankeyTableProps } from "./sankey-table.js";
export { type ScatterAnimation, ScatterChart, type ScatterChartProps } from "./scatter-chart.js";
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
export type { SeriesColor, SeriesConfig } from "./types.js";
export { WaterfallChart, type WaterfallChartProps } from "./waterfall-chart.js";
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
