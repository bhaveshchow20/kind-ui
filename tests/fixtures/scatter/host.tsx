// Only host composition: all maintained behavior comes from the packed public exports.
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  LabelList,
  ScatterChart as NativeChart,
  Scatter,
  type ScatterShapeProps,
  Symbols,
  type TooltipContentProps,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const data = [
  { id: "origin", x: 0, y: 0, z: 0 },
  { id: "signed", x: -4, y: 8, z: 20 },
  { id: "duplicate-a", x: 5, y: -3, z: 80 },
  { id: "duplicate-b", x: 5, y: -3, z: 40 },
  { id: "missing-size", x: 9, y: 5, z: null },
  { id: "missing-y", x: 7, y: null, z: 60 },
];
type Point = (typeof data)[number];
const volume = (row: Point) => row.z;
const other = [
  { id: "other-origin", x: 0, y: 0, z: 110 },
  { id: "other-point", x: 8, y: -7, z: 35 },
];
const config = {
  alpha: { label: "Alpha", color: "#7c3aed" },
  beta: { label: "Beta", color: "#059669" },
};
function label(row: unknown) {
  return row && typeof row === "object" && "id" in row ? String(row.id) : "Point";
}
function Shape(props: ScatterShapeProps & { fill?: string; stroke?: string }) {
  if (props.cx == null || props.cy == null) return null;
  return (
    <Symbols
      data-point={label(props.payload)}
      data-cx={props.cx}
      data-cy={props.cy}
      data-size={props.size}
      data-active={props.isActive}
      cx={props.cx}
      cy={props.cy}
      size={props.size}
      fill={props.fill}
      stroke={props.stroke}
      type="circle"
    />
  );
}
function Content(props: TooltipContentProps) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        Count {count}
      </button>
      <Chart.ScatterTooltipContent tooltip={props} pointLabel={label} />
    </div>
  );
}
export function ScatterHost() {
  const [visible, setVisible] = useState(["alpha", "beta"]);
  const [animate, setAnimate] = useState<boolean | Chart.ScatterAnimation>(false);
  const [filterNull, setFilterNull] = useState(false);
  const [functionZ, setFunctionZ] = useState(false);
  const [custom, setCustom] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [domain, setDomain] = useState(12);
  const [updated, setUpdated] = useState(false);
  const [hide, setHide] = useState(false);
  const [size, setSize] = useState(700);
  const [events, setEvents] = useState({ click: 0, enter: 0, move: 0, leave: 0 });
  const values = updated ? data.map((p) => ({ ...p, x: p.x + 2 })) : data;
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        type="number"
        xAxisId="latency"
        dataKey="x"
        name="Latency"
        unit=" ms"
        domain={[-domain, domain]}
        allowDataOverflow
      />
      <YAxis
        type="number"
        yAxisId="change"
        dataKey="y"
        name="Change"
        unit="%"
        domain={[-10, 10]}
        allowDataOverflow
      />
      <ZAxis
        zAxisId="volume"
        dataKey={functionZ ? volume : "z"}
        name="Volume"
        unit=" jobs"
        domain={[0, 120]}
        range={[55, size]}
      />
    </>
  );
  const seriesProps = {
    data: values,
    xAxisId: "latency",
    yAxisId: "change",
    zAxisId: "volume",
    shape: Shape,
    activeShape: Shape,
    onClick: () => setEvents((v) => ({ ...v, click: v.click + 1 })),
    onMouseEnter: () => setEvents((v) => ({ ...v, enter: v.enter + 1 })),
    onMouseLeave: () => setEvents((v) => ({ ...v, leave: v.leave + 1 })),
  };
  const cells = (
    <>
      {values.map((p, i) => (
        <Cell key={p.id} fill={i === 1 ? "#ea580c" : "#7c3aed"} stroke="#fff" strokeWidth={2} />
      ))}
      <LabelList dataKey="id" position="top" />
    </>
  );
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "auto" }}>
      <h1>Packed Scatter contracts</h1>
      <div>
        {[
          <button
            key="animate"
            type="button"
            onClick={() => setAnimate((v) => (v === false ? { revealDurationMs: 3000 } : false))}
          >
            Animate
          </button>,
          <button key="true" type="button" onClick={() => setAnimate(true)}>
            Default animation
          </button>,
          <button key="accessor" type="button" onClick={() => setFunctionZ(!functionZ)}>
            Size accessor
          </button>,
          <button key="nulls" type="button" onClick={() => setFilterNull(!filterNull)}>
            Filter null
          </button>,
          <button key="custom" type="button" onClick={() => setCustom(!custom)}>
            Custom content
          </button>,
          <button key="resize" type="button" onClick={() => setNarrow(!narrow)}>
            Resize
          </button>,
          <button key="domain" type="button" onClick={() => setDomain(domain === 12 ? 18 : 12)}>
            Domain
          </button>,
          <button key="data" type="button" onClick={() => setUpdated(!updated)}>
            Update
          </button>,
          <button key="hide" type="button" onClick={() => setHide(!hide)}>
            Native hide
          </button>,
          <button key="size" type="button" onClick={() => setSize(size === 700 ? 1400 : 700)}>
            Size range
          </button>,
        ]}
      </div>
      <output aria-label="Events">
        {events.click}/{events.enter}/{events.move}/{events.leave}
      </output>
      <Chart.Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        style={{ width: narrow ? 360 : "100%" }}
      >
        <Chart.Legend />
        <Chart.ScatterChart
          responsive
          style={{ width: "100%", height: 350 }}
          aria-label="Packed scatter"
          animate={animate}
          ref={(node) => node?.setAttribute("data-ref", node.tagName)}
          onMouseMove={() => setEvents((v) => ({ ...v, move: v.move + 1 }))}
        >
          {axes}
          <Chart.ScatterSeries {...seriesProps} seriesKey="alpha" id="alpha-native" hide={hide}>
            {cells}
          </Chart.ScatterSeries>
          <Chart.ScatterSeries
            seriesKey="beta"
            id="beta-native"
            data={other}
            xAxisId="latency"
            yAxisId="change"
            zAxisId="volume"
            shape={Shape}
            activeShape={Shape}
          />
          <Chart.ScatterTooltip
            axisId="latency"
            filterNull={filterNull}
            pointLabel={label}
            zDimension={{ dataKey: functionZ ? volume : "z", name: "Volume", unit: " jobs" }}
            ref={(node) => node?.setAttribute("data-ref", node.tagName)}
            {...(custom
              ? {
                  content: (
                    <Content
                      active={false}
                      payload={[]}
                      activeIndex={undefined}
                      coordinate={undefined}
                      accessibilityLayer={false}
                    />
                  ),
                }
              : {})}
          />
        </Chart.ScatterChart>
      </Chart.Root>
      <section aria-label="Native equivalence">
        <NativeChart width={900} height={350} aria-label="Native scatter">
          {axes}
          <Scatter
            {...seriesProps}
            id="mirror-alpha"
            fill="#7c3aed"
            hide={hide || !visible.includes("alpha")}
            isAnimationActive={false}
          >
            {cells}
          </Scatter>
          <Scatter
            data={other}
            id="mirror-beta"
            fill="#059669"
            xAxisId="latency"
            yAxisId="change"
            zAxisId="volume"
            shape={Shape}
            activeShape={Shape}
            hide={!visible.includes("beta")}
            isAnimationActive={false}
          />
        </NativeChart>
      </section>
      <details>
        <summary>All point values</summary>
        <table>
          <caption>Raw observations, including missing measurements and overlapping points</caption>
          <thead>
            <tr>
              <th>Point</th>
              <th>x (ms)</th>
              <th>y (%)</th>
              <th>z (jobs)</th>
            </tr>
          </thead>
          <tbody>
            {[...values, ...other].map((p) => (
              <tr key={p.id}>
                <th>{p.id}</th>
                <td>{p.x}</td>
                <td>{p.y ?? "No data"}</td>
                <td>{p.z ?? "No data"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </main>
  );
}
