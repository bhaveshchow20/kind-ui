import {
  prepareSankeyData,
  SankeyChart,
  type SankeyFinish,
  type SankeyFlowData,
  SankeyLink,
  type SankeyLinkProps,
  type SankeyMaterial,
  SankeyNode,
  SankeyTable,
} from "@kind-ui/charts";
import { useRef, useState } from "react";
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
const paint: SankeyMaterial = "gradient";
export function Host() {
  const [finish, setFinish] = useState<SankeyFinish>(
    (new URLSearchParams(window.location.search).get("finish") ?? "plain") as SankeyFinish,
  );
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
  const ref = useRef<SVGPathElement>(null);
  const [clicks, setClicks] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  return (
    <>
      {(["plain", "paper", "clay", "glow"] as const).map((item) => (
        <button key={item} type="button" onClick={() => setFinish(item)}>
          {item}
        </button>
      ))}
      <section aria-label="Mark ownership">
        {clicks} / {ref.current?.tagName ?? "pending"}
      </section>
      <svg aria-label="Surface probe" width={300} height={160} style={{ display: "block" }}>
        {([1, 3, 12, 32] as const).map((width, index) => (
          <SankeyLink
            key={width}
            sourceX={20}
            targetX={280}
            sourceY={20 + index * 35}
            targetY={20 + index * 35}
            sourceControlX={100}
            targetControlX={200}
            sourceRelativeY={0}
            targetRelativeY={0}
            linkWidth={width}
            index={index}
            payload={{} as SankeyLinkProps["payload"]}
            finish={finish}
            material="gradient"
            pathProps={{ strokeOpacity: 0.4, "aria-label": `probe-${width}` }}
          />
        ))}
      </svg>
      <svg aria-label="Adjacent probe" width={300} height={60}>
        {[24.5, 28.5].map((y) => (
          <SankeyLink
            key={y}
            sourceX={20}
            targetX={280}
            sourceY={y}
            targetY={y}
            sourceControlX={100}
            targetControlX={200}
            sourceRelativeY={0}
            targetRelativeY={0}
            linkWidth={3}
            index={0}
            payload={{} as SankeyLinkProps["payload"]}
            finish={finish}
            color="#cf5782"
          />
        ))}
      </svg>
      <svg aria-label="Ownership probe" width={300} height={80}>
        <defs>
          <filter id="owned">
            <feOffset dx={0} dy={0} />
          </filter>
        </defs>
        <SankeyNode
          x={20}
          y={20}
          width={14}
          height={40}
          index={0}
          payload={{} as Parameters<typeof SankeyNode>[0]["payload"]}
          finish={finish}
          rectProps={{ stroke: "#cf5782", strokeWidth: "2em", "aria-label": "wide-stroke" }}
        />
        <SankeyNode
          x={70}
          y={20}
          width={14}
          height={40}
          index={0}
          payload={{} as Parameters<typeof SankeyNode>[0]["payload"]}
          finish={finish}
          rectProps={{ filter: "url(#owned)", "aria-label": "owned-filter" }}
        />
        <SankeyLink
          sourceX={100}
          targetX={280}
          sourceY={40}
          targetY={40}
          sourceControlX={150}
          targetControlX={220}
          sourceRelativeY={0}
          targetRelativeY={0}
          linkWidth={12}
          index={0}
          payload={{} as SankeyLinkProps["payload"]}
          finish={finish}
          pathProps={{
            ref,
            onClick: () => setClicks((count) => count + 1),
            className: "owned-css",
            "aria-label": "owned-path",
          }}
        />
      </svg>
      {new URLSearchParams(window.location.search).has("ownership") && (
        <SankeyChart
          className="custom-native"
          width={300}
          height={80}
          data={data}
          node={(props) => (
            <rect
              {...{ x: props.x, y: props.y, width: props.width, height: props.height }}
              aria-label="custom-node"
            />
          )}
          link={(props) => (
            <path
              d={`M${props.sourceX},${props.sourceY}L${props.targetX},${props.targetY}`}
              stroke="pink"
              strokeWidth={props.linkWidth}
              aria-label="custom-link"
            />
          )}
        />
      )}
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
                <SankeyNode finish="clay" {...props} rectProps={{ "aria-label": "Native node" }} />
              )}
              link={(props: SankeyLinkProps) => (
                <SankeyLink
                  {...props}
                  material={paint}
                  finish={finish}
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

const supported: SankeyFinish = "glow";
void supported;
