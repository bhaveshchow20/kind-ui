"use client";

import {
  AreaChart as NativeAreaChart,
  type AreaChartProps as NativeAreaChartProps,
} from "../area-chart.js";
import { AreaSeries } from "../area-series.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { cartesian } from "./parts.js";

export type AreaChartProps = FamilyProps<NativeAreaChartProps>;
function AreaFamily(props: AreaChartProps) {
  return familyChart(NativeAreaChart, props, "AreaChart");
}
export const AreaChart = /* @__PURE__ */ Object.assign(AreaFamily, {
  ...cartesian,
  Series: AreaSeries,
});
