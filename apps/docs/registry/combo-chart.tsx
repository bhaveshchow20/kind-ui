"use client";
import { ComboChart as CoreComboChart, type ComboChartProps as CoreProps } from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type ComboChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function ComboChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: ComboChartProps) {
  const plot = (
    <CoreComboChart animate {...props}>
      {children}
    </CoreComboChart>
  );
  if (config === undefined)
    return (
      <CoreComboChart width={width} height={height} {...props}>
        {children}
      </CoreComboChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { ComboAnimation } from "@kind-ui/charts";
export { AreaSeries, BarSeries, BarStack, LineSeries } from "@kind-ui/charts";
export * from "./chart.js";
