"use client";

import {
  BoxPlotMark,
  BoxPlotSeries,
  BoxPlotChart as NativeBoxPlotChart,
  type BoxPlotChartProps as NativeBoxPlotChartProps,
} from "../box-plot.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { cartesian } from "./parts.js";

export type BoxPlotChartProps = FamilyProps<NativeBoxPlotChartProps>;
function BoxPlotFamily(props: BoxPlotChartProps) {
  return familyChart(NativeBoxPlotChart, props, "BoxPlotChart");
}
export const BoxPlotChart = /* @__PURE__ */ Object.assign(BoxPlotFamily, {
  ...cartesian,
  Series: BoxPlotSeries,
  Mark: BoxPlotMark,
});
