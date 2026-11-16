import { FunnelChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

createRoot(document.createElement("div")).render(
  <FunnelChart
    data={[
      { id: "started", label: "Started", value: 100 },
      { id: "finished", label: "Finished", value: 40 },
    ]}
    config={{ started: { color: "#537f76" }, finished: { color: "#7e68ac" } }}
    width={600}
    height={260}
    aria-label="Ordered stages"
  >
    <FunnelChart.Stages />
  </FunnelChart>,
);
