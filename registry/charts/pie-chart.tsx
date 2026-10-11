"use client";
import { PieChart as CorePieChart, type PieChartProps as CoreProps } from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type PieChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function PieChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: PieChartProps) {
  const plot = (
    <CorePieChart animate {...props}>
      {children}
    </CorePieChart>
  );
  if (config === undefined)
    return (
      <CorePieChart width={width} height={height} {...props}>
        {children}
      </CorePieChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { PieAnimation, PieMaterial, PieSeriesProps } from "@kind-ui/charts";
export { PieSeries } from "@kind-ui/charts";
export * from "./chart.js";
