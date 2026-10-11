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
const nodeConfig = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#159c91" },
  homes: { label: "Homes", color: "#8865ce" },
  industry: { label: "Industry", color: "#447fd1" },
} satisfies SankeyNodeConfig;

export function ConfiguredFlowChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <section aria-label="Energy allocation">
      <SankeyChart
        interactionBinding="root"
        loading={state === "loading"}
        data={data}
        config={nodeConfig}
        height={250}
        aria-label="Energy allocation"
        rootProps={{
          interaction: {
            kind: "node",
            mode: "focus",
            eligibleKeys: data.nodes.map((node) => node.id),
            markActivation: "matching-legend",
          },
        }}
        animate={{ revealDurationMs: 900 }}
      >
        <SankeyChart.Nodes />
        <SankeyChart.Links />
        <SankeyChart.Tooltip
          isAnimationActive={false}
          formatter={(value) => `${value} MWh`}
          contentStyle={{
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: "16px",
            background: "var(--popover, Canvas)",
            color: "var(--popover-foreground, CanvasText)",
            border: "1px solid var(--border, GrayText)",
            borderRadius: "var(--radius, 8px)",
          }}
          itemStyle={{ padding: 0, color: "inherit" }}
        />
        <SankeyChart.Legend />
      </SankeyChart>
    </section>
  );
}
