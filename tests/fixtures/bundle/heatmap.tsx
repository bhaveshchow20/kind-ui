import { createHeatmapScale, HeatmapChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

createRoot(document.createElement("div")).render(
  <HeatmapChart
    rows={["Monday", "Tuesday"]}
    columns={["Week 1"]}
    data={[
      { row: "Monday", column: "Week 1", value: 12 },
      { row: "Tuesday", column: "Week 1", value: 30 },
    ]}
    scale={createHeatmapScale({ domain: [0, 30], colors: ["#ffffff", "#537f76"] })}
    config={{}}
    aria-label="Weekly activity"
  >
    <HeatmapChart.Grid caption="Weekly activity" />
  </HeatmapChart>,
);
