import {
  prepareSankeyData,
  ResponsiveContainer,
  SankeyChart,
  type SankeyFinish,
  type SankeyFlowData,
  SankeyLink,
  SankeyNode,
  SankeyTable,
} from "@kind-ui/charts";
import { useState } from "react";

const nodes = [
  { id: "solar", name: "Solar", color: "#d99a16", value: 60 },
  { id: "wind", name: "Wind", color: "#008f91", value: 80 },
  { id: "hydro", name: "Hydro", color: "#3875d8", value: 40 },
  { id: "north", name: "North zone", color: "#7558c9", value: 70 },
  { id: "central", name: "Central zone", color: "#cd6651", value: 60 },
  { id: "south", name: "South zone", color: "#458b57", value: 50 },
  { id: "direct", name: "Direct supply", color: "#4477ca", value: 100 },
  { id: "stored", name: "Stored supply", color: "#9460b7", value: 50 },
  { id: "firm", name: "Firm supply", color: "#2d9692", value: 30 },
  { id: "city", name: "City grid", color: "#c1763d", value: 70 },
  { id: "county", name: "County grid", color: "#6566c6", value: 65 },
  { id: "metro", name: "Metro grid", color: "#2696b4", value: 45 },
  { id: "homes", name: "Homes", color: "#d19322", value: 55 },
  { id: "industry", name: "Industry", color: "#437ad2", value: 60 },
  { id: "services", name: "Services", color: "#238f80", value: 40 },
  { id: "public", name: "Public estate", color: "#925ab1", value: 25 },
];
const stages = [
  "Generation",
  "Balancing zones",
  "Supply portfolios",
  "Delivery networks",
  "End use",
];
const connections: [string, string, number][] = [
  ["solar", "north", 30],
  ["solar", "central", 20],
  ["solar", "south", 10],
  ["wind", "north", 20],
  ["wind", "central", 30],
  ["wind", "south", 30],
  ["hydro", "north", 20],
  ["hydro", "central", 10],
  ["hydro", "south", 10],
  ["north", "direct", 40],
  ["north", "stored", 20],
  ["north", "firm", 10],
  ["central", "direct", 35],
  ["central", "stored", 15],
  ["central", "firm", 10],
  ["south", "direct", 25],
  ["south", "stored", 15],
  ["south", "firm", 10],
  ["direct", "city", 40],
  ["direct", "county", 40],
  ["direct", "metro", 20],
  ["stored", "city", 20],
  ["stored", "county", 15],
  ["stored", "metro", 15],
  ["firm", "city", 10],
  ["firm", "county", 10],
  ["firm", "metro", 10],
  ["city", "homes", 25],
  ["city", "industry", 20],
  ["city", "services", 15],
  ["city", "public", 10],
  ["county", "homes", 25],
  ["county", "industry", 25],
  ["county", "services", 10],
  ["county", "public", 5],
  ["metro", "homes", 5],
  ["metro", "industry", 15],
  ["metro", "services", 15],
  ["metro", "public", 10],
];
export const networkData: SankeyFlowData = {
  nodes,
  links: connections.map(([source, target, value]) => ({
    id: `${source} → ${target}`,
    source,
    target,
    value,
  })),
};
prepareSankeyData(networkData);
const colors = new Map(nodes.map((node) => [node.id, node.color]));
const totals = new Map(nodes.map((node) => [node.id, node.value]));

export function SankeyNetwork() {
  const [finish, setFinish] = useState<SankeyFinish>("plain");
  const [active, setActive] = useState<string | null>(null);
  const inspected = networkData.links.find((link) => link.id === active);
  return (
    <article className="network" aria-label="Regional energy allocation">
      <div className="network-capture">
        <div className="network-heading">
          <p className="network-eyebrow">KIND UI / A CONNECTED ENERGY SYSTEM</p>
          <h2>One supply. Many routes.</h2>
          <p>180 MWh across five stages, 16 nodes and 39 branching, recombining flows.</p>
          <p className="network-note">
            Illustrative allocation, before conversion losses. Every intermediate node balances.
            Ribbon width = MWh.
          </p>
        </div>
        <fieldset className="network-controls" aria-label="Network finish">
          {(["plain", "paper", "clay", "glow"] as const).map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={finish === item}
              onClick={() => setFinish(item)}
            >
              {item}
            </button>
          ))}
        </fieldset>
        <section
          className="network-scroll"
          aria-label="Five-stage energy diagram"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Native chart is horizontally scrollable by keyboard.
          tabIndex={0}
        >
          <div className="network-diagram">
            <div className="network-stages">
              {stages.map((stage, index) => (
                <span key={stage}>
                  <small>0{index + 1}</small>
                  {stage}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={800}>
              <SankeyChart
                data={networkData}
                nodePadding={45}
                nodeWidth={12}
                sort={false}
                margin={{ left: 90, right: 100, top: 48, bottom: 12 }}
                title="Regional energy allocation: 180 MWh"
                desc="Five stages connect 16 nodes through 39 flows. Gradient ribbons interpolate the source and destination colors; widths represent MWh. Use the table to inspect every route."
                onClick={(item, kind) => {
                  if (kind === "link")
                    setActive((current) => (current === item.payload.id ? null : item.payload.id));
                }}
                node={(props) => (
                  <g>
                    <SankeyNode {...props} finish={finish} color={colors.get(props.payload.id)} />
                    <text
                      x={props.x + props.width / 2}
                      y={props.y - 23}
                      textAnchor="middle"
                      className="network-label"
                    >
                      <tspan x={props.x + props.width / 2}>{props.payload.name}</tspan>
                      <tspan x={props.x + props.width / 2} dy={16} className="network-value">
                        {totals.get(props.payload.id)} MWh
                      </tspan>
                    </text>
                  </g>
                )}
                link={(props) => (
                  <SankeyLink
                    {...props}
                    material="gradient"
                    finish={finish}
                    color={colors.get(props.payload.source.id)}
                    targetColor={colors.get(props.payload.target.id)}
                    pathProps={
                      {
                        "aria-label": `${props.payload.id}: ${props.payload.value} MWh`,
                        opacity: active && active !== props.payload.id ? 0.14 : 0.52,
                        "data-network-flow": props.payload.id,
                      } as React.SVGProps<SVGPathElement>
                    }
                  />
                )}
              />
            </ResponsiveContainer>
          </div>
        </section>
        <p className="network-key">
          SOURCE COLORS → DESTINATION COLORS{" "}
          <span>Balanced at every stage · 180 MWh in / 180 MWh out</span>
        </p>
      </div>
      <p role="status">
        {inspected
          ? `${inspected.id}: ${inspected.value} MWh`
          : "Select a ribbon or inspect any route below. On a phone, scroll the diagram horizontally."}
      </p>
      <SankeyTable
        data={networkData}
        caption="All 39 routes · illustrative allocated MWh"
        activeLinkId={active}
        onInspect={(link) => setActive((current) => (current === link.id ? null : link.id))}
        formatValue={(value) => `${value} MWh`}
      />
    </article>
  );
}
