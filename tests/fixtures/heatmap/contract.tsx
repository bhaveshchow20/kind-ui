import * as Chart from "@kind-ui/charts";

const props = {
  rows: [],
  columns: [],
  data: [],
  scale: Chart.createHeatmapScale({ domain: [0, 1], colors: ["#000000", "#ffffff"] }),
};
export const materials: Chart.HeatmapMaterial[] = ["plain", "paper", "clay", "glow"];
export const Materials = materials.map((material) => (
  <Chart.HeatmapGrid key={material} caption="Materials" material={material} />
));
// @ts-expect-error Unsupported finishes must not silently become Plain.
export const RejectedGridMaterial = <Chart.HeatmapGrid caption="Wrong" material="glass" />;
// @ts-expect-error Heatmap has no material prop.
export const RejectedMaterial = <Chart.HeatmapChart {...props} material="paper" />;
export const NativeHost = (
  <Chart.HeatmapChart
    {...props}
    className="host-card"
    style={{ padding: 16, border: "1px solid #d1d5db" }}
  />
);
