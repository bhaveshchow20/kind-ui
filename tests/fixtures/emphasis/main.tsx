import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import {
  type BarShapeProps,
  CartesianGrid,
  Cell,
  LabelList,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useState } from "react";
import { createPortal } from "react-dom";
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
