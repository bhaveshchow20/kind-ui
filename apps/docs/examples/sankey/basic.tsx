"use client";

import { SankeyChart, type SankeyFlowData, type SankeyNodeConfig } from "@kind-ui/charts";

const data = {
  nodes: [
    { id: "solar", name: "Solar" },
    { id: "wind", name: "Wind" },
    { id: "north", name: "North" },
    { id: "south", name: "South" },
    { id: "homes", name: "Homes" },
    { id: "industry", name: "Industry" },
  ],
  links: [
    { id: "solar-north", source: "solar", target: "north", value: 30 },
    { id: "solar-south", source: "solar", target: "south", value: 20 },
    { id: "wind-north", source: "wind", target: "north", value: 15 },
    { id: "wind-south", source: "wind", target: "south", value: 35 },
    { id: "north-homes", source: "north", target: "homes", value: 25 },
    { id: "north-industry", source: "north", target: "industry", value: 20 },
    { id: "south-homes", source: "south", target: "homes", value: 20 },
    { id: "south-industry", source: "south", target: "industry", value: 35 },
  ],
} satisfies SankeyFlowData;

const config = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#0f8b8d" },
  north: { label: "North", color: "#733bff" },
  south: { label: "South", color: "#d27559" },
  homes: { label: "Homes", color: "#447fd1" },
  industry: { label: "Industry", color: "#569951" },
} satisfies SankeyNodeConfig;

export default function EnergyFlowChart() {
  return (
    <SankeyChart
      config={config}
      data={data}
      height={260}
      nodePadding={16}
      sort={false}
      aria-label="Energy from solar and wind through two zones to homes and industry, in MWh"
    >
      <SankeyChart.Nodes />
      <SankeyChart.Links
        render={(link) => <SankeyChart.Link {...link} pathProps={{ strokeOpacity: 0.6 }} />}
      />
      <SankeyChart.Tooltip formatter={(value) => `${value} MWh`} />
      <SankeyChart.Legend />
    </SankeyChart>
  );
}
