"use client";
import {
  Legend as CoreLegend,
  Root as CoreRoot,
  type LegendProps,
  ResponsiveContainer,
  type ResponsiveContainerProps,
  type RootProps,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

// Editable layout only. Metadata, interaction and motion remain in the npm core.
export type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type ChartFrameProps = Without<RootProps, "children"> & {
  children: ResponsiveContainerProps["children"];
  height?: ResponsiveContainerProps["height"];
  width?: ResponsiveContainerProps["width"];
  legend?: false | LegendProps;
};
export function ChartFrame({
  children,
  height = 280,
  width = "100%",
  style,
  legend = false,
  ...props
}: ChartFrameProps) {
  return (
    <CoreRoot style={style} {...props}>
      {legend !== false && <CoreLegend {...legend} />}
      <ResponsiveContainer width={width} height={height}>
        {children}
      </ResponsiveContainer>
    </CoreRoot>
  );
}
export type {
  ChartInteractionConfig,
  DataKey,
  DotProps,
  RootProps,
  SeriesConfig,
  TooltipRenderProps,
  TooltipValueType,
} from "@kind-ui/charts";
export {
  Brush,
  CartesianGrid,
  Cell,
  ChartBackgroundPattern,
  createPercentStack,
  Dot,
  defineChartBackgroundPattern,
  EmphasisMark,
  FillPatternSwatch,
  formatPercent,
  Label,
  LabelList,
  Legend,
  PointMarker,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Root,
  Tooltip,
  TooltipContent,
  useChartInteraction,
  useEmphasis,
  XAxis,
  YAxis,
  ZAxis,
} from "@kind-ui/charts";
