"use client";
import {
  BoxPlotChart as CoreBoxPlotChart,
  type BoxPlotChartProps as CoreProps,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type BoxPlotChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function BoxPlotChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: BoxPlotChartProps) {
  const plot = (
    <CoreBoxPlotChart animate {...props}>
      {children}
    </CoreBoxPlotChart>
  );
  if (config === undefined)
    return (
      <CoreBoxPlotChart width={width} height={height} {...props}>
        {children}
      </CoreBoxPlotChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { BoxPlotMaterial, BoxPlotSeriesProps, BoxPlotSummary } from "@kind-ui/charts";
export { BoxPlotMark, BoxPlotSeries, boxPlotExtent, validateBoxPlotSummary } from "@kind-ui/charts";
export * from "./chart.js";
