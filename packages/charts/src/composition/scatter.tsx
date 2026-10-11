"use client";

import { ScatterXAxis, ScatterYAxis, ZAxis } from "../cartesian-parts.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import {
  ScatterChart as NativeScatterChart,
  type ScatterChartProps as NativeScatterChartProps,
} from "../scatter-chart.js";
import { ScatterSeries } from "../scatter-series.js";
import { ScatterTooltip } from "../scatter-tooltip.js";
import { cartesian } from "./parts.js";

export type ScatterChartProps = FamilyProps<NativeScatterChartProps>;
function ScatterFamily(props: ScatterChartProps) {
  return familyChart(NativeScatterChart, props, "ScatterChart");
}
export const ScatterChart = /* @__PURE__ */ Object.assign(ScatterFamily, {
  ...cartesian,
  XAxis: ScatterXAxis,
  YAxis: ScatterYAxis,
  ZAxis,
  Series: ScatterSeries,
  Tooltip: ScatterTooltip,
});
