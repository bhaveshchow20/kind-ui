// Host composition only; the installed tarball supplies every Kind component.
import * as Chart from "@kind-ui/charts";
import { type ComponentProps, useCallback, useState } from "react";
import {
  Cell,
  LabelList,
  Radar as NativeRadar,
  RadarChart as NativeRadarChart,
  RadialBar as NativeRadialBar,
  RadialBarChart as NativeRadialBarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Polygon,
  Sector,
} from "recharts";

const initial = [
  { id: "speed", category: "Speed", value: 80, other: 55 },
  { id: "quality", category: "Quality", value: 50, other: 75 },
  { id: "cost", category: "Cost", value: 30, other: 65 },
  { id: "support", category: "Support", value: 0, other: 40 },
];
const range = (row: (typeof initial)[number]): [number, number] => [row.value, row.other];
const other = (row: (typeof initial)[number]) => row.other;
function Shape(props: ComponentProps<typeof Sector>) {
  return <Sector {...props} data-host-shape="radial" />;
}
function Content({ label }: { label?: string | number }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        Content count {count}
      </button>
      Custom {label}
    </div>
  );
}
export function PolarHost() {
  const params = new URLSearchParams(window.location.search);
  const [animate, setAnimate] = useState<boolean | Chart.RadarAnimation>(
    params.has("motion") ? { revealDurationMs: 2400 } : false,
  );
  const [material, setMaterial] = useState<Chart.PolarMaterial>("plain");
  const [nativeFilter, setNativeFilter] = useState(false);
  const [visible, setVisible] = useState(["value", "alias"]);
  const [updated, setUpdated] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [zero, setZero] = useState(false);
  const [domain, setDomain] = useState(100);
  const [small, setSmall] = useState(false);
  const [hide, setHide] = useState(false);
  const [shift, setShift] = useState(false);
  const [custom, setCustom] = useState(false);
  const [content, setContent] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [moves, setMoves] = useState(0);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) {
      node.dataset.hostRef = "attached";
      node.dataset.refCount = String(Number(node.dataset.refCount ?? 0) + 1);
    }
  }, []);
  let data = initial.map((row) => ({
    ...row,
    value: zero
      ? 0
      : params.has("short")
        ? 0.3
        : params.has("signed")
          ? row.value - 50
          : updated
            ? 100 - row.value
            : row.value,
  }));
  if (reverse) data = [...data].reverse();
  if (empty) data = [];
  const config = {
    value: { label: "Actual", color: "#3161bd", formatValue: (value: unknown) => `${value} pts` },
    alias: { label: "Target", color: "#c16a31", formatValue: (value: unknown) => `${value} pts` },
  } satisfies Chart.SeriesConfig;
  const width = small ? 330 : 520;
  return (
    <main>
      <label>
        Material{" "}
        <select
          aria-label="Material"
          value={material}
          onChange={(event) => setMaterial(event.target.value as Chart.PolarMaterial)}
        >
          <option value="plain">Plain</option>
          <option value="paper">Paper</option>
          <option value="clay">Clay</option>
          <option value="glow">Glow</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={nativeFilter}
          onChange={(event) => setNativeFilter(event.target.checked)}
        />
        Native filter
      </label>
      <button
        type="button"
        onClick={() => setAnimate(animate === false ? { revealDurationMs: 2400 } : false)}
      >
        Motion
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update
      </button>
      <button type="button" onClick={() => setReverse(!reverse)}>
        Reorder
      </button>
      <button type="button" onClick={() => setEmpty(!empty)}>
        Empty
      </button>
      <button type="button" onClick={() => setZero(!zero)}>
        Zero
      </button>
      <button type="button" onClick={() => setDomain(domain === 100 ? 200 : 100)}>
        Domain
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setHide(!hide)}>
        Native hide
      </button>
      <button type="button" onClick={() => setShift(!shift)}>
        Geometry
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Shape
      </button>
      <button type="button" onClick={() => setContent(!content)}>
        Content
      </button>
      <output>
        Clicks {clicks}; moves {moves}
      </output>
      <Chart.Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        data-host="radar"
      >
        <Chart.Legend aria-label="Radar series" />
        <Chart.RadarChart
          ref={ref}
          data={data}
          width={width}
          height={360}
          animate={animate}
          cx={shift ? "40%" : "50%"}
          startAngle={shift ? 0 : 90}
          aria-label="Radar comparison"
          onMouseMove={() => setMoves((n) => n + 1)}
        >
          <defs>
            <linearGradient id="polar-paint">
              <stop stopColor="#df55a0" stopOpacity={0.2} />
              <stop offset="1" stopColor="#8346cc" stopOpacity={0.8} />
            </linearGradient>
            <filter id="host-filter">
              <feOffset dx={0} dy={0} />
            </filter>
          </defs>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis domain={[params.has("signed") ? -100 : 0, domain]} />
          <Chart.RadarSeries<(typeof initial)[number], number | [number, number]>
            dataKey={params.has("range") ? range : "value"}
            seriesKey="value"
            isRange={params.has("range")}
            material={material}
            filter={nativeFilter ? "url(#host-filter)" : undefined}
            style={params.has("style-filter") ? { filter: "none" } : undefined}
            shape={params.has("radar-shape") ? <Polygon data-host-shape="radar" /> : undefined}
            fill={
              params.has("paint")
                ? params.has("solid")
                  ? "#df55a0"
                  : "url(#polar-paint)"
                : undefined
            }
            stroke={params.has("paint") ? "none" : undefined}
            fillOpacity={params.has("transparent") ? 0 : 0.25}
            hide={hide}
            dot
            label
          />
          <Chart.RadarSeries<(typeof initial)[number], number>
            dataKey={other}
            material={material}
            {...(params.has("invalid") ? {} : { seriesKey: "alias" })}
            fill="none"
            strokeDasharray="4 3"
          />
          <Chart.Tooltip content={content ? <Content /> : undefined} />
        </Chart.RadarChart>
      </Chart.Root>
      <Chart.Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        data-host="radial"
      >
        <Chart.Legend aria-label="Radial series" />
        <Chart.RadialBarChart
          ref={ref}
          data={data}
          width={width}
          height={360}
          animate={animate}
          innerRadius="22%"
          outerRadius="88%"
          {...(params.has("thin") ? { barSize: 2 } : {})}
          startAngle={shift ? 180 : 90}
          endAngle={shift ? 0 : -270}
          aria-label="Radial comparison"
        >
          <defs>
            <linearGradient id="polar-radial-paint">
              <stop stopColor="#df55a0" stopOpacity={0.2} />
              <stop offset="1" stopColor="#8346cc" stopOpacity={0.8} />
            </linearGradient>
            <filter id="radial-host-filter">
              <feOffset dx={0} dy={0} />
            </filter>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[params.has("signed") ? -100 : 0, domain]}
            tick={false}
          />
          <PolarRadiusAxis type="category" dataKey="category" tick />
          <Chart.RadialBarSeries<(typeof initial)[number], number | [number, number]>
            dataKey={params.has("radial-range") ? range : "value"}
            seriesKey="value"
            material={material}
            filter={nativeFilter ? "url(#radial-host-filter)" : undefined}
            activeShape={params.has("active-shape") ? Shape : undefined}
            style={params.has("style-filter") ? { filter: "none" } : undefined}
            fill={
              params.has("paint")
                ? params.has("solid")
                  ? "#df55a0"
                  : "url(#polar-radial-paint)"
                : undefined
            }
            fillOpacity={params.has("transparent") ? 0 : params.has("paint") ? 0.35 : 1}
            hide={hide}
            {...(params.has("stack") ? { stackId: "scores" } : {})}
            cornerRadius={4}
            background
            shape={custom ? Shape : params.has("boolean-shape") ? true : undefined}
            onClick={() => setClicks((n) => n + 1)}
          >
            {data.map((row) => (
              <Cell
                key={row.id}
                {...(!params.has("paint") && row.id === "quality" ? { fill: "#27806a" } : {})}
                data-category-id={row.id}
              />
            ))}
            <LabelList dataKey="value" position="insideEnd" />
          </Chart.RadialBarSeries>
          <Chart.RadialBarSeries<(typeof initial)[number], number | [number, number]>
            dataKey={other}
            material={material}
            {...(params.has("invalid") ? {} : { seriesKey: "alias" })}
            {...(params.has("stack") ? { stackId: "scores" } : {})}
            fillOpacity={0.55}
          />
          <Chart.Tooltip content={content ? <Content /> : undefined} />
        </Chart.RadialBarChart>
      </Chart.Root>
      <section data-host="native" style={{ display: "none" }}>
        <NativeRadarChart
          data={data}
          width={width}
          height={360}
          cx={shift ? "40%" : "50%"}
          startAngle={shift ? 0 : 90}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis domain={[params.has("signed") ? -100 : 0, domain]} />
          <NativeRadar<(typeof initial)[number], number | [number, number]>
            stroke={params.has("paint") ? "none" : "#3161bd"}
            dataKey={params.has("range") ? range : "value"}
            isRange={params.has("range")}
            isAnimationActive={false}
          />
          <NativeRadar dataKey={other} isAnimationActive={false} />
        </NativeRadarChart>
        <NativeRadialBarChart
          data={data}
          width={width}
          height={360}
          innerRadius="22%"
          outerRadius="88%"
          {...(params.has("thin") ? { barSize: 2 } : {})}
          startAngle={shift ? 180 : 90}
          endAngle={shift ? 0 : -270}
        >
          <PolarAngleAxis
            type="number"
            domain={[params.has("signed") ? -100 : 0, domain]}
            tick={false}
          />
          <PolarRadiusAxis type="category" dataKey="category" tick />
          <NativeRadialBar<(typeof initial)[number], number | [number, number]>
            dataKey={params.has("radial-range") ? range : "value"}
            {...(params.has("stack") ? { stackId: "scores" } : {})}
            cornerRadius={4}
            isAnimationActive={false}
          />
          <NativeRadialBar<(typeof initial)[number], number | [number, number]>
            dataKey={other}
            {...(params.has("stack") ? { stackId: "scores" } : {})}
            isAnimationActive={false}
          />
        </NativeRadialBarChart>
      </section>
    </main>
  );
}

// Strict packed declarations preserve polar layouts, callbacks and generic data keys.
const radarProps: Chart.RadarChartProps<(typeof initial)[number]> = {
  layout: "centric",
  animate: { revealDurationMs: 400 },
  data: initial,
};
const radialProps: Chart.RadialBarChartProps = { layout: "radial", animate: true };
void radarProps;
void radialProps;
// @ts-expect-error Polar layouts cannot be Cartesian.
const badLayout: Chart.RadarChartProps = { layout: "horizontal" };
// @ts-expect-error Motion owns engine animation.
const badAnimation: Chart.RadarSeriesProps = { isAnimationActive: true };
// @ts-expect-error Motion owns engine animation.
const badRadialAnimation: Chart.RadialBarSeriesProps = { isAnimationActive: true };
void badLayout;
void badAnimation;
void badRadialAnimation;

const materialProof: Chart.PolarMaterial = "clay";
// @ts-expect-error Finish vocabulary is closed.
const invalidMaterial: Chart.RadialBarSeriesProps = { material: "metal" };
void materialProof;
void invalidMaterial;
