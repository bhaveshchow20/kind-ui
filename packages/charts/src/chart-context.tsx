"use client";

import { createContext, useContext } from "react";
import type { SeriesConfig } from "./types.js";

type Visibility = {
  visibleSeries?: readonly string[];
  onVisibleSeriesChange?: (next: string[]) => void;
};
export type ChartContextValue = Visibility & { config: SeriesConfig };
export const ChartContext = createContext<ChartContextValue | null>(null);
export function useChart() {
  const chart = useContext(ChartContext);
  if (!chart) throw new Error("Chart components must be inside Root");
  return chart;
}
