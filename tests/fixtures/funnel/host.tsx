import { type FunnelAccessors, FunnelChart } from "@kind-ui/charts";
import {
  Component,
  type ReactNode,
  type RefCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Row {
  key: string;
  name: string;
  amount: number | null;
  days: number;
}
const rows: readonly Row[] = [
  { key: "entry", name: "Entry", amount: 100, days: 1 },
  { key: "review", name: "Review", amount: 50, days: 3 },
  { key: "growth", name: "Growth", amount: 75, days: 5 },
  { key: "zero", name: "Zero", amount: 0, days: 0 },
  { key: "unknown", name: "Unknown", amount: null, days: 0 },
];
const accessors: FunnelAccessors<Row> = {
  id: (row) => row.key,
  label: (row) => row.name,
  value: (row) => row.amount,
};
const config = Object.fromEntries(
  rows.map((row, index) => [
    row.key,
    {
      label: row.name,
      color: ["#2563eb", "#059669", "#9333ea", "#ea580c", "#64748b"][index] ?? "#2563eb",
    },
  ]),
);
class GeometryBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  override state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  override render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}
export function Host() {
  const params = new URLSearchParams(location.search);
  const [horizontal, setHorizontal] = useState(params.has("horizontal"));
  const [taper, setTaper] = useState(params.has("taper"));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const refresh = (event: Event) => {
      const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
      if (typeof detail === "boolean") setLoading(detail);
    };
    window.addEventListener("funnel-background-loading", refresh);
    return () => window.removeEventListener("funnel-background-loading", refresh);
  }, []);
  const [narrow, setNarrow] = useState(false);
  const [dark, setDark] = useState(false);
  const [replace, setReplace] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [activeWrites, setActiveWrites] = useState(0);
  const [veto, setVeto] = useState(params.has("activation-veto"));
  const [clicks, setClicks] = useState(0);
  const [clickedDays, setClickedDays] = useState<number | null>(null);
  const [clickDetail, setClickDetail] = useState<number | null>(null);
  const [clickModifiers, setClickModifiers] = useState("none");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionWrites, setSelectionWrites] = useState(0);
  const [ticks, setTicks] = useState(0);
  const tickAnimation = params.has("animation-ticks");
  useEffect(() => {
    if (!tickAnimation) return;
    const timer = setInterval(() => setTicks((count) => count + 1), 80);
    return () => clearInterval(timer);
  }, [tickAnimation]);
  const stableLifecycle = useRef({ mounts: 0, cleanups: 0 });
  const stableRefs = useMemo(
    () =>
      new Map<string, RefCallback<SVGGElement>>(
        rows.map((row) => [
          row.key,
          (node: SVGGElement | null) => {
            if (!node) return;
            stableLifecycle.current.mounts += 1;
            node.dataset.consumerRef = "attached";
            return () => {
              stableLifecycle.current.cleanups += 1;
            };
          },
        ]),
      ),
    [],
  );
  const [stableRead, setStableRead] = useState({ mounts: 0, cleanups: 0 });
  const [reverseLegendConfig, setReverseLegendConfig] = useState(false);
  const cleanupCount = useRef(0);
  const [cleanupRead, setCleanupRead] = useState(0);
  const [metadata, setMetadata] = useState(false);
  const baseData = replace ? rows.slice(1) : rows;
  const data = metadata
    ? baseData.map((row) => ({ ...row, name: `${row.name} updated`, days: row.days + 10 }))
    : baseData;
  if (params.has("extreme"))
    return (
      <main>
        <h1>Geometry boundary</h1>
        <GeometryBoundary>
          <FunnelChart
            data={[
              { id: "normal", label: "Normal", value: 1 },
              { id: "tiny", label: "Tiny", value: 1e-20 },
            ]}
            config={{ normal: { color: "blue" }, tiny: { color: "green" } }}
            aria-label="Extreme stages"
            width={320}
            height={200}
          >
            <FunnelChart.Stages />
          </FunnelChart>
        </GeometryBoundary>
      </main>
    );
  return (
    <main>
      <h1>Packed funnel contracts</h1>
      <p id="p-2" className="sr-only">
        Inventory measured at the end of the selected period.
      </p>
      <p id="p-4" className="sr-only">
        Counts represent independent workflow stage snapshots.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => setHorizontal(!horizontal)}>
          Orientation
        </button>
        <button type="button" onClick={() => setTaper(!taper)}>
          Geometry
        </button>
        <button type="button" onClick={() => setLoading(!loading)}>
          Loading
        </button>
        <button type="button" onClick={() => setNarrow(!narrow)}>
          Resize
        </button>
        <button type="button" onClick={() => setDark(!dark)}>
          Theme
        </button>
        <button type="button" onClick={() => setReplace(!replace)}>
          Replace data
        </button>
        <button type="button" onClick={() => setActive("absent")}>
          Stale inspection
        </button>
        <button type="button" onClick={() => setVeto(!veto)}>
          Veto clicks
        </button>
      </div>
      <button type="button" onClick={() => setStableRead({ ...stableLifecycle.current })}>
        Read stable ref counts
      </button>
      <button type="button" onClick={() => setReverseLegendConfig(!reverseLegendConfig)}>
        Reorder legend config
      </button>
      <output aria-label="Stable ref mounts">{stableRead.mounts}</output>
      <output aria-label="Stable ref cleanups">{stableRead.cleanups}</output>
      <button type="button" onClick={() => setActive("growth")}>
        External inspection
      </button>
      <button type="button" onClick={() => setMetadata(!metadata)}>
        Refresh metadata
      </button>
      <button type="button" onClick={() => setCleanupRead(cleanupCount.current)}>
        Read ref cleanup
      </button>
      <output aria-label="Ref cleanup count">{cleanupRead}</output>
      <output aria-label="Inspection writes">{activeWrites}</output>
      <output aria-label="Consumer clicks">{clicks}</output>
      <output aria-label="Clicked stage days">{clickedDays ?? "none"}</output>
      <output aria-label="Consumer click detail">{clickDetail ?? "none"}</output>
      <output aria-label="Consumer click modifiers">{clickModifiers}</output>
      <output aria-label="Stage selection">{selected ?? "none"}</output>
      <output aria-label="Selection writes">{selectionWrites}</output>
      <output aria-label="Parent ticks">{ticks}</output>
      <section
        aria-label="Stage snapshot"
        style={{
          width: narrow ? 320 : 640,
          maxWidth: "100%",
          colorScheme: dark ? "dark" : "light",
        }}
      >
        <FunnelChart
          data={data}
          accessors={
            params.has("inline")
              ? {
                  id: (row: Row) => row.key,
                  label: (row: Row) => row.name,
                  value: (row: Row) => row.amount,
                }
              : accessors
          }
          config={config}
          aria-label="Inventory by stage"
          aria-describedby="p-2 p-4"
          height={360}
          {...(tickAnimation ? { width: 640 } : {})}
          orientation={horizontal ? "horizontal" : "vertical"}
          scaleMax={100}
          denominator={
            params.has("inline") ? (_stage, _index, stages) => stages[0]?.value : "first"
          }
          ratioLabel="Share of first stage"
          loading={loading}
          animate={params.has("static") ? false : { revealDurationMs: tickAnimation ? 700 : 2500 }}
          interaction={{
            selected,
            onSelectionChange: (id) => {
              setSelected(id);
              setSelectionWrites((count) => count + 1);
            },
            markActivation: params.has("none") ? "none" : "matching-legend",
            ...(params.has("reset-veto")
              ? { onBeforeInteraction: (request: { source: string }) => request.source !== "reset" }
              : {}),
          }}
          activeId={active}
          onActiveIdChange={(id) => {
            if (id !== null || !params.has("ignore-null")) setActive(id);
            setActiveWrites((count) => count + 1);
          }}
          frameProps={{
            id: "funnel-frame",
            onKeyDown: (event) => {
              if (params.has("frame-prevent-escape") && event.key === "Escape")
                event.preventDefault();
            },
          }}
        >
          <FunnelChart.Stages<Row>
            geometry={taper ? "trapezoid" : "rectangle"}
            stageProps={(stage) => ({
              "data-owned-stage": stage.id,
              "aria-describedby": "p-2 p-4",
              ref: params.has("stable-ref")
                ? stableRefs.get(stage.id)
                : (node) => {
                    if (node) node.dataset.consumerRef = "attached";
                    return () => {
                      cleanupCount.current += 1;
                    };
                  },
              onKeyDown: (event) => {
                if (
                  params.has("prevent-activation") &&
                  (event.key === "Enter" || event.key === " ")
                )
                  event.preventDefault();
              },
              onClick: (event) => {
                setClickDetail(event.detail);
                setClickModifiers(
                  [
                    event.altKey ? "alt" : "",
                    event.ctrlKey ? "ctrl" : "",
                    event.metaKey ? "meta" : "",
                    event.shiftKey ? "shift" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || "none",
                );
                setClicks((count) => count + 1);
                setClickedDays(stage.datum.days);
                if (veto) event.preventDefault();
              },
            })}
          />
          <FunnelChart.Labels<Row>
            render={(stage) => (
              <span>
                {stage.label}: {stage.value ?? "Unknown"}; {stage.datum.days} days
              </span>
            )}
          />
          <FunnelChart.Tooltip<Row> />
          {params.has("stable-ref") && <FunnelChart.Legend />}
          <FunnelChart.Content>
            <button
              type="button"
              onKeyDown={(event) => {
                if (params.has("prevent-escape") && event.key === "Escape") event.preventDefault();
              }}
            >
              In-chart control
            </button>
          </FunnelChart.Content>
          <FunnelChart.DataTable<Row> caption="Snapshot inventory, first stage denominator" />
        </FunnelChart>
      </section>
      <section aria-label="Comparison" style={{ width: 640, maxWidth: "100%" }}>
        <FunnelChart
          data={[
            { id: "small", label: "Small", value: 25 },
            { id: "smaller", label: "Smaller", value: 12.5 },
          ]}
          config={{ small: { color: "blue" }, smaller: { color: "green" } }}
          scaleMax={100}
          denominator={100}
          ratioLabel="Share of capacity"
          height={360}
          aria-label="Shared scale comparison"
        >
          <FunnelChart.Stages />
          <FunnelChart.DataTable caption="Comparison with shared capacity" />
        </FunnelChart>
      </section>
      <section aria-label="Single stage">
        <FunnelChart
          data={[{ id: "only", label: "Only", value: 7.5 }]}
          config={{ only: { color: "blue" } }}
          aria-label="Single measured stage"
          height={140}
          denominator="first"
        >
          <FunnelChart.Stages geometry="trapezoid" />
          <FunnelChart.DataTable caption="Single stage values" />
        </FunnelChart>
      </section>
      <section aria-label="All zero">
        <FunnelChart
          data={[
            { id: "first", label: "First zero", value: 0 },
            { id: "second", label: "Second zero", value: 0 },
          ]}
          config={{ first: { color: "blue" }, second: { color: "green" } }}
          aria-label="All zero stages"
          height={140}
          denominator="first"
        >
          <FunnelChart.Stages />
          <FunnelChart.DataTable caption="Measured zeros" />
        </FunnelChart>
      </section>
      <section aria-label="Empty stages">
        <FunnelChart data={[]} config={{}} aria-label="Empty stages" height={140}>
          <FunnelChart.Stages />
          <FunnelChart.DataTable caption="Empty supplied stages" />
        </FunnelChart>
      </section>
      <section aria-label="Legend labels">
        <FunnelChart
          data={[
            { id: "payment", label: "Reached payment", value: 10 },
            { id: "address", label: "Reached address", value: 5 },
          ]}
          config={{
            payment: { color: "blue" },
            address: { color: "green", label: "Display address" },
          }}
          aria-label="Stage labels"
          emphasis={params.has("emphasis-none") ? "none" : "auto"}
          height={140}
        >
          <FunnelChart.Stages />
          <FunnelChart.Legend />
        </FunnelChart>
      </section>
      <section aria-label="Previous unavailable">
        <FunnelChart
          data={[{ id: "only", label: "First supplied", value: 10 }]}
          config={{ only: { color: "blue" } }}
          aria-label="Previous denominator unavailable"
          height={140}
          denominator="previous"
          ratioLabel="Share of previous"
        >
          <FunnelChart.Stages />
          <FunnelChart.DataTable caption="Previous stage unknown" />
        </FunnelChart>
      </section>
      <section aria-label="Callback unavailable">
        <FunnelChart
          data={[{ id: "only", label: "Known count", value: 10 }]}
          config={{ only: { color: "blue" } }}
          aria-label="Callback denominator unavailable"
          height={140}
          denominator={() => null}
          ratioLabel="Share of baseline"
        >
          <FunnelChart.Stages />
          <FunnelChart.DataTable caption="Baseline unknown" />
        </FunnelChart>
      </section>
      <section aria-label="Ordered legend">
        <FunnelChart
          data={[
            { id: "10", label: "First stage", value: 100 },
            { id: "2", label: "Second stage", value: 60 },
            { id: "1", label: "Final stage", value: 40 },
          ]}
          config={
            reverseLegendConfig
              ? {
                  "10": { color: "red" },
                  stale: { color: "black", label: "Stale entry" },
                  "2": { color: "green" },
                  "1": { color: "blue" },
                }
              : {
                  "1": { color: "blue" },
                  "2": { color: "green" },
                  "10": { color: "red" },
                  stale: { color: "black", label: "Stale entry" },
                }
          }
          aria-label="Integer ID stages"
          height={180}
        >
          <FunnelChart.Stages />
          <FunnelChart.Legend />
        </FunnelChart>
      </section>
      <section aria-label="Explicit parts">
        <FunnelChart
          data={rows}
          accessors={accessors}
          config={config}
          aria-label="No implicit marks"
          width={320}
          height={100}
        >
          {null}
        </FunnelChart>
      </section>
    </main>
  );
}
