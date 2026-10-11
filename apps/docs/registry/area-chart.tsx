"use client";
import { AreaChart as CoreAreaChart, type AreaChartProps as CoreProps } from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type AreaChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function AreaChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: AreaChartProps) {
  const plot = (
    <CoreAreaChart animate {...props}>
      {children}
    </CoreAreaChart>
  );
  if (config === undefined)
    return (
      <CoreAreaChart width={width} height={height} {...props}>
        {children}
      </CoreAreaChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { AreaAnimation, AreaMaterial, AreaSeriesProps } from "@kind-ui/charts";
export { AreaRevealShape, AreaSeries } from "@kind-ui/charts";
export * from "./chart.js";
