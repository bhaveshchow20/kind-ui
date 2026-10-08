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

export function ConfiguredFlowChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root
      config={nodeConfig}
      interaction={{
        kind: "node",
        mode: "focus",
        eligibleKeys: data.nodes.map((node) => node.id),
        markActivation: "matching-legend",
      }}
    >
      <section aria-label="Energy allocation">
        <Chart.ResponsiveContainer width="100%" height={250}>
          <Chart.SankeyChart
            interactionBinding="root"
            loading={state === "loading"}
            data={data}
            nodeConfig={nodeConfig}
            animate={{ revealDurationMs: 900 }}
          >
            <Tooltip
              isAnimationActive={false}
              formatter={(value) => `${value} MWh`}
              contentStyle={{
                padding: "6px 8px",
                fontSize: 12,
                lineHeight: "16px",
                background: "var(--kind-ui-chart-popover, var(--popover, Canvas))",
                color:
                  "var(--kind-ui-chart-popover-foreground, var(--popover-foreground, CanvasText))",
                border: "1px solid var(--kind-ui-chart-border, var(--border, GrayText))",
                borderRadius: "var(--kind-ui-chart-radius, var(--radius, 8px))",
              }}
              itemStyle={{ padding: 0, color: "inherit" }}
            />
          </Chart.SankeyChart>
        </Chart.ResponsiveContainer>
        <Chart.SankeyLegend config={nodeConfig} interactionBinding="root" />
      </section>
    </Chart.Root>
  );
}
