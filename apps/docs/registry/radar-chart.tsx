"use client";
import { type RadarChartProps as CoreProps, RadarChart as CoreRadarChart } from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type RadarChartProps<Row = unknown> = Without<CoreProps<Row>, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function RadarChart<Row = unknown>({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: RadarChartProps<Row>) {
  const plot = (
    <CoreRadarChart<Row> animate {...props}>
      {children}
    </CoreRadarChart>
  );
  if (config === undefined)
    return (
      <CoreRadarChart<Row> width={width} height={height} {...props}>
        {children}
      </CoreRadarChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type { PolarMaterial, RadarAnimation, RadarSeriesProps } from "@kind-ui/charts";
export { RadarSeries } from "@kind-ui/charts";
export * from "./chart.js";
