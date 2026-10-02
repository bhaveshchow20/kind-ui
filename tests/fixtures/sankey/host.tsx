import {
  prepareSankeyData,
  SankeyChart,
  type SankeyFlowData,
  SankeyLink,
  type SankeyLinkProps,
  type SankeyMaterial,
  SankeyNode,
  SankeyTable,
} from "@kind-ui/charts";
import { useState } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";

const data: SankeyFlowData = {
  nodes: [
    { id: "a", name: "Input" },
    { id: "b", name: "Output" },
  ],
  links: [
    { id: "ab", source: "a", target: "b", value: 10 },
    { id: "zero", source: 0, target: 1, value: 0 },
  ],
};
void prepareSankeyData(data);
const finish: SankeyMaterial = "gradient";
export function Host() {
  const [shown, setShown] = useState(true);
  const extreme = new URLSearchParams(window.location.search).get("extreme");
  const [value, setValue] = useState(
    extreme === "tiny"
      ? Number.MIN_VALUE
      : extreme === "huge" || extreme === "aggregate"
        ? 1e308
        : 10,
  );
  const [narrow, setNarrow] = useState(false);
  const base =
    extreme === "aggregate" || extreme === "padding"
      ? {
          nodes: [
            ...data.nodes,
            { id: "c", name: "Second input" },
            { id: "d", name: "Second output" },
          ],
          links: [...data.links, { id: "cd", source: 2, target: 3, value: 10 }],
        }
      : data;
  const flow =
    extreme === "padding"
      ? {
          ...base,
          links: base.links.map((link) => ({
            ...link,
            value: link.id === "cd" ? Number.MIN_VALUE : link.value > 0 ? 50 : 0,
          })),
        }
      : value === 10
        ? base
        : {
            ...base,
            links: base.links.map((link) => ({ ...link, value: link.value > 0 ? value : 0 })),
          };
  const [active, setActive] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setShown(!shown)}>
        Toggle chart
      </button>
      <button type="button" onClick={() => setValue(value === 10 ? 20 : 10)}>
        Change data
      </button>
      <button type="button" onClick={() => setNarrow(!narrow)}>
        Narrow frame
      </button>
      <div style={{ width: narrow ? 5 : "100%", height: extreme === "padding" ? 41 : 250 }}>
        {shown && (
          <ResponsiveContainer>
            <SankeyChart
              data={flow}
              animate={{ revealDurationMs: 3000 }}
              title="Packed Sankey"
              node={(props) => (
                <SankeyNode {...props} rectProps={{ "aria-label": "Native node" }} />
              )}
              link={(props: SankeyLinkProps) => (
                <SankeyLink
                  {...props}
                  material={finish}
                  pathProps={{ "aria-label": props.payload.id, style: { strokeWidth: 99 } }}
                />
              )}
              onClick={(item, type, event) => {
                void item.index;
                const id: string = item.payload.id;
                void id;
                void type;
                void event.clientX;
              }}
            >
              <Tooltip />
            </SankeyChart>
          </ResponsiveContainer>
        )}
      </div>
      <SankeyTable
        data={flow}
        caption="Packed flows"
        activeLinkId={active}
        onInspect={(link) => setActive(link.id)}
      />
    </>
  );
}
const missing: SankeyFlowData = {
  nodes: data.nodes,
  // @ts-expect-error Missing is not measured zero.
  links: [{ id: "missing", source: 0, target: 1 }],
};
void missing;
// @ts-expect-error Unsupported finish, width-changing textures are not promised.
const unsupported: SankeyMaterial = "clay";
void unsupported;
