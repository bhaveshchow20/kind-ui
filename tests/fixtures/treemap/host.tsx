import {
  type TreemapAccessors,
  TreemapChart,
  type TreemapColorEncoding,
  useTreemap,
} from "@kind-ui/charts";
import { useState } from "react";

type Record = {
  key: string;
  title: string;
  area?: number;
  change?: number | null;
  signed?: number;
  nodes?: readonly Record[];
};
const original: readonly Record[] = [
  {
    key: "technology",
    title: "Technology",
    nodes: [
      {
        key: "platforms",
        title: "Platforms",
        nodes: [
          { key: "a", title: "Alpha", area: 60, change: -2, signed: 60 },
          { key: "b", title: "Beta", area: 30, change: 0, signed: -30 },
          { key: "zero", title: "Zero allocation", area: 0, change: null },
        ],
      },
      { key: "c", title: "Cloud", area: 10, change: 4 },
    ],
  },
  {
    key: "energy",
    title: "Energy",
    nodes: [
      { key: "d", title: "Delta", area: 40, change: null },
      { key: "e", title: "Echo", area: 20, change: -20 },
    ],
  },
];
const accessors: TreemapAccessors<Record> = {
  id: (d) => d.key,
  label: (d) => d.title,
  children: (d) => d.nodes,
  value: (d) => d.area as number,
};
const encoding: TreemapColorEncoding<Record> = {
  type: "diverging",
  label: "Change (%)",
  value: (d) => d.change,
  domain: [-5, 5],
  unknownColor: "#64748b",
  formatValue: (value) => `${value > 0 ? "+" : ""}${value}%`,
};
function mapRecords(data: readonly Record[], f: (d: Record) => Record): readonly Record[] {
  return data.map((d) => f(d.nodes ? { ...d, nodes: mapRecords(d.nodes, f) } : d));
}
function Inspector() {
  const chart = useTreemap<Record>();
  return (
    <TreemapChart.Content>
      <output aria-label="Resolved view">{chart.viewId ?? "root"}</output>
    </TreemapChart.Content>
  );
}
export function TreemapHost() {
  const count = Number(new URLSearchParams(window.location.search).get("count") ?? 0);
  const initial = count
    ? [
        {
          key: "dense",
          title: "Resources",
          nodes: Array.from({ length: count }, (_, i) => ({
            key: `resource-${i}`,
            title: `Resource ${i}`,
            area: (i % 11) + 1,
            change: (i % 10) - 5,
          })),
        },
      ]
    : original;
  const [data, setData] = useState<readonly Record[]>(initial);
  const [width, setWidth] = useState(720);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const held = params.has("held");
  const parts = params.get("parts");
  const [view, setView] = useState<string | null>(held ? "platforms" : null);
  const [requests, setRequests] = useState(0);
  const [dark, setDark] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [groups, setGroups] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deep, setDeep] = useState(true);
  return (
    <section aria-label="Treemap public consumer">
      <button type="button" onClick={() => setWidth((v) => (v === 720 ? 540 : 720))}>
        Resize
      </button>
      <button
        type="button"
        onClick={() =>
          setData((d) =>
            mapRecords(d, (n) =>
              n.area === undefined ? n : { ...n, area: n.area * (n.key === "a" ? 2 : 1) },
            ),
          )
        }
      >
        Weights
      </button>
      <button
        type="button"
        onClick={() =>
          setData((d) =>
            mapRecords([...d].reverse(), (n) =>
              n.nodes ? { ...n, nodes: [...n.nodes].reverse() } : n,
            ),
          )
        }
      >
        Reorder
      </button>
      <button
        type="button"
        onClick={() =>
          setData((d) =>
            mapRecords(d, (n) => ({ ...n, change: n.change == null ? n.change : n.change + 1 })),
          )
        }
      >
        Colors
      </button>
      <button type="button" onClick={() => setData((d) => d.filter((n) => n.key !== "technology"))}>
        Remove subtree
      </button>
      <button type="button" onClick={() => setView("technology")}>
        View technology
      </button>
      <button type="button" onClick={() => setView("platforms")}>
        View platforms
      </button>
      <button type="button" onClick={() => setLoading((v) => !v)}>
        Loading
      </button>
      <button type="button" onClick={() => setDeep((v) => !v)}>
        Depth
      </button>
      <button type="button" onClick={() => setData([])}>
        Empty
      </button>
      <button
        type="button"
        onClick={() =>
          setData((d) =>
            mapRecords(d, (n) =>
              n.key === "technology"
                ? { ...n, nodes: n.nodes?.filter((child) => child.key !== "platforms") ?? [] }
                : n,
            ),
          )
        }
      >
        Remove platforms
      </button>
      <button type="button" onClick={() => setDark((v) => !v)}>
        Theme
      </button>
      <button type="button" onClick={() => setDisabled((v) => !v)}>
        Disabled
      </button>
      <button type="button" onClick={() => setGroups((v) => !v)}>
        Toggle groups
      </button>
      <output aria-label="View requests">{requests}</output>
      <output aria-label="Selected ID">{selected ?? "none"}</output>
      <output aria-label="Active ID">{active ?? "none"}</output>
      <output aria-label="View ID">{view ?? "root"}</output>
      <TreemapChart<Record>
        data={data}
        accessors={accessors}
        encoding={
          params.get("domain") === "positive"
            ? { ...encoding, domain: [0, 5] }
            : params.get("domain") === "constant"
              ? { ...encoding, type: "sequential", domain: [2, 2] }
              : encoding
        }
        groupHeaderHeight={params.has("header") ? Number(params.get("header")) : 20}
        config={{}}
        width={width}
        height={400}
        padding={params.has("padding") ? Number(params.get("padding")) : 2}
        {...(deep ? {} : { depth: 1 })}
        selectedId={selected}
        onSelectionChange={setSelected}
        activeId={active}
        onActiveChange={setActive}
        viewId={view}
        onViewChange={(id) => {
          setRequests((v) => v + 1);
          if (!held) setView(id);
        }}
        loading={loading}
        aria-label="Allocation and signed change"
        style={
          dark
            ? ({
                "--foreground": "#f8fafc",
                "--background": "#0f172a",
                "--popover": "#1e293b",
                "--popover-foreground": "#f8fafc",
              } as import("react").CSSProperties)
            : undefined
        }
      >
        <TreemapChart.Breadcrumbs />
        {parts !== "tiles" && groups && (
          <TreemapChart.Groups
            headerProps={() => ({
              ref: (element) => {
                if (element) {
                  element.dataset.hostRef = "group";
                  return () => {
                    element.dataset.hostCleaned = "true";
                  };
                }
              },
            })}
          />
        )}
        {parts !== "groups" && (
          <TreemapChart.Tiles<Record>
            tileProps={(node) => ({
              disabled: disabled && node.id === "d",
              ref: (element) => {
                if (element) element.dataset.hostRef = "tile";
              },
            })}
          />
        )}
        <TreemapChart.Labels />
        <TreemapChart.Tooltip />
        <TreemapChart.ColorLegend />
        <TreemapChart.DataTable
          caption="Allocation values and signed change"
          scope={params.has("table-root") ? "root" : "view"}
        />
        <Inspector />
      </TreemapChart>
    </section>
  );
}
