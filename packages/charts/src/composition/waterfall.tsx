"use client";

import { LabelList } from "recharts";
import { type FamilyProps, familyChart } from "../family-root.js";
import {
  WaterfallChart as NativeWaterfallChart,
  type WaterfallChartProps as NativeWaterfallChartProps,
} from "../waterfall-chart.js";
import { WaterfallConnectors, WaterfallSeries } from "../waterfall-series.js";
import { cartesian } from "./parts.js";

export type WaterfallChartProps = FamilyProps<NativeWaterfallChartProps>;
function WaterfallFamily(props: WaterfallChartProps) {
  return familyChart(NativeWaterfallChart, props, "WaterfallChart");
}
export const WaterfallChart = /* @__PURE__ */ Object.assign(WaterfallFamily, {
  ...cartesian,
  Series: WaterfallSeries,
  Connectors: WaterfallConnectors,
  Labels: LabelList,
});
