"use client";
import { BarChart as CoreBarChart, type BarChartProps as CoreProps } from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type BarChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function BarChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: BarChartProps) {
  const plot = (
    <CoreBarChart animate {...props}>
      {children}
    </CoreBarChart>
  );
  if (config === undefined)
    return (
      <CoreBarChart width={width} height={height} {...props}>
        {children}
      </CoreBarChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { BarAnimation, BarMaterial, BarProjection, BarSeriesProps } from "@kind-ui/charts";
export { BarSeries, BarStack } from "@kind-ui/charts";
export * from "./chart.js";
