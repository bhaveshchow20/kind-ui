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
    ...(new URLSearchParams(location.search).has("builtin")
      ? {}
      : { shape: Shape, activeShape: Shape }),
    onClick: () => setEvents((v) => ({ ...v, click: v.click + 1 })),
    onMouseEnter: () => setEvents((v) => ({ ...v, enter: v.enter + 1 })),
    onMouseLeave: () => setEvents((v) => ({ ...v, leave: v.leave + 1 })),
  };
  const cells = (
    <>
      {values.map((p, i) => (
        <Cell
          key={p.id}
          data-point={p.id}
          fill={i === 1 ? "#ea580c" : "#7c3aed"}
          stroke="#fff"
          strokeWidth={2}
        />
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

const types = ["circle", "diamond", "square", "triangle", "star", "cross", "wye"] as const;
const materialData = [
  { id: "zero", x: 12, y: 45, z: 0 },
  { id: "missing", x: 23, y: 35, z: null },
  { id: "small", x: 34, y: 50, z: 1 },
  { id: "medium", x: 47, y: 40, z: 16 },
  { id: "large", x: 62, y: 60, z: 64 },
  { id: "largest", x: 76, y: 35, z: 250 },
  { id: "edge", x: 99, y: 55, z: 500 },
];
function Custom(point: ScatterShapeProps) {
  return <Symbols {...point} type="diamond" data-custom="function" />;
}
export function ScatterMaterialHost() {
  const [pointClip, setPointClip] = useState(0);
  const [defaults, setDefaults] = useState(0);
  const [activeOwner, setActiveOwner] = useState(0);
  const [holes, setHoles] = useState(false);
  const [thickStroke, setThickStroke] = useState(false);
  const [strokeOnly, setStrokeOnly] = useState(false);
  const [subpixel, setSubpixel] = useState(false);
  const [material, setMaterial] = useState<Chart.ScatterMaterial>("plain");
  const [animate, setAnimate] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [pink, setPink] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [symbol, setSymbol] = useState<(typeof types)[number]>("circle");
  const nativeShape =
    defaults === 1 ? true : defaults === 2 ? false : defaults === 3 ? undefined : symbol;
  const [ownership, setOwnership] = useState(false);
  const [update, setUpdate] = useState(false);
  const [clicks, setClicks] = useState(0);
  const values = update ? materialData.map((p) => ({ ...p, y: p.y + 4 })) : materialData;
  const paint = pink ? "#efb4cb" : "#755ad8";
  const axes = (
    <>
      <XAxis type="number" dataKey="x" domain={[0, 100]} allowDataOverflow />
      <YAxis type="number" dataKey="y" domain={[0, 100]} allowDataOverflow />
      <ZAxis dataKey="z" domain={[0, 500]} range={[subpixel ? 0.25 : 4, 1500]} name="Volume" />
    </>
  );
  const cells = (
    <>
      {values.map((p, i) => (
        <Cell
          key={p.id}
          fill={strokeOnly ? "none" : gradient ? "url(#alpha-paint)" : i === 3 ? "#169b83" : paint}
          stroke={strokeOnly ? (gradient ? "url(#alpha-paint)" : paint) : "none"}
          strokeOpacity={0.35}
          strokeWidth={strokeOnly ? 1.5 : 0}
          {...(i === 3 ? { cx: 180, cy: 150, size: 16, sizeType: "diameter", type: "square" } : {})}
          fillOpacity={i === 4 ? 0 : 0.35}
          opacity={0.8}
          {...(i === 5 && (pointClip === 1 || pointClip === 3)
            ? { clipPath: pointClip === 1 ? "url(#point-clip)" : "url(#local-point-clip)" }
            : {})}
          style={{
            opacity: 0.6,
            ...(thickStroke ? { strokeWidth: 12 } : {}),
            ...(i === 5 && (pointClip === 2 || pointClip === 4)
              ? { clipPath: pointClip === 2 ? "url(#point-clip)" : "url(#local-point-clip)" }
              : {}),
          }}
        />
      ))}
      <LabelList dataKey="id" position="top" />
    </>
  );
  const defs = (
    <defs>
      <clipPath id="point-clip" clipPathUnits="objectBoundingBox">
        <rect width={0.5} height={1} />
      </clipPath>
      <clipPath id="local-point-clip" clipPathUnits="userSpaceOnUse">
        <rect x={-100} y={-100} width={100} height={200} />
      </clipPath>
      <linearGradient id="alpha-paint">
        <stop stopColor={paint} stopOpacity={holes ? 0 : 0.2} />
        {holes && <stop offset="0.5" stopColor={paint} stopOpacity={0} />}
        <stop offset="1" stopColor={paint} stopOpacity={0.9} />
      </linearGradient>
    </defs>
  );
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      <h1>Packed Scatter materials</h1>
      <div>
        {(["plain", "paper", "clay", "glow"] as const).map((finish) => (
          <button key={finish} type="button" onClick={() => setMaterial(finish)}>
            {finish}
          </button>
        ))}
      </div>
      <div>
        {types.map((type) => (
          <button key={type} type="button" onClick={() => setSymbol(type)}>
            {type}
          </button>
        ))}
      </div>
      <div>
        <button type="button" onClick={() => setAnimate(!animate)}>
          Motion
        </button>
        <button type="button" onClick={() => setNarrow(!narrow)}>
          Resize
        </button>
        <button type="button" onClick={() => setPink(!pink)}>
          Pink
        </button>
        <button type="button" onClick={() => setGradient(!gradient)}>
          Gradient
        </button>
        <button type="button" onClick={() => setOwnership(!ownership)}>
          Ownership
        </button>
        <button type="button" onClick={() => setUpdate(!update)}>
          Update
        </button>
      </div>
      <div>
        <button type="button" onClick={() => setDefaults((n) => (n + 1) % 4)}>
          Native defaults
        </button>
        <button type="button" onClick={() => setSubpixel(!subpixel)}>
          Subpixel
        </button>
      </div>
      <div>
        <button type="button" onClick={() => setActiveOwner((n) => (n + 1) % 4)}>
          Active owner
        </button>
        <button type="button" onClick={() => setHoles(!holes)}>
          Transparent gradient
        </button>
        <button type="button" onClick={() => setStrokeOnly(!strokeOnly)}>
          Stroke only
        </button>
      </div>
      <button type="button" onClick={() => setThickStroke(!thickStroke)}>
        Thick stroke
      </button>
      <button type="button" onClick={() => setPointClip((v) => (v + 1) % 5)}>
        Point clip
      </button>
      <output aria-label="Clicks">{clicks}</output>
      <Chart.Root
        config={{ marks: { label: "Marks", color: paint } }}
        style={{ width: narrow ? 280 : 700, maxWidth: "100%" }}
      >
        <Chart.Legend />
        <Chart.ScatterChart
          responsive
          style={{ width: "100%", height: 260 }}
          animate={animate}
          aria-label="Finished symbols"
          ref={(node) => node?.setAttribute("data-ref", node.tagName)}
        >
          {defs}
          {axes}
          <Chart.ScatterSeries
            material={material}
            data={values}
            seriesKey="marks"
            {...(nativeShape !== undefined ? { shape: nativeShape, activeShape: nativeShape } : {})}
            {...(activeOwner === 1
              ? { activeShape: Custom }
              : activeOwner === 2
                ? { activeShape: <Symbols type="square" data-custom="active-element" /> }
                : activeOwner === 3
                  ? { activeShape: { fill: "red" } }
                  : {})}
            onClick={() => setClicks((n) => n + 1)}
          >
            {cells}
          </Chart.ScatterSeries>
          {ownership && (
            <>
              <Chart.ScatterSeries
                material={material}
                data={[{ x: 30, y: 80 }]}
                shape={Custom}
                activeShape={Custom}
              />
              <Chart.ScatterSeries
                material={material}
                data={[{ x: 50, y: 80 }]}
                shape={<Symbols type="star" data-custom="element" />}
              />
              <Chart.ScatterSeries
                material={material}
                data={[{ x: 70, y: 80 }]}
                shape={{ fill: "red" }}
              />
              <Chart.ScatterSeries material={material} data={[{ x: 80, y: 80 }]}>
                <Cell filter="none" />
              </Chart.ScatterSeries>
              <Chart.ScatterSeries material={material} data={[{ x: 90, y: 80 }]}>
                <Cell style={{ filter: "none" }} />
              </Chart.ScatterSeries>
            </>
          )}
          <Chart.ScatterTooltip
            pointLabel={(row) => String((row as { id: string }).id)}
            zDimension={{ dataKey: "z", name: "Volume" }}
          />
        </Chart.ScatterChart>
        <NativeChart responsive style={{ width: "100%", height: 260 }} aria-label="Native symbols">
          {axes}
          <Scatter
            data={values}
            fill={paint}
            {...(nativeShape !== undefined ? { shape: nativeShape, activeShape: nativeShape } : {})}
            isAnimationActive={false}
          >
            {cells}
          </Scatter>
        </NativeChart>
      </Chart.Root>
    </main>
  );
}
