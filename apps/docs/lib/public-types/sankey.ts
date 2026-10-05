import type * as Chart from "@kind-ui/charts";
export type SankeyChartReference = Pick<
  Chart.SankeyChartProps,
  "data" | "nodeConfig" | "node" | "link" | "animate"
>;
export type SankeyLegendReference = Pick<Chart.SankeyLegendProps, "config" | "children">;
