"use client";

import { type FamilyProps, familyChart } from "../family-root.js";
import {
  HistogramXAxis,
  HistogramYAxis,
  HistogramChart as NativeHistogramChart,
  type HistogramChartProps as NativeHistogramChartProps,
} from "../histogram-chart.js";
import { HistogramSeries } from "../histogram-series.js";
import { cartesian } from "./parts.js";

export type HistogramChartProps = FamilyProps<
  NativeHistogramChartProps,
  Omit<NativeHistogramChartProps, "xAxisProps" | "yAxisProps"> & {
    xAxisProps?: never;
    yAxisProps?: never;
  }
>;
function HistogramFamily(props: HistogramChartProps) {
  return familyChart(NativeHistogramChart, props, "HistogramChart");
}
export const HistogramChart = /* @__PURE__ */ Object.assign(HistogramFamily, {
  ...cartesian,
  XAxis: HistogramXAxis,
  YAxis: HistogramYAxis,
  Series: HistogramSeries,
});
