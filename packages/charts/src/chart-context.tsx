"use client";

import { createContext, useContext } from "react";
import type { ColorStops } from "./series-color.js";
import type { ResolvedSeriesConfig } from "./series-label.js";

type Visibility = {
  visibleSeries?: readonly string[];
  onVisibleSeriesChange?: (next: string[]) => void;
};
export type ChartContextValue = Visibility & {
  config: ResolvedSeriesConfig;
  colorId: string;
  colorStops: Readonly<Record<string, ColorStops>>;
  paints: Readonly<Record<string, string>>;
};
export const ChartContext = createContext<ChartContextValue | null>(null);
export function useChart() {
  const chart = useContext(ChartContext);
  if (!chart) throw new Error("Chart components must be inside Root");
  return chart;
}
