import type * as Chart from "@kind-ui/charts";
export type SankeyChartReference = Pick<
  Chart.SankeyChartProps,
  "data" | "config" | "children" | "frameProps" | "interaction" | "animate"
>;
export type SankeyLegendReference = Pick<Chart.SankeyLegendProps, "children" | "className">;
