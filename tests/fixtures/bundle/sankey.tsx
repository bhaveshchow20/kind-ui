import { SankeyChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

createRoot(document.createElement("div")).render(
  <SankeyChart
    data={{
      nodes: [
        { id: "a", name: "Input" },
        { id: "b", name: "Output" },
      ],
      links: [{ id: "ab", source: "a", target: "b", value: 12 }],
    }}
    config={{ a: { label: "Input", color: "#537f76" }, b: { label: "Output", color: "#7e68ac" } }}
    width={600}
    height={260}
    aria-label="Resource flow"
  >
    <SankeyChart.Nodes />
    <SankeyChart.Links />
  </SankeyChart>,
);
