"use client";
import {
  type WaterfallChartProps as CoreProps,
  WaterfallChart as CoreWaterfallChart,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type WaterfallChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function WaterfallChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: WaterfallChartProps) {
  const plot = (
    <CoreWaterfallChart animate {...props}>
      {children}
    </CoreWaterfallChart>
  );
  if (config === undefined)
    return (
      <CoreWaterfallChart width={width} height={height} {...props}>
        {children}
      </CoreWaterfallChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { WaterfallDatum, WaterfallEntry, WaterfallSeriesProps } from "@kind-ui/charts";
export { computeWaterfallData, WaterfallConnectors, WaterfallSeries } from "@kind-ui/charts";
export * from "./chart.js";
