import {
  SankeyChart,
  type SankeyFinish,
  type SankeyFlowData,
  SankeyLink,
  type SankeyMaterial,
  SankeyNode,
  SankeyTable,
} from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ResponsiveContainer, Tooltip } from "recharts";
import "./sankeys.css";

const data: SankeyFlowData = {
  nodes: [
    { id: "supply", name: "Supply" },
    { id: "process", name: "Processing" },
    { id: "use", name: "Useful output" },
    { id: "loss", name: "Explicit loss" },
    { id: "reserve", name: "Reserve" },
  ],
  links: [
    { id: "feed", source: "supply", target: "process", value: 100 },
    { id: "useful", source: "process", target: "use", value: 75 },
    { id: "loss", source: "process", target: "loss", value: 25 },
    { id: "reserve", source: "supply", target: "reserve", value: 0 },
  ],
};
function Recipe({
  material,
  finish = "plain",
}: {
  material: SankeyMaterial;
  finish?: SankeyFinish;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const flow =
    scale === 1
      ? data
      : { ...data, links: data.links.map((link) => ({ ...link, value: link.value * scale })) };
  const inspected = flow.links.find((link) => link.id === active);
  return (
    <section data-finish={finish}>
      <h2>
        {material === "solid" ? "Energy balance · solid" : "Energy balance · gradient"} · {finish}
      </h2>
      <p>
        100 MWh enters processing. Useful output and explicit loss total 100 MWh. Reserve is
        measured zero.
      </p>
      <button
        type="button"
        onClick={() => {
          setScale(scale === 1 ? 2 : 1);
          setActive(null);
        }}
      >
        Change dataset
      </button>
      <section
        className="diagram-scroll"
        aria-label={`${material} flow diagram`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable chart viewport must be keyboard reachable.
        tabIndex={0}
      >
        <div className="diagram">
          <ResponsiveContainer width="100%" height={320}>
            <SankeyChart
              data={flow}
              animate={active === null}
              nodePadding={45}
              nodeWidth={14}
              margin={{ left: 90, right: 100, top: 25, bottom: 25 }}
              title={`${material} energy flows`}
              desc="Link widths are proportional to MWh. Inspect every flow using the table below."
              onClick={(item, kind) => {
                if (kind === "link") setActive(item.payload.id);
              }}
              node={(props) => (
                <g>
                  <SankeyNode finish={finish} {...props} color="#4338ca" />
                  <text
                    x={props.x > 300 ? props.x - 8 : props.x + props.width + 8}
                    y={props.y + props.height / 2}
                    textAnchor={props.x > 300 ? "end" : "start"}
                    dominantBaseline="middle"
                    fontSize={12}
                  >
                    {props.payload.name}
                  </text>
                </g>
              )}
              link={(props) => (
                <SankeyLink
                  {...props}
                  material={material}
                  finish={finish}
                  pathProps={
                    {
                      opacity: active && active !== props.payload.id ? 0.35 : 0.8,
                      "data-flow-id": String(props.payload.id),
                    } as React.SVGProps<SVGPathElement>
                  }
                />
              )}
            >
              <Tooltip />
            </SankeyChart>
          </ResponsiveContainer>
        </div>
      </section>
      <p role="status">
        {inspected
          ? `${inspected.id}: ${inspected.value} MWh`
          : "Select a link or use a flow button in the table."}
      </p>
      <SankeyTable
        data={flow}
        caption={`${material} flows in MWh (including zero)`}
        activeLinkId={active}
        onInspect={(link) => setActive(link.id)}
        formatValue={(value) => `${value} MWh`}
      />
    </section>
  );
}
function App() {
  const [empty, setEmpty] = useState(false);
  return (
    <main>
      <header>
        <p>KIND UI / FLOW SYSTEMS</p>
        <h1>Sankey recipes</h1>
        <p>Native geometry. Explicit balance. Every flow available by keyboard.</p>
      </header>
      <Recipe material="solid" />
      <Recipe material="gradient" />
      <Recipe material="gradient" finish="paper" />
      <Recipe material="gradient" finish="clay" />
      <Recipe material="gradient" finish="glow" />
      <section>
        <h2>Zero and empty</h2>
        <button type="button" onClick={() => setEmpty(!empty)}>
          Toggle empty
        </button>
        <SankeyChart
          width={240}
          height={70}
          data={
            empty
              ? { nodes: [], links: [] }
              : { nodes: data.nodes, links: data.links.filter((link) => link.id === "reserve") }
          }
          animate
        />
        <SankeyTable
          data={
            empty
              ? { nodes: [], links: [] }
              : { nodes: data.nodes, links: data.links.filter((link) => link.id === "reserve") }
          }
          caption={empty ? "Empty dataset: no observed flows" : "Measured zero reserve"}
        />
      </section>
      <footer>
        On narrow screens, scroll the diagram horizontally. Tables fit the viewport. Missing flows
        are not converted to zero. Finishes preserve the same link widths.
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
