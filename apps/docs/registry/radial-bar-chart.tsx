"use client";
import {
  type RadialBarChartProps as CoreProps,
  RadialBarChart as CoreRadialBarChart,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type RadialBarChartProps<Row = unknown> = Without<CoreProps<Row>, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function RadialBarChart<Row = unknown>({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: RadialBarChartProps<Row>) {
  const plot = (
    <CoreRadialBarChart<Row> animate {...props}>
      {children}
    </CoreRadialBarChart>
  );
  if (config === undefined)
    return (
      <CoreRadialBarChart<Row> width={width} height={height} {...props}>
        {children}
      </CoreRadialBarChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { PolarMaterial, RadialBarAnimation, RadialBarSeriesProps } from "@kind-ui/charts";
export { RadialBarLabel, RadialBarSeries } from "@kind-ui/charts";
export * from "./chart.js";
