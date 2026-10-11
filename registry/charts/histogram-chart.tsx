"use client";
import {
  HistogramChart as CoreHistogramChart,
  type HistogramChartProps as CoreProps,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type HistogramChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function HistogramChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: HistogramChartProps) {
  const plot = (
    <CoreHistogramChart animate {...props}>
      {children}
    </CoreHistogramChart>
  );
  if (config === undefined)
    return (
      <CoreHistogramChart width={width} height={height} {...props}>
        {children}
      </CoreHistogramChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { HistogramBin, HistogramMeasure, HistogramSeriesProps } from "@kind-ui/charts";
export { binHistogram, HistogramSeries } from "@kind-ui/charts";
export * from "./chart.js";
