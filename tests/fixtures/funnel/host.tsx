import { type FunnelAccessors, FunnelChart } from "@kind-ui/charts";
import { Component, type ReactNode, useRef, useState } from "react";

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
  const [narrow, setNarrow] = useState(false);
  const [dark, setDark] = useState(false);
  const [replace, setReplace] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [activeWrites, setActiveWrites] = useState(0);
  const [veto, setVeto] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [clickedDays, setClickedDays] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
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
      <output aria-label="Stage selection">{selected ?? "none"}</output>
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
          height={360}
          orientation={horizontal ? "horizontal" : "vertical"}
          scaleMax={100}
          denominator={
            params.has("inline") ? (_stage, _index, stages) => stages[0]?.value : "first"
          }
          ratioLabel="Share of first stage"
          loading={loading}
          animate={params.has("static") ? false : { revealDurationMs: 2500 }}
          interaction={{ selected, onSelectionChange: setSelected }}
          activeId={active}
          onActiveIdChange={(id) => {
            setActive(id);
            setActiveWrites((count) => count + 1);
          }}
          frameProps={{ id: "funnel-frame" }}
        >
          <FunnelChart.Stages<Row>
            geometry={taper ? "trapezoid" : "rectangle"}
            stageProps={(stage) => ({
              "data-owned-stage": stage.id,
              ref: (node) => {
                if (node) node.dataset.consumerRef = "attached";
                return () => {
                  cleanupCount.current += 1;
                };
              },
              onClick: (event) => {
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
