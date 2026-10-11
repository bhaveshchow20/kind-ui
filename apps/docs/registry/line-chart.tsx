"use client";
import { LineChart as CoreLineChart } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

// The configured core already owns Root and sizing: do not nest another frame.
export function LineChart<Row>(props: Parameters<typeof CoreLineChart<Row>>[0]) {
  return (
    <CoreLineChart<Row>
      height={280}
      margin={{ top: 24, right: 32, bottom: 16, left: 0 }}
      {...props}
    />
  );
}
export type {
  ConfiguredLineChartProps,
  ConfiguredLineSeries,
  LineAnimation,
} from "@kind-ui/charts";
export { LineDrawShape, LineSeries } from "@kind-ui/charts";
export * from "./chart.js";
