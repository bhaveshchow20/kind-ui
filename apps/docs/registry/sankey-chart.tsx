"use client";
import {
  type SankeyChartProps as CoreProps,
  SankeyChart as CoreSankeyChart,
} from "@kind-ui/charts";
import { ChartFrame, type ChartFrameProps, type Without } from "./chart.js";

export type SankeyChartProps = Without<CoreProps, "height" | "width"> & {
  config?: ChartFrameProps["config"];
  legend?: ChartFrameProps["legend"];
  rootProps?: Without<ChartFrameProps, "config" | "children" | "height" | "width">;
  height?: ChartFrameProps["height"];
  width?: ChartFrameProps["width"];
};
// Passing config opts into this editable frame. Without it, compose in your own Root.
// Series, marks, axes and data remain caller-owned children and native props.
export function SankeyChart({
  config,
  rootProps,
  legend,
  height,
  width,
  children,
  ...props
}: SankeyChartProps) {
  const plot = (
    <CoreSankeyChart animate {...props}>
      {children}
    </CoreSankeyChart>
  );
  if (config === undefined)
    return (
      <CoreSankeyChart width={width} height={height} {...props}>
        {children}
      </CoreSankeyChart>
    );
  return (
    <ChartFrame config={config} height={height} width={width} legend={legend} {...rootProps}>
      {plot}
    </ChartFrame>
  );
}
export type {
  SankeyFinish,
  SankeyFlowData,
  SankeyMaterial,
  SankeyNodeConfig,
} from "@kind-ui/charts";
export {
  prepareSankeyData,
  SankeyLegend,
  SankeyLink,
  SankeyNode,
  SankeyNodeLabel,
  SankeyTable,
} from "@kind-ui/charts";
export * from "./chart.js";
