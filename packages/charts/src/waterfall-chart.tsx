"use client";

import { BarChartImplementation, type BarChartProps } from "./bar-chart.js";

export type WaterfallChartProps = BarChartProps;

/** Native bar composition, with a fixed waterfall silhouette while loading. */
export function WaterfallChart(props: WaterfallChartProps) {
  return <BarChartImplementation chartProps={props} family="waterfall" />;
}
