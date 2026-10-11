"use client";
import {
  type ScatterChartProps as CoreProps,
  ScatterChart as CoreScatterChart,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type ScatterChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function ScatterChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: ScatterChartProps) {
  const plot = (
    <CoreScatterChart animate {...props}>
      {children}
    </CoreScatterChart>
  );
  if (config === undefined)
    return (
      <CoreScatterChart width={width} height={height} {...props}>
        {children}
      </CoreScatterChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { ScatterMaterial, ScatterSeriesProps, ScatterSizeDimension } from "@kind-ui/charts";
export { ScatterSeries, ScatterTooltip, ScatterTooltipContent } from "@kind-ui/charts";
export * from "./chart.js";
