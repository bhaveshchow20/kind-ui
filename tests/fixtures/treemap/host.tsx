import {
  type TreemapAccessors,
  TreemapChart,
  type TreemapColorEncoding,
  useTreemap,
} from "@kind-ui/charts";
import { Component, type ReactNode, Suspense, startTransition, useState } from "react";

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
const encoding = {
  type: "diverging",
  label: "Change (%)",
  value: (d) => d.change,
  domain: [-5, 5],
  unknownColor: "#64748b",
  formatValue: (value) => `${value > 0 ? "+" : ""}${value}%`,
} satisfies TreemapColorEncoding<Record>;
function mapRecords(data: readonly Record[], f: (d: Record) => Record): readonly Record[] {
  return data.map((d) => f(d.nodes ? { ...d, nodes: mapRecords(d.nodes, f) } : d));
}
function Inspector() {
  const chart = useTreemap<Record>();
  return (
    <TreemapChart.Content>
      <output aria-label="Resolved view">{chart.viewId ?? "root"}</output>
      <output aria-label="Resolved active">{chart.activeId ?? "none"}</output>
    </TreemapChart.Content>
  );
}
const never = new Promise<void>(() => {});
function SuspendRender({ pending }: { pending: boolean }) {
  if (pending) {
    // Test instrumentation proves React attempted the update before suspension.
    document.body.dataset.suspendedRender = "true";
    throw never;
  }
  return null;
}
class ConsumerBoundary extends Component<{ children: ReactNode }, { error: string }> {
  override state = { error: "" };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  override render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}
