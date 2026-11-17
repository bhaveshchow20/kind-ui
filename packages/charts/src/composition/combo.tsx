"use client";

import { Cell, LabelList } from "recharts";
import { LineSeries } from "../animation.js";
import { AreaSeries } from "../area-series.js";
import { BarSeries } from "../bar-series.js";
import {
  ComboChart as NativeComboChart,
  type ComboChartProps as NativeComboChartProps,
} from "../combo-chart.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { ScatterSeries } from "../scatter-series.js";
import { cartesian } from "./parts.js";

export type ComboChartProps = FamilyProps<
  Omit<NativeComboChartProps, "data"> & {
    /** The rows to plot. Each series reads its `dataKey` from every row. */
    data?: NonNullable<NativeComboChartProps["data"]>;
  }
>;
function ComboFamily(props: ComboChartProps) {
  return familyChart(NativeComboChart, props, "ComboChart");
}
export const ComboChart = /* @__PURE__ */ Object.assign(ComboFamily, {
  ...cartesian,
  Line: LineSeries,
  Area: AreaSeries,
  Bar: BarSeries,
  Scatter: ScatterSeries,
  Cell,
  Labels: LabelList,
});
