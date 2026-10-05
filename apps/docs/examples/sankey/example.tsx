"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";
import { Tooltip } from "recharts";

const data = {
  nodes: [
    { id: "solar", name: "Solar" },
    { id: "wind", name: "Wind" },
    { id: "hydro", name: "Hydro" },
    { id: "north", name: "North" },
    { id: "central", name: "Central" },
    { id: "south", name: "South" },
    { id: "homes", name: "Homes" },
    { id: "industry", name: "Industry" },
    { id: "services", name: "Services" },
  ],
  links: [
    { id: "solar-north", source: "solar", target: "north", value: 30 },
    { id: "solar-central", source: "solar", target: "central", value: 20 },
    { id: "solar-south", source: "solar", target: "south", value: 10 },
    { id: "wind-north", source: "wind", target: "north", value: 20 },
    { id: "wind-central", source: "wind", target: "central", value: 30 },
    { id: "wind-south", source: "wind", target: "south", value: 30 },
    { id: "hydro-north", source: "hydro", target: "north", value: 20 },
    { id: "hydro-central", source: "hydro", target: "central", value: 10 },
    { id: "hydro-south", source: "hydro", target: "south", value: 10 },
    { id: "north-homes", source: "north", target: "homes", value: 35 },
    { id: "north-industry", source: "north", target: "industry", value: 25 },
    { id: "north-services", source: "north", target: "services", value: 10 },
    { id: "central-homes", source: "central", target: "homes", value: 15 },
    { id: "central-industry", source: "central", target: "industry", value: 30 },
    { id: "central-services", source: "central", target: "services", value: 15 },
    { id: "south-homes", source: "south", target: "homes", value: 10 },
    { id: "south-industry", source: "south", target: "industry", value: 15 },
    { id: "south-services", source: "south", target: "services", value: 25 },
  ],
} satisfies Chart.SankeyFlowData;
const nodeConfig = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#159c91" },
  hydro: { label: "Hydro", color: "#447fd1" },
  north: { label: "North", color: "#8865ce" },
  central: { label: "Central", color: "#d27559" },
  south: { label: "South", color: "#569951" },
  homes: { label: "Homes", color: "#d29319" },
  industry: { label: "Industry", color: "#447fd1" },
  services: { label: "Services", color: "#159c91" },
} satisfies Chart.SankeyNodeConfig;
const names = new Map(data.nodes.map((node) => [node.id, node.name]));

export function EnergyFlowChart() {
  const [active, setActive] = useState<string | null>(null);
  const selected = data.links.find((link) => link.id === active);
  return (
    <section aria-label="Illustrative energy allocation">
      <section
        aria-label="Energy flow diagram; scroll horizontally on small screens"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Horizontal chart scrolling is keyboard accessible.
        tabIndex={0}
        style={{ overflowX: "auto", overscrollBehaviorY: "auto" }}
      >
        <div style={{ minWidth: 540 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              padding: "0 28px",
            }}
          >
            <span>Generation</span>
            <span>Balancing zones</span>
            <span>End use</span>
          </div>
          <Chart.ResponsiveContainer width="100%" height={250}>
            <Chart.SankeyChart
              data={data}
              nodeConfig={nodeConfig}
              animate={{ revealDurationMs: 900 }}
              nodeWidth={10}
              nodePadding={16}
              sort={false}
              margin={{ top: 28, right: 32, bottom: 8, left: 32 }}
              title="Energy allocation: 180 MWh across three stages"
              desc="Nine nodes and eighteen flows. Ribbon widths represent MWh. Select a flow with a click, Enter or Space; Escape clears selection."
              node={(props) => (
                <g>
                  <Chart.SankeyNode {...props} />
                  <text
                    x={props.x + props.width / 2}
                    y={props.y - 7}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={11}
                  >
                    {props.payload.name}
                  </text>
                </g>
              )}
              link={(props) => (
                <Chart.SankeyLink
                  {...props}
                  material="gradient"
                  pathProps={{
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `${props.payload.source.name} to ${props.payload.target.name}: ${props.payload.value} MWh`,
                    "aria-pressed": active === props.payload.id,
                    opacity: active && active !== props.payload.id ? 0.12 : 0.55,
                    onClick: () => setActive(active === props.payload.id ? null : props.payload.id),
                    onKeyDown: (event) => {
                      if (event.key === "Escape") setActive(null);
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActive(active === props.payload.id ? null : props.payload.id);
                      }
                    },
                  }}
                />
              )}
            >
              <Tooltip isAnimationActive={false} formatter={(value) => `${value} MWh`} />
            </Chart.SankeyChart>
          </Chart.ResponsiveContainer>
        </div>
      </section>
      <Chart.SankeyLegend config={nodeConfig} />
      <p role="status" style={{ fontSize: 12, margin: "8px 0 0" }}>
        {selected
          ? `${names.get(selected.source)} → ${names.get(selected.target)}: ${selected.value} MWh`
          : "180 MWh · Select a ribbon to inspect its route."}
      </p>
      <Chart.SankeyTable
        data={data}
        caption="Illustrative allocation in MWh"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </section>
  );
}
