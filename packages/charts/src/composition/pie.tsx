"use client";

import { Cell, LabelList } from "recharts";
import { Tooltip } from "../animation.js";
import { FamilyLegend, type FamilyProps, familyChart, OutsidePlot } from "../family-root.js";
import {
  PieChart as NativePieChart,
  type PieChartProps as NativePieChartProps,
} from "../pie-chart.js";
import { PiePinRegistry } from "../pie-composition-pin.js";
import { PieSeries } from "../pie-series.js";

export type PieChartProps = FamilyProps<NativePieChartProps>;
function PieFamily(props: PieChartProps) {
  return (
    <PiePinRegistry category={props.defaultPinnedCategory}>
      {familyChart(NativePieChart, props, "PieChart")}
    </PiePinRegistry>
  );
}
export const PieChart = /* @__PURE__ */ Object.assign(PieFamily, {
  Tooltip,
  Legend: FamilyLegend,
  Content: OutsidePlot,
  Series: PieSeries,
  Cell,
  Labels: LabelList,
});