export function TreemapHost() {
  const params = new URLSearchParams(window.location.search);
  const count = Number(params.get("count") ?? 0);
  const duplicateLegend = params.has("duplicate-legend");
  const initial = params.has("empty-group")
    ? [{ key: "empty-group", title: "Empty group", nodes: [] }]
    : duplicateLegend
      ? Array.from({ length: 6 }, (_entry, index) => ({
          key: `duplicate-group-${index}`,
          title: "Same label",
          nodes: [{ key: `duplicate-leaf-${index}`, title: `Leaf ${index}`, area: 1 }],
        }))
      : count
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
  const [activeRequests, setActiveRequests] = useState<
    readonly { id: string | null; metric: number | null }[]
  >([]);
  const [preventedEscapes, setPreventedEscapes] = useState(0);
  const held = params.has("held");
  const parts = params.get("parts");
  const ownership = params.get("ownership");
  const [owned, setOwned] = useState(params.get("direction") !== "to-controlled");
  const [blocked, setBlocked] = useState(true);
  const [escapeEvents, setEscapeEvents] = useState<readonly boolean[]>([]);
  const nativeUnavailable = (target: string, id: string) =>
    blocked && params.get("target") === target && id === (target === "tile" ? "d" : "energy")
      ? { hidden: params.get("native") === "hidden", inert: params.get("native") === "inert" }
      : {};
  const [view, setView] = useState<string | null>(held ? "platforms" : null);
  const [requests, setRequests] = useState(0);
  const [dark, setDark] = useState(false);
  const [changedOpacity, setChangedOpacity] = useState(false);
  const [inlineOpacity, setInlineOpacity] = useState<number | undefined>(undefined);
  const [disabled, setDisabled] = useState(false);
  const [groups, setGroups] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deep, setDeep] = useState(true);
  const [pending, setPending] = useState(false);
  const [activatedArea, setActivatedArea] = useState<number | null>(null);
  const selectedEncoding: TreemapColorEncoding<Record> =
    params.get("domain") === "positive"
      ? { ...encoding, domain: [0, 5] }
      : params.get("domain") === "constant"
        ? { ...encoding, type: "sequential", domain: [2, 2] }
        : encoding;
  return (
    <section aria-label="Treemap public consumer">
      <style>{`.treemap-consumer-opacity-initial { opacity: 0.45; } .treemap-consumer-opacity-changed { opacity: 0.8; }`}</style>
      <button type="button" onClick={() => setChangedOpacity((value) => !value)}>
        Class opacity
      </button>
      <button type="button" onClick={() => setInlineOpacity(0.7)}>
        Inline opacity
      </button>
      <input
        aria-label="Outside focus"
        onKeyDown={(event) => {
          if (event.key === "Escape" && params.has("prevent-escape")) {
            event.preventDefault();
            setPreventedEscapes((value) => value + 1);
          }
        }}
      />
      <output aria-label="Prevented escapes">{preventedEscapes}</output>
      <output aria-label="Active requests">{activeRequests.length}</output>
      <output
        aria-label="Active request log"
        style={{
          display: "block",
          height: 20,
          lineHeight: "20px",
          overflow: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {JSON.stringify(activeRequests)}
      </output>
      {ownership !== null && (
        <>
          <button type="button" onClick={() => setOwned((value) => !value)}>
            Switch ownership
          </button>
          <output aria-label="Ownership mode">{owned ? "controlled" : "uncontrolled"}</output>
        </>
      )}
      {params.has("native") && (
        <button type="button" onClick={() => setBlocked((value) => !value)}>
          Native availability
        </button>
      )}
      <output
        aria-label="Escape propagation"
        style={{
          display: "block",
          height: 20,
          lineHeight: "20px",
          overflow: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {JSON.stringify(escapeEvents)}
      </output>
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
            mapRecords(d, (n) => (n.change == null ? n : { ...n, change: n.change + 1 })),
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
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            setData((d) =>
              mapRecords(d, (n) => (n.key === "a" ? { ...n, area: (n.area ?? 0) * 2 } : n)),
            );
            setPending(true);
          })
        }
      >
        Suspended weights
      </button>
      <button
        type="button"
        onClick={() => {
          setData(original);
          setPending(false);
        }}
      >
        Rollback transition
      </button>
      <output aria-label="Activated area">{activatedArea ?? "none"}</output>
      <output aria-label="View requests">{requests}</output>
      <output aria-label="Selected ID">{selected ?? "none"}</output>
      <output aria-label="Active ID">{active ?? "none"}</output>
      <output aria-label="View ID">{view ?? "root"}</output>
      <button type="button" style={{ display: "block" }}>
        Before chart entry
      </button>
      <ConsumerBoundary>
        <Suspense fallback={<p>Pending treemap</p>}>
          <TreemapChart<Record>
            data={data}
            accessors={accessors}
            {...(duplicateLegend ? {} : { encoding: selectedEncoding })}
            groupHeaderHeight={params.has("header") ? Number(params.get("header")) : 20}
            config={{}}
            frameProps={{
              onKeyDown: (event) => {
                if (event.key === "Escape")
                  setEscapeEvents((events) => [...events, event.defaultPrevented]);
              },
            }}
            {...(params.has("fixed-width")
              ? { width: Number(params.get("fixed-width")) }
              : params.has("responsive")
                ? {}
                : { width })}
            height={400}
            padding={params.has("padding") ? Number(params.get("padding")) : 2}
            {...(deep ? {} : { depth: 1 })}
            {...(ownership === "selected"
              ? !owned
                ? {}
                : { selectedId: selected }
              : { selectedId: selected })}
            onSelectionChange={setSelected}
            onActivate={(item) => setActivatedArea(item.value)}
            {...(ownership === "active"
              ? !owned
                ? {}
                : { activeId: active }
              : params.has("uncontrolled-active")
                ? {}
                : { activeId: active })}
            onActiveChange={(id, item) => {
              setActive(id);
              setActiveRequests((requests) => [
                ...requests,
                { id, metric: item?.datum.change ?? null },
              ]);
            }}
            onPointerMoveCapture={(event) => {
              event.currentTarget.dataset.pointerX = String(event.clientX);
              event.currentTarget.dataset.pointerY = String(event.clientY);
            }}
            {...(ownership === "view" ? (!owned ? {} : { viewId: view }) : { viewId: view })}
            onViewChange={(id) => {
              setRequests((v) => v + 1);
              if (!held) setView(id);
            }}
            loading={loading}
            animate={params.has("animate")}
            className={
              params.has("opacity")
                ? changedOpacity
                  ? "treemap-consumer-opacity-changed"
                  : "treemap-consumer-opacity-initial"
                : undefined
            }
            aria-label="Allocation and signed change"
            style={
              dark || inlineOpacity !== undefined
                ? ({
                    ...(inlineOpacity === undefined ? {} : { opacity: inlineOpacity }),
                    ...(dark
                      ? {
                          "--foreground": "#f8fafc",
                          "--background": "#0f172a",
                          "--popover": "#1e293b",
                          "--popover-foreground": "#f8fafc",
                        }
                      : {}),
                  } as import("react").CSSProperties)
                : undefined
            }
          >
            <SuspendRender pending={pending} />
            <TreemapChart.Breadcrumbs />
            {parts !== "tiles" && groups && (
              <TreemapChart.Groups
                groupProps={(node) => nativeUnavailable("ancestor", node.id)}
                headerProps={(node) => ({
                  ...nativeUnavailable("header", node.id),
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
                  ...nativeUnavailable("tile", node.id),
                  disabled: disabled && node.id === "d",
                  ref: (element) => {
                    if (element) element.dataset.hostRef = "tile";
                  },
                })}
              />
            )}
            <TreemapChart.Labels />
            {!params.has("omit-tooltip") && <TreemapChart.Tooltip />}
            <TreemapChart.ColorLegend />
            <TreemapChart.DataTable
              rowProps={(node) =>
                node.id === "platforms"
                  ? {
                      hidden: params.get("table-native") === "hidden",
                      inert: params.get("table-native") === "inert",
                    }
                  : {}
              }
              caption="Allocation values and signed change"
              scope={params.has("table-root") ? "root" : "view"}
            />
            {params.has("content-control") && (
              <TreemapChart.Content>
                <button type="button">Portal action</button>
              </TreemapChart.Content>
            )}
            <Inspector />
          </TreemapChart>
        </Suspense>
      </ConsumerBoundary>
    </section>
  );
}
