"use client";

import { Cell, LabelList } from "recharts";
import {
  BarChart as NativeBarChart,
  type BarChartProps as NativeBarChartProps,
} from "../bar-chart.js";
import { BarSeries } from "../bar-series.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { cartesian } from "./parts.js";

export type BarChartProps = FamilyProps<NativeBarChartProps>;
function BarFamily(props: BarChartProps) {
  return familyChart(NativeBarChart, props, "BarChart");
}
export const BarChart = /* @__PURE__ */ Object.assign(BarFamily, {
  ...cartesian,
  Series: BarSeries,
  Cell,
  Labels: LabelList,
});
