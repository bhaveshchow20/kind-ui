"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { Tooltip } from "recharts";

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
} satisfies Chart.SankeyFlowData;
const nodeConfig = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#159c91" },
  homes: { label: "Homes", color: "#8865ce" },
  industry: { label: "Industry", color: "#447fd1" },
} satisfies Chart.SankeyNodeConfig;

export function ConfiguredFlowChart() {
  return (
    <section aria-label="Energy allocation">
      <Chart.ResponsiveContainer width="100%" height={250}>
        <Chart.SankeyChart data={data} nodeConfig={nodeConfig}>
          <Tooltip isAnimationActive={false} formatter={(value) => `${value} MWh`} />
        </Chart.SankeyChart>
      </Chart.ResponsiveContainer>
      <Chart.SankeyLegend config={nodeConfig} />
    </section>
  );
}
