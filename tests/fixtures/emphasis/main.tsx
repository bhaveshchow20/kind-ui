import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import {
  type BarShapeProps,
  CartesianGrid,
  Cell,
  LabelList,
  ScatterSeries as NamedScatterSeries,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { type ComponentProps, useCallback, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

const config = {
  first: { label: "First", color: "#635bff" },
  second: { label: "Second", color: "#00a6a0" },
  alpha: { label: "Alpha", color: "#635bff" },
  beta: { label: "Beta", color: "#00a6a0" },
};
const rows = [
  { category: "A", first: 20, second: 10 },
  { category: "B", first: 12, second: 16 },
  { category: "C", first: 18, second: 8 },
];
function PortalShape(props: BarShapeProps) {
  const [node, setNode] = useState<SVGGElement | null>(null);
  return (
    <>
      <g ref={setNode} />
      {node &&
        createPortal(
          <Chart.EmphasisMark
            target={{
              kind: "category",
              key: String(props.payload.category),
              scope: "custom",
              seriesKey: "first",
            }}
          >
            <Rectangle {...props} data-custom="portal" opacity={0.5} />
          </Chart.EmphasisMark>,
          node,
        )}
    </>
  );
}
const categoryIdentity = (row: unknown) =>
  typeof row === "object" && row !== null && "category" in row ? String(row.category) : undefined;
const portalShape = (props: BarShapeProps) => <PortalShape {...props} />;
const nativeShape = (props: BarShapeProps) => <Rectangle {...props} />;
const customSector = (props: ComponentProps<typeof Chart.Sector>) => (
  <Chart.Sector {...props} data-custom-sector="consumer" />
);

let lifetimeIdentity = 0;
function LifetimeDot(props: Chart.DotProps) {
  const [identity] = useState(() => ++lifetimeIdentity);
  return (
    <g data-lifetime-dot={identity}>
      <Chart.Dot {...props} />
    </g>
  );
}
const lifetimeDot = ({ cx, cy, r, fill, stroke }: Chart.DotItemDotProps) => (
  <LifetimeDot cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} />
);
const lifetimeDotElement = <LifetimeDot />;
const scatterRows = [
  { x: 10, y: 20 },
  { x: 20, y: 10 },
];
function NativeLifetimeCase({ family, active = false }: { family: string; active?: boolean }) {
  const [clicks, setClicks] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [veto, setVeto] = useState(false);
  const [changes, setChanges] = useState(0);
  const [synchronous, setSynchronous] = useState(false);
  const recordNative = useCallback(
    (event: { preventDefault: () => void }) => {
      setClicks((count) => count + 1);
      if (veto) event.preventDefault();
      if (synchronous) flushSync(() => setSelected("first"));
    },
    [veto, synchronous],
  );
  const scatterClick = useCallback<NonNullable<Chart.ScatterSeriesProps["onClick"]>>(
    (_data, _index, event) => recordNative(event),
    [recordNative],
  );
  const radarClick = useCallback<NonNullable<Chart.RadarSeriesProps["onClick"]>>(
    (event) => recordNative(event),
    [recordNative],
  );
  const scatter = family.startsWith("scatter");
  const Series = family === "scatter-named" ? NamedScatterSeries : Chart.ScatterSeries;
  return (
    <section aria-label={`Native lifetime ${family}${active ? " active" : ""}`}>
      <button type="button" onClick={() => setVeto(!veto)}>
        Toggle native veto
      </button>
      <button type="button" onClick={() => setSynchronous(!synchronous)}>
        Toggle native synchronous change
      </button>
      <output data-lifetime-clicks>{clicks}</output>
      <output data-lifetime-selected>{selected ?? "none"}</output>
      <output data-lifetime-changes>{changes}</output>
      <Chart.Root
        config={{ first: config.first }}
        interaction={
          active
            ? {
                kind: "series",
                mode: "focus",
                eligibleKeys: ["first"],
                markActivation: "matching-legend",
                selected,
                onSelectionChange: (next) => {
                  setSelected(next);
                  setChanges((n) => n + 1);
                },
              }
            : undefined
        }
      >
        {scatter ? (
          <Chart.ScatterChart width={340} height={240} animate={false}>
            <Chart.XAxis type="number" dataKey="x" />
            <Chart.YAxis type="number" dataKey="y" />
            <Series seriesKey="first" data={scatterRows} shape="diamond" onClick={scatterClick} />
          </Chart.ScatterChart>
        ) : (
          <Chart.RadarChart
            data={rows}
            width={340}
            height={240}
            animate={false}
            selection={active ? "none" : "series"}
          >
            <Chart.PolarAngleAxis dataKey="category" />
            <Chart.PolarRadiusAxis />
            <Chart.RadarSeries
              dataKey="first"
              dot={family === "radar-element" ? lifetimeDotElement : lifetimeDot}
              onClick={radarClick}
            />
          </Chart.RadarChart>
        )}
      </Chart.Root>
    </section>
  );
}
function CellIdentityCase({ accessor }: { accessor: boolean }) {
  const original = [
    { id: "first", value: 20 },
    { id: "second", value: 10 },
  ];
  const [reversed, setReversed] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  const [selected, setSelected] = useState<string | null>(null);
  const [clicks, setClicks] = useState(0);
  const [payload, setPayload] = useState("");
  const [veto, setVeto] = useState(false);
  const [synchronous, setSynchronous] = useState(false);
  const [cellSynchronous, setCellSynchronous] = useState(false);
  const data = reversed ? [...original].reverse() : original;
  return (
    <section aria-label={`Cell identity ${accessor ? "accessor" : "field"}`}>
      <button type="button" onClick={() => setVeto(!veto)}>
        Veto Cell
      </button>
      <button type="button" onClick={() => setReversed(!reversed)}>
        Reorder Cells
      </button>
      <button type="button" onClick={() => setVisible(["second"])}>
        Filter first
      </button>
      <button type="button" onClick={() => setSynchronous(!synchronous)}>
        Sync rows in series handler
      </button>
      <button type="button" onClick={() => setCellSynchronous(!cellSynchronous)}>
        Sync rows in Cell handler
      </button>
      <output data-cell-selected>{selected ?? "none"}</output>
      <output data-cell-clicks>{clicks}</output>
      <output data-cell-payload>{payload}</output>
      <Chart.Root
        config={{ first: config.first, second: config.second }}
        visibleSeries={visible}
        interaction={{
          kind: "category",
          mode: "focus",
          eligibleKeys: ["first", "second"],
          markActivation: "matching-legend",
          selected,
          onSelectionChange: setSelected,
        }}
      >
        <Chart.PieChart width={340} height={240} animate={false}>
          <Chart.PieSeries
            data={data}
            categoryKey={accessor ? (row) => row.id : "id"}
            dataKey="value"
            nameKey="id"
            interactionBinding="root"
            onClick={(sector) => {
              setPayload(String(sector.payload.id));
              if (synchronous) flushSync(() => setReversed((value) => !value));
            }}
          >
            {data.map((row) => (
              <Chart.Cell
                key={row.id}
                id="first"
                fill="#e11d48"
                data-original-category={row.id}
                onClick={(event) => {
                  setClicks((count) => count + 1);
                  if (veto) event.preventDefault();
                  if (cellSynchronous) flushSync(() => setReversed((value) => !value));
                }}
              />
            ))}
          </Chart.PieSeries>
        </Chart.PieChart>
        <Chart.Legend />
      </Chart.Root>
    </section>
  );
}

function ConfiguredInteractionCase() {
  const [selected, setSelected] = useState<string | null>("first");
  const [changes, setChanges] = useState(0);
  return (
    <section aria-label="Configured interactions">
      <Chart.LineChart
        aria-label="Configured focus"
        config={{ first: config.first, second: config.second }}
        data={rows}
        xDataKey="category"
        width={340}
        height={240}
        animate={false}
        rootProps={{
          interaction: {
            kind: "series",
            mode: "focus",
            eligibleKeys: ["first", "second"],
            markActivation: "matching-legend",
            selected,
            onSelectionChange: (next) => {
              setSelected(next);
              setChanges((n) => n + 1);
            },
          },
        }}
      />
      <output data-configured-selected>{selected ?? "none"}</output>
      <output data-configured-changes>{changes}</output>
    </section>
  );
}
function SharedInteractions() {
  const [family, setFamily] = useState("bar");
  const [mode, setMode] = useState<"focus" | "visibility">("focus");
  const [controlled, setControlled] = useState(false);
  const [selected, setSelected] = useState<string | null>("first");
  const [visible, setVisible] = useState(["first", "second"]);
  const [removed, setRemoved] = useState(false);
  const [reordered, setReordered] = useState(false);
  const [veto, setVeto] = useState(false);
  const [beforeVeto, setBeforeVeto] = useState(false);
  const [changes, setChanges] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [transient, setTransient] = useState(true);
  const [nativeHidden, setNativeHidden] = useState(false);
  const [customShape, setCustomShape] = useState(false);
  const category = family === "pie" || family === "radial";
  const keys = removed ? ["second"] : ["first", "second"];
  const rows = [
    { category: "A", first: 20, second: 10 },
    { category: "B", first: 10, second: 20 },
  ];
  const categories = (
    reordered
      ? [
          { key: "second", value: 10 },
          { key: "first", value: 20 },
        ]
      : [
          { key: "first", value: 20 },
          { key: "second", value: 10 },
        ]
  ).filter((row) => keys.includes(row.key));
  const series = keys.map((key) =>
    family === "line" ? (
      <Chart.LineSeries
        key={key}
        dataKey={key}
        onClick={(_data, event) => {
          setClicks((n) => n + 1);
          if (veto) event.preventDefault();
        }}
      />
    ) : family === "area" ? (
      <Chart.AreaSeries key={key} dataKey={key} hide={!visible.includes(key)} />
    ) : family === "radar" ? (
      <Chart.RadarSeries key={key} dataKey={key} fillOpacity={0.3} />
    ) : family === "scatter" ? (
      <Chart.ScatterSeries
        key={key}
        seriesKey={key}
        data={[{ x: key === "first" ? 10 : 20, y: key === "first" ? 20 : 10 }]}
      />
    ) : (
      <Chart.BarSeries
        key={key}
        dataKey={key}
        hide={nativeHidden && key === "second"}
        onClick={(_data, _index, event) => {
          setClicks((n) => n + 1);
          if (veto) event.preventDefault();
        }}
      />
    ),
  );
  const axes = (
    <>
      <Chart.XAxis dataKey="category" />
      <Chart.YAxis />
    </>
  );
  const chart =
    family === "pie" ? (
      <Chart.PieChart width={340} height={240} animate={false}>
        <Chart.PieSeries
          data={categories}
          dataKey="value"
          nameKey="key"
          categoryKey="key"
          interactionBinding="root"
          shape={customShape ? customSector : undefined}
        >
          {categories.map((row) => (
            <Chart.Cell key={row.key} fill={row.key === "first" ? "#ff0000" : "#0000ff"} />
          ))}
        </Chart.PieSeries>
      </Chart.PieChart>
    ) : family === "radial" ? (
      <Chart.RadialBarChart
        width={340}
        height={240}
        animate={false}
        data={categories}
        categoryKey="key"
        interactionBinding="root"
      >
        <Chart.PolarAngleAxis type="number" domain={[0, 30]} tick={false} />
        <Chart.PolarRadiusAxis type="category" dataKey="key" tick={false} />
        <Chart.RadialBarSeries dataKey="value" shape={customShape ? customSector : undefined} />
      </Chart.RadialBarChart>
    ) : family === "radar" ? (
      <Chart.RadarChart width={340} height={240} animate={false} data={rows}>
        <Chart.PolarAngleAxis dataKey="category" />
        <Chart.PolarRadiusAxis />
        {series}
      </Chart.RadarChart>
    ) : family === "scatter" ? (
      <Chart.ScatterChart width={340} height={240} animate={false}>
        <Chart.XAxis type="number" dataKey="x" />
        <Chart.YAxis type="number" dataKey="y" />
        {series}
      </Chart.ScatterChart>
    ) : family === "line" ? (
      <Chart.LineChart width={340} height={240} data={rows}>
        {axes}
        {series}
      </Chart.LineChart>
    ) : family === "area" ? (
      <Chart.AreaChart width={340} height={240} data={rows} animate={false}>
        {axes}
        {series}
      </Chart.AreaChart>
    ) : (
      <Chart.BarChart width={340} height={240} data={rows} animate={false}>
        {axes}
        {series}
      </Chart.BarChart>
    );
  const selectionChange = (next: string | null) => {
    setChanges((n) => n + 1);
    if (controlled) setSelected(next);
  };
  const interaction: Chart.ChartInteractionConfig =
    mode === "focus"
      ? {
          kind: category ? "category" : "series",
          mode,
          eligibleKeys: keys,
          markActivation: "matching-legend",
          ...(controlled
            ? { selected, onSelectionChange: selectionChange }
            : { defaultSelected: "first", onSelectionChange: selectionChange }),
          onBeforeInteraction: (request) => {
            if (beforeVeto) request.event?.preventDefault();
          },
        }
      : {
          kind: category ? "category" : "series",
          mode,
          eligibleKeys: keys,
          markActivation: "matching-legend",
          onBeforeInteraction: (request) => {
            if (beforeVeto) request.event?.preventDefault();
          },
        };
  return (
    <section id="shared-interactions" aria-label="Shared interactions">
      <h2>Shared interaction contract</h2>
      <label>
        Interaction family{" "}
        <select
          value={family}
          onChange={(event) => {
            setFamily(event.target.value);
            setChanges(0);
            setVisible(["first", "second"]);
          }}
        >
          {["bar", "line", "area", "scatter", "radar", "pie", "radial"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "focus" ? "visibility" : "focus");
          setChanges(0);
          setVisible(["first", "second"]);
        }}
      >
        Switch mode
      </button>
      <button
        type="button"
        onClick={() => {
          setControlled(!controlled);
          setSelected("first");
          setChanges(0);
        }}
      >
        Switch owner
      </button>
      <button type="button" onClick={() => setRemoved(!removed)}>
        Remove first identity
      </button>
      <button type="button" onClick={() => setReordered(!reordered)}>
        Reorder identities
      </button>
      <button type="button" onClick={() => setVeto(!veto)}>
        Toggle consumer veto
      </button>
      <button type="button" onClick={() => setBeforeVeto(!beforeVeto)}>
        Toggle before veto
      </button>
      <button type="button" onClick={() => setNativeHidden(!nativeHidden)}>
        Toggle native hide
      </button>
      <button type="button" onClick={() => setCustomShape(!customShape)}>
        Toggle custom shape
      </button>
      <button type="button" onClick={() => setTransient(!transient)}>
        Toggle transient emphasis
      </button>
      <output data-interaction-changes>{changes}</output>
      <output data-interaction-clicks>{clicks}</output>
      <Chart.Root
        key={`${family}/${controlled}/${mode}`}
        config={{ first: config.first, second: config.second, stale: { color: "red" } }}
        emphasis={transient ? "auto" : "none"}
        interaction={interaction}
        visibleSeries={visible}
        onVisibleSeriesChange={(next) => {
          setChanges((n) => n + 1);
          setVisible(next);
        }}
        onKeyDown={(event) => {
          if (veto) event.preventDefault();
        }}
      >
        {chart}
        <Chart.Legend
          emphasis="series"
          onClick={(event) => {
            if (veto) event.preventDefault();
          }}
        />
        <ResetInteraction />
      </Chart.Root>
    </section>
  );
}
function ResetInteraction() {
  const interaction = Chart.useChartInteraction();
  return (
    <>
      <output data-interaction-selected>{interaction.selected ?? "none"}</output>
      <button type="button" onClick={(event) => interaction.reset(event)}>
        Reset highlight
      </button>
    </>
  );
}
function SankeyInteractionCase() {
  const config = {
    first: { label: "First", color: "red" },
    second: { label: "Second", color: "blue" },
    third: { label: "Third", color: "green" },
    fourth: { label: "Fourth", color: "purple" },
  };
  const [changes, setChanges] = useState(0);
  const [payload, setPayload] = useState("");
  const data: Chart.SankeyFlowData = {
    nodes: Object.keys(config).map((id) => ({ id, name: id })),
    links: [
      { id: "a", source: "first", target: "second", value: 10 },
      { id: "b", source: "third", target: "fourth", value: 5 },
    ],
  };
  return (
    <section aria-label="Shared Sankey focus">
      <Chart.Root
        config={config}
        interaction={{
          kind: "node",
          mode: "focus",
          eligibleKeys: Object.keys(config),
          defaultSelected: "first",
          markActivation: "matching-legend",
          onSelectionChange: () => setChanges((n) => n + 1),
        }}
      >
        <Chart.SankeyChart
          width={400}
          height={250}
          data={data}
          nodeConfig={config}
          interactionBinding="root"
          onClick={(item, type, event) => setPayload(`${type}/${item.payload.id}/${event.type}`)}
        />
        <Chart.SankeyLegend config={config} interactionBinding="root" />
        <ResetInteraction />
        <output data-sankey-changes>{changes}</output>
        <output data-sankey-payload>{payload}</output>
      </Chart.Root>
    </section>
  );
}
function LegacyAndDuplicateIdentities() {
  const [scatterVisible, setScatterVisible] = useState(["first", "second"]);
  const [duplicateVisible, setDuplicateVisible] = useState(["first", "second"]);
  const [changes, setChanges] = useState(0);
  const config = {
    first: { label: "First", color: "red" },
    second: { label: "Second", color: "blue" },
  };
  return (
    <>
      <section aria-label="Legacy Scatter visibility">
        <Chart.Root
          config={config}
          visibleSeries={scatterVisible}
          onVisibleSeriesChange={setScatterVisible}
        >
          <Chart.ScatterChart width={320} height={200} animate={false}>
            <Chart.XAxis type="number" dataKey="x" />
            <Chart.YAxis type="number" dataKey="y" />
            <Chart.ScatterSeries seriesKey="first" data={[{ x: 10, y: 10 }]} />
            <Chart.ScatterSeries seriesKey="second" data={[{ x: 20, y: 20 }]} />
          </Chart.ScatterChart>
          <Chart.Legend />
        </Chart.Root>
      </section>
      <section aria-label="Duplicate series availability">
        <Chart.Root
          config={config}
          interaction={{ kind: "series", eligibleKeys: ["first", "second"] }}
          visibleSeries={duplicateVisible}
          onVisibleSeriesChange={(next) => {
            setDuplicateVisible(next);
            setChanges((n) => n + 1);
          }}
        >
          <Chart.BarChart
            data={[{ first: 10, second: 20 }]}
            width={320}
            height={200}
            animate={false}
          >
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.BarSeries dataKey="first" />
            <Chart.BarSeries dataKey="second" hide />
          </Chart.BarChart>
          <Chart.BarChart data={[{ second: 20 }]} width={320} height={200} animate={false}>
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.BarSeries dataKey="second" />
          </Chart.BarChart>
          <Chart.Legend />
          <output data-duplicate-changes>{changes}</output>
        </Chart.Root>
      </section>
    </>
  );
}
function App() {
  const [reversed, setReversed] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [sparse, setSparse] = useState(false);
  const [customPeer, setCustomPeer] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  const [incomingVisible, setIncomingVisible] = useState(["bins", "distribution"]);
  const [clicks, setClicks] = useState(0);
  const data = (reversed ? [...rows].reverse() : rows)
    .filter((row) => !removed || row.category !== "A")
    .map((row) => (sparse && row.category === "B" ? { ...row, second: 0 } : row));
  return (
    <main style={{ fontFamily: "system-ui", width: 950, margin: "24px auto" }}>
      {new URLSearchParams(window.location.search).has("interactions") && (
        <>
          {["scatter-named", "scatter-namespace", "radar-element", "radar-function"].map(
            (family) => (
              <NativeLifetimeCase key={family} family={family} />
            ),
          )}
          <NativeLifetimeCase family="scatter-namespace" active />
          <NativeLifetimeCase family="radar-function" active />
          <CellIdentityCase accessor={false} />
          <CellIdentityCase accessor />
          <ConfiguredInteractionCase />
          <SharedInteractions />
          <SankeyInteractionCase />
          <LegacyAndDuplicateIdentities />
        </>
      )}
      <h1>Emphasis where comparison benefits</h1>
      <p>
        Inspect a category or sector. Every series in the active bar category stays visible. Line
        and area comparisons retain their full strength.
      </p>
      <button type="button" onClick={() => setReversed(!reversed)}>
        Reorder
      </button>
      <button type="button" onClick={() => setRemoved(!removed)}>
        Remove A
      </button>
      <button type="button" onClick={() => setEnabled(!enabled)}>
        Toggle emphasis
      </button>
      <button type="button" onClick={() => setStacked(!stacked)}>
        Toggle stack
      </button>
      <button type="button" onClick={() => setSparse(!sparse)}>
        Toggle sparse
      </button>
      <button type="button" onClick={() => setCustomPeer(!customPeer)}>
        Toggle custom peer
      </button>
      <p>
        Consumer clicks: <output>{clicks}</output>
      </p>
      <Chart.Root
        config={config}
        emphasis={enabled ? "auto" : "none"}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <section id="bars" style={{ width: "min(440px, calc(100vw - 48px))" }}>
          <h2>Grouped category inspection</h2>
          <ResponsiveContainer width="100%" height={250}>
            <Chart.BarChart data={data} accessibilityLayer emphasis="category">
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" />
              <YAxis />
              <ReferenceLine y={10} label="Reference" />
              <Chart.BarSeries
                dataKey="first"
                material="paper"
                opacity={0.5}
                {...(stacked ? { stackId: "stack" } : {})}
                onClick={() => setClicks(clicks + 1)}
              >
                <LabelList dataKey="first" />
              </Chart.BarSeries>
              <Chart.BarSeries
                dataKey="second"
                material="clay"
                {...(customPeer ? { shape: nativeShape } : {})}
                {...(stacked ? { stackId: "stack" } : {})}
              />
              <Chart.Tooltip />
            </Chart.BarChart>
          </ResponsiveContainer>
          <Chart.Legend emphasis="series" />
        </section>
        <section id="oracle">
          <h2>Unchanged native filtering oracle</h2>
          <Chart.BarChart width={440} height={250} data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" />
            <YAxis />
            <ReferenceLine y={10} label="Reference" />
            <Chart.BarSeries dataKey="first" {...(stacked ? { stackId: "stack" } : {})}>
              <LabelList dataKey="first" />
            </Chart.BarSeries>
            <Chart.BarSeries
              dataKey="second"
              {...(stacked ? { stackId: "stack" } : {})}
              {...(customPeer ? { shape: nativeShape } : {})}
            />
            <Chart.Tooltip />
          </Chart.BarChart>
        </section>
        <section id="independent">
          <h2>Independent plot</h2>
          <Chart.BarChart width={440} height={250} data={data}>
            <XAxis dataKey="category" />
            <YAxis />
            <Chart.BarSeries dataKey="first" />
            <Chart.Tooltip />
          </Chart.BarChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config} emphasis={enabled ? "auto" : "none"}>
        <section id="pie">
          <h2>Donut sector inspection</h2>
          <Chart.PieChart width={440} height={260} accessibilityLayer>
            <Chart.PieSeries
              data={[
                { id: "alpha", value: 60 },
                { id: "beta", value: 40 },
              ]}
              dataKey="value"
              nameKey="id"
              innerRadius={60}
              outerRadius={105}
              label
            >
              <Cell fill="#635bff" opacity={0.4} />
              <Cell fill="#00a6a0" />
            </Chart.PieSeries>
            <Chart.Tooltip itemKey={(entry) => String(entry.payload.id)} />
          </Chart.PieChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config}>
        <section id="custom">
          <h2>Explicit custom portal contract</h2>
          <Chart.BarChart width={440} height={250} data={data}>
            <XAxis dataKey="category" />
            <YAxis />
            <Chart.BarSeries dataKey="first" shape={portalShape} />
            <Chart.Tooltip />
          </Chart.BarChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config}>
        <section id="index-default">
          <h2>Positional identity stays native</h2>
          <Chart.BarChart width={440} height={250} data={data} emphasis="category">
            <XAxis />
            <YAxis />
            <Chart.BarSeries dataKey="first" />
            <Chart.BarSeries dataKey="second" />
          </Chart.BarChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config}>
        <section id="index-explicit">
          <h2>Explicit stable category identity</h2>
          <Chart.BarChart width={440} height={250} data={data} emphasis="category">
            <XAxis />
            <YAxis />
            <Chart.BarSeries dataKey="first" emphasisKey={categoryIdentity} />
            <Chart.BarSeries dataKey="second" emphasisKey={categoryIdentity} />
          </Chart.BarChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config}>
        <section id="deduplicated">
          <h2>Ambiguous native category mapping stays native</h2>
          <Chart.BarChart
            width={440}
            height={250}
            data={[rows[0], rows[0], rows[1]]}
            emphasis="category"
          >
            <XAxis dataKey="category" allowDuplicatedCategory={false} />
            <YAxis />
            <Chart.BarSeries dataKey="first" />
            <Chart.BarSeries dataKey="second" />
          </Chart.BarChart>
        </section>
      </Chart.Root>
      <Chart.Root config={config}>
        <section id="line">
          <h2>Shared comparison stays legible</h2>
          <Chart.LineChart width={440} height={250} data={data}>
            <XAxis dataKey="category" />
            <YAxis />
            <Chart.LineSeries dataKey="first" />
            <Chart.LineSeries dataKey="second" />
            <Chart.Tooltip />
          </Chart.LineChart>
        </section>
      </Chart.Root>
      <Chart.Root
        visibleSeries={incomingVisible}
        onVisibleSeriesChange={setIncomingVisible}
        config={{
          bins: { label: "Bins", color: "#635bff" },
          distribution: { label: "Distribution", color: "#00a6a0" },
        }}
      >
        <section id="incoming">
          <h2>Incoming families keep native materials</h2>
          <Chart.Legend emphasis="series" />
          <Chart.HistogramChart
            width={440}
            height={250}
            bins={[
              { lower: 0, upper: 1, count: 3 },
              { lower: 1, upper: 2, count: 5 },
            ]}
            measure="count"
            emphasis="category"
          >
            <Chart.HistogramSeries seriesKey="bins" material="paper" />
          </Chart.HistogramChart>
          <Chart.BoxPlotChart
            width={440}
            height={250}
            data={[
              {
                category: "A",
                summary: {
                  lowerWhisker: 1,
                  q1: 2,
                  median: 3,
                  q3: 4,
                  upperWhisker: 5,
                  outliers: [7],
                },
              },
            ]}
            emphasis="category"
          >
            <XAxis dataKey="category" />
            <YAxis />
            <Chart.BoxPlotSeries dataKey="summary" seriesKey="distribution" material="clay" />
          </Chart.BoxPlotChart>
        </section>
      </Chart.Root>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
