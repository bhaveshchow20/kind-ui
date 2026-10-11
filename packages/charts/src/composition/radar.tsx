"use client";

import { type FamilyProps, familyChart } from "../family-root.js";
import {
  RadarChart as NativeRadarChart,
  type RadarChartProps as NativeRadarChartProps,
} from "../polar-chart.js";
import { RadarSeries } from "../polar-series.js";
import { polar } from "./parts.js";

export type RadarChartProps<DataPoint = unknown> = FamilyProps<NativeRadarChartProps<DataPoint>>;
function RadarFamily<DataPoint = unknown>(props: RadarChartProps<DataPoint>) {
  return familyChart(NativeRadarChart<DataPoint>, props, "RadarChart");
}
export const RadarChart = /* @__PURE__ */ Object.assign(RadarFamily, {
  ...polar,
  Series: RadarSeries,
});
