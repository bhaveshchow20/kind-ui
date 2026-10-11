"use client";

import { Cell, LabelList } from "recharts";
import { type FamilyProps, familyChart } from "../family-root.js";
import {
  RadialBarChart as NativeRadialBarChart,
  type RadialBarChartProps as NativeRadialBarChartProps,
} from "../polar-chart.js";
import { RadialBarSeries } from "../polar-series.js";
import { RadialBarLabel } from "../radial-bar-label.js";
import { polar } from "./parts.js";

export type RadialBarChartProps<DataPoint = unknown> = FamilyProps<
  NativeRadialBarChartProps<DataPoint>
>;
function RadialBarFamily<DataPoint = unknown>(props: RadialBarChartProps<DataPoint>) {
  return familyChart(NativeRadialBarChart<DataPoint>, props, "RadialBarChart");
}
export const RadialBarChart = /* @__PURE__ */ Object.assign(RadialBarFamily, {
  ...polar,
  Series: RadialBarSeries,
  Cell,
  Labels: LabelList,
  Label: RadialBarLabel,
});
