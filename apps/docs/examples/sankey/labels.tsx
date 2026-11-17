"use client";

import { SankeyChart, type SankeyFlowData, type SankeyNodeConfig } from "@kind-ui/charts";

const data = {
  nodes: [
    { id: "solar", name: "Solar" },
    { id: "wind", name: "Wind" },
    { id: "homes", name: "Homes" },
    { id: "industry", name: "Industry" },
  ],
  links: [
    { id: "solar-homes", source: "solar", target: "homes", value: 35 },
    { id: "solar-industry", source: "solar", target: "industry", value: 25 },
    { id: "wind-homes", source: "wind", target: "homes", value: 15 },
    { id: "wind-industry", source: "wind", target: "industry", value: 25 },
  ],
} satisfies SankeyFlowData;

const config = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#0f8b8d" },
  homes: { label: "Homes", color: "#447fd1" },
  industry: { label: "Industry", color: "#569951" },
} satisfies SankeyNodeConfig;

const sources = new Set(data.links.map((link) => link.source));

export default function LabeledFlowChart() {
  return (
    <SankeyChart
      config={config}
      data={data}
      height={220}
      nodePadding={24}
      sort={false}
      margin={{ top: 8, right: 112, bottom: 8, left: 112 }}
      aria-label="Energy from solar and wind to homes and industry, in MWh"
    >
      <SankeyChart.Nodes
        render={(node) => (
          <g>
            <SankeyChart.Node {...node} />
            <SankeyChart.NodeLabel
              node={node}
              data={data}
              side={sources.has(node.payload.id) ? "left" : "right"}
              showValues
              valueFormatter={(value) => `${value} MWh`}
              fill="currentColor"
            />
          </g>
        )}
      />
      <SankeyChart.Links
        render={(link) => (
          <SankeyChart.Link {...link} material="gradient" pathProps={{ strokeOpacity: 0.6 }} />
        )}
      />
      <SankeyChart.Tooltip formatter={(value) => `${value} MWh`} />
    </SankeyChart>
  );
}
