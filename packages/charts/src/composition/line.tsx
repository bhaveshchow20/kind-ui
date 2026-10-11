"use client";

import { useId } from "react";
import {
  LineSeries,
  LineChart as NativeLineChart,
  type LineChartProps as NativeLineChartProps,
} from "../animation.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { cartesian } from "./parts.js";

export type LineChartProps<DataPoint = unknown> = FamilyProps<
  Omit<NativeLineChartProps, "data"> & {
    data?: readonly DataPoint[];
    "aria-describedby"?: string;
  }
>;
function LineFamily<DataPoint = unknown>(props: LineChartProps<DataPoint>) {
  const instructionId = useId();
  const accessibilityLayer = props.accessibilityLayer ?? true;
  const describedBy = [props["aria-describedby"], accessibilityLayer ? instructionId : undefined]
    .filter(Boolean)
    .join(" ");
  return familyChart(
    NativeLineChart,
    {
      ...props,
      animate: props.animate ?? true,
      accessibilityLayer,
      ...(describedBy ? { "aria-describedby": describedBy } : {}),
    },
    "LineChart",
    accessibilityLayer
      ? {
          id: instructionId,
          text: "Focus the chart and use the arrow keys to inspect values. Press Escape to dismiss the tooltip.",
        }
      : undefined,
  );
}
export const LineChart = /* @__PURE__ */ Object.assign(LineFamily, {
  ...cartesian,
  Series: LineSeries,
});
