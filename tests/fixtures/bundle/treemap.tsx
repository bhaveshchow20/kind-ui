import { TreemapChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

const node = document.getElementById("root") ?? document.body;
createRoot(node).render(
  <TreemapChart
    data={[{ kind: "leaf", id: "one", label: "One", value: 1 }]}
    config={{}}
    loading
    aria-label="Treemap"
  >
    <TreemapChart.Tiles />
  </TreemapChart>,
);
