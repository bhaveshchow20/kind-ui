"use client";

import { Cell, LabelList } from "recharts";
import {
  BarChart as NativeBarChart,
  type BarChartProps as NativeBarChartProps,
} from "../bar-chart.js";
import { BarSeries } from "../bar-series.js";
import { type FamilyProps, familyChart } from "../family-root.js";
import { cartesian } from "./parts.js";

type BarPlotProps = Omit<NativeBarChartProps, "emphasis"> & {
  categoryComparison?: boolean;
};
function BarPlot({ categoryComparison, ...props }: BarPlotProps) {
  return <NativeBarChart {...props} emphasis={categoryComparison ? "category" : "none"} />;
}
type BarEmphasis<Props> = Props extends unknown
  ? Omit<Props, "emphasis"> & {
      /**
       * Dims the other series while one is hovered or focused. `"category"` dims the other
       * categories instead, while a bar is inspected. `"none"` turns it off.
       * @default "auto"
       */
      emphasis?: "auto" | "none" | "category";
    }
  : never;
export type BarChartProps = BarEmphasis<FamilyProps<NativeBarChartProps>>;
function BarFamily({ emphasis, ...props }: BarChartProps) {
  return familyChart(
    BarPlot,
    {
      ...props,
      ...(emphasis !== undefined ? { emphasis: emphasis === "category" ? "auto" : emphasis } : {}),
      categoryComparison: emphasis === "category",
    },
    "BarChart",
  );
}
export const BarChart = /* @__PURE__ */ Object.assign(BarFamily, {
  ...cartesian,
  Series: BarSeries,
  Cell,
  Labels: LabelList,
});
