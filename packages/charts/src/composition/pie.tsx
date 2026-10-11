"use client";

import { Cell, LabelList } from "recharts";
import { Tooltip } from "../animation.js";
import { FamilyLegend, type FamilyProps, familyChart } from "../family-root.js";
import {
  PieChart as NativePieChart,
  type PieChartProps as NativePieChartProps,
} from "../pie-chart.js";
import { PiePinRegistry } from "../pie-composition-pin.js";
import { PieSeries } from "../pie-series.js";

export type PieChartProps = FamilyProps<NativePieChartProps>;
function PieFamily(props: PieChartProps) {
  if (props.config === undefined) return familyChart(NativePieChart, props, "PieChart");
  return (
    <PiePinRegistry category={props.defaultPinnedCategory}>
      {familyChart(NativePieChart, props, "PieChart")}
    </PiePinRegistry>
  );
}
export const PieChart = /* @__PURE__ */ Object.assign(PieFamily, {
  Tooltip,
  Legend: FamilyLegend,
  Series: PieSeries,
  Cell,
  Labels: LabelList,
});
