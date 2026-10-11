"use client";
import {
  HeatmapChart as CoreHeatmapChart,
  type HeatmapChartProps as CoreProps,
  HeatmapDataTable,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

export type HeatmapChartProps = CoreProps;
// Standalone cores already supply their own context; caller owns all observations.
export function HeatmapChart({ children, ...props }: HeatmapChartProps) {
  return (
    <CoreHeatmapChart animate {...props}>
      {children === undefined ? (
        <>
          <HeatmapGrid caption={props["aria-label"] ?? "Chart data"} />
          <HeatmapLegend label="Values" />
          <HeatmapTooltip />
          <HeatmapDataTable caption="Exact chart values" />
        </>
      ) : (
        children
      )}
    </CoreHeatmapChart>
  );
}
export type { HeatmapDatum, HeatmapMaterial, HeatmapScale } from "@kind-ui/charts";
export {
  createHeatmapModel,
  createHeatmapScale,
  HeatmapCellContent,
  HeatmapDataTable,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
} from "@kind-ui/charts";
export * from "./chart.js";
