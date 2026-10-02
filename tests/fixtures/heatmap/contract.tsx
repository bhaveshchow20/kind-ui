import * as Chart from "@kind-ui/charts";

const props = {
  rows: [],
  columns: [],
  data: [],
  scale: Chart.createHeatmapScale({ domain: [0, 1], colors: ["#000000", "#ffffff"] }),
};
// @ts-expect-error Heatmap has no public material type; card styling is native host CSS.
export type RemovedMaterial = Chart.HeatmapMaterial;
// @ts-expect-error Heatmap has no material prop.
export const RejectedMaterial = <Chart.HeatmapChart {...props} material="paper" />;
export const NativeHost = (
  <Chart.HeatmapChart
    {...props}
    className="host-card"
    style={{ padding: 16, border: "1px solid #d1d5db" }}
  />
);
