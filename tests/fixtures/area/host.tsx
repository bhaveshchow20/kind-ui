// Host-only fixture: chart data, controls and engine extensions. No chart implementation.
import * as Static from "@kind-ui/charts";
import {
  AreaRevealShape,
  type AreaRevealShapeProps,
  CartesianGrid,
  type DotProps,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { type CSSProperties, useCallback, useState } from "react";

const data = [
  { time: "A", value: 5, other: 8 },
  { time: "B", value: null, other: 6 },
  { time: "C", value: 0, other: 4 },
  { time: "D", value: 7, other: 2 },
];
const nativeVisibilityData = data.map((point) => ({ ...point, other: point.other * 20 }));
const otherValue = (point: { other: number }) => point.other;
function Mark({ cx, cy }: DotProps) {
  if (cx == null || cy == null) return null;
  return <circle data-host-mark="" cx={cx} cy={cy} r={4} fill="purple" />;
}
function Shape(props: AreaRevealShapeProps) {
  return (
    <g data-host-shape="">
      <AreaRevealShape {...props} />
    </g>
  );
}
function Content({
  label,
  payload,
}: {
  label?: string | number;
  payload?: readonly { value?: unknown }[];
}) {
  const [count, setCount] = useState(0);
  return (
    <div data-host-content="" style={{ height: 260 }}>
      <button type="button" onClick={() => setCount(count + 1)}>
        Content count {count}
      </button>
      Custom {label}: {String(payload?.[0]?.value)}
    </div>
  );
}
export function AreaHost({
  chartProps,
  nativeVisibility = false,
}: {
  chartProps?: Static.AreaChartProps;
  nativeVisibility?: boolean;
}) {
  const { AreaChart, AreaSeries, Tooltip } = Static;
  const [material, setMaterial] = useState<Static.AreaMaterial>("plain");
  const [overshoot, setOvershoot] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [percent, setPercent] = useState(false);
  const [visible, setVisible] = useState(["value", "other", "alias"]);
  const [renamed, setRenamed] = useState(false);
  const [custom, setCustom] = useState(false);
  const [small, setSmall] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [entered, setEntered] = useState(0);
  const [left, setLeft] = useState(0);
  const [clicked, setClicked] = useState(0);
  const [show, setShow] = useState(true);
  const [seriesData, setSeriesData] = useState(false);
  const [nativeHide, setNativeHide] = useState(false);
  const sourceData = overshoot
    ? data.map((point, i) => ({ ...point, other: i === 0 || i === 3 ? 8 : 0 }))
    : nativeVisibility
      ? nativeVisibilityData
      : data;
  const rows = updated
    ? sourceData.map((point) => ({
        ...point,
        value: point.value == null ? null : point.value + 10,
      }))
    : sourceData;
  const chartRef = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.refTag = node.tagName;
    return () => {
      document.body.dataset.chartRefCleanup = "yes";
    };
  }, []);
  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.dataset.refTag = node.tagName;
      document.body.dataset.tooltipAttachments = String(
        Number(document.body.dataset.tooltipAttachments ?? 0) + 1,
      );
    }
    return () => {
      document.body.dataset.tooltipCleanups = String(
        Number(document.body.dataset.tooltipCleanups ?? 0) + 1,
      );
    };
  }, []);
  return (
    <section aria-label="Packed areas">
      <label>
        <input
          type="checkbox"
          checked={overshoot}
          onChange={(e) => setOvershoot(e.target.checked)}
        />
        Overshoot
      </label>
      <label>
        <input type="checkbox" checked={vertical} onChange={(e) => setVertical(e.target.checked)} />
        Vertical
      </label>
      <label>
        Material
        <select
          aria-label="Material"
          value={material}
          onChange={(e) => setMaterial(e.target.value as Static.AreaMaterial)}
        >
          {(["plain", "paper", "clay", "glow"] as const).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={filtered} onChange={(e) => setFiltered(e.target.checked)} />
        Native filter
      </label>
      <label>
        <input type="checkbox" checked={stacked} onChange={(e) => setStacked(e.target.checked)} />
        Stack
      </label>
      <label>
        <input type="checkbox" checked={percent} onChange={(e) => setPercent(e.target.checked)} />
        Percent
      </label>
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom content
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update
      </button>
      <button type="button" onClick={() => setShow(!show)}>
        Unmount chart
      </button>
      <button type="button" onClick={() => setRenamed(!renamed)}>
        Rename series
      </button>
      <label>
        <input
          type="checkbox"
          checked={seriesData}
          onChange={(e) => setSeriesData(e.target.checked)}
        />
        Series data
      </label>
      {nativeVisibility && (
        <label>
          <input
            type="checkbox"
            checked={nativeHide}
            onChange={(e) => setNativeHide(e.target.checked)}
          />
          Native hide other
        </label>
      )}
      <div role="note" aria-label="Events">
        {entered}/{left}/{clicked}
      </div>
      <Static.Root
        config={{
          value: { label: "Value", color: "#345", formatValue: (v) => `${v} units` },
          other: { label: "Other", color: "#678" },
          alias: { label: "Renamed", color: "#678" },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Static.Legend />
        {show && (
          <AreaChart
            {...chartProps}
            layout={vertical ? "vertical" : "horizontal"}
            width={small ? 160 : 440}
            height={220}
            stackOffset={percent ? "expand" : "none"}
            {...(!seriesData ? { data: rows } : {})}
            aria-label="Packed chart"
            ref={chartRef}
            onMouseMove={() => setEntered((n) => n + 1)}
            onMouseLeave={() => setLeft((n) => n + 1)}
          >
            <defs>
              <filter id="host-filter">
                <feGaussianBlur stdDeviation={0.3} />
              </filter>
              <linearGradient id="packed-gradient">
                <stop stopColor="purple" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis {...(vertical ? { type: "number" as const } : { dataKey: "time" })} />
            <YAxis
              width={32}
              {...(vertical ? { type: "category" as const, dataKey: "time" } : {})}
            />
            <ReferenceLine y={3} />
            <Tooltip
              maxWidth={180}
              {...(custom ? { content: <Content /> } : {})}
              ref={tooltipRef}
              frameProps={{
                "aria-label": "Bounded tooltip",
                onMouseDown: () => setClicked((n) => n + 1),
              }}
            />
            <AreaSeries
              {...(seriesData ? { data: rows } : {})}
              material={material}
              dataKey="value"
              stackId={stacked ? "values" : undefined}
              connectNulls={false}
              fill="url(#packed-gradient)"
              type="monotone"
              dot={<Mark />}
              shape={Shape}
              onClick={() => setClicked((n) => n + 1)}
            >
              <LabelList dataKey="value" pointerEvents="none" />
            </AreaSeries>
            <AreaSeries
              {...(seriesData ? { data: rows } : {})}
              material={material}
              {...(filtered ? { filter: "url(#host-filter)" } : {})}
              id=""
              type={overshoot ? "natural" : "linear"}
              dataKey={otherValue}
              stackId={stacked ? "values" : undefined}
              hide={nativeHide}
              seriesKey={renamed ? "alias" : "other"}
              stroke="#678"
              name="Engine other"
              dot={{ r: 4 }}
            />
          </AreaChart>
        )}
      </Static.Root>
    </section>
  );
}

// @ts-expect-error Motion owns animation; the engine animation switch is excluded.
void (<Static.AreaSeries dataKey="value" isAnimationActive={true} />);

/** Isolated public paint consumer: transparent SVG makes output alpha testable. */
export function AreaPaintHost() {
  return (
    <>
      {(["solid", "gradient"] as const).map((paint) =>
        (["plain", "clay"] as const).map((material) => (
          <Static.Root
            key={`${paint}-${material}`}
            config={{ value: { label: "Value", color: "#db7093" } }}
          >
            <Static.AreaChart
              width={160}
              height={120}
              data={[{ value: 9 }, { value: 9 }, { value: 9 }]}
              aria-label={`${paint}-${material}`}
              animate={false}
            >
              <defs>
                <linearGradient id={`${paint}-${material}-paint`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#db7093" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#db7093" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <YAxis hide domain={[0, 10]} />
              <Static.AreaSeries
                dataKey="value"
                material={material}
                stroke="none"
                fill={paint === "solid" ? "#db7093" : `url(#${paint}-${material}-paint)`}
                fillOpacity={paint === "solid" ? 0.35 : 1}
              />
            </Static.AreaChart>
          </Static.Root>
        )),
      )}
    </>
  );
}

const areaPatternRows = [
  { category: "A", first: 8, second: 4 },
  { category: "B", first: -5, second: -2 },
];

export function AreaPatternHost({ horizontal = false }: { horizontal?: boolean }) {
  const [kind, setKind] = useState<Static.FillPattern["kind"]>("dots");
  const [stacked, setStacked] = useState(false);
  const [override, setOverride] = useState("none");
  const [material, setMaterial] = useState<Static.AreaMaterial>("plain");
  const [gradient, setGradient] = useState(false);
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  return (
    <section
      style={
        {
          colorScheme: dark ? "dark" : "light",
          background: "Canvas",
          color: "CanvasText",
          "--area-secondary": dark ? "#ff9acd" : "#ed79ae",
        } as CSSProperties
      }
    >
      {(["dots", "lines", "hatch"] as const).map((value) => (
        <button type="button" key={value} onClick={() => setKind(value)}>
          {value}
        </button>
      ))}
      <button type="button" onClick={() => setStacked(!stacked)}>
        Stack
      </button>
      <button type="button" onClick={() => setGradient(!gradient)}>
        Gradient
      </button>
      <button type="button" onClick={() => setDark(!dark)}>
        Theme
      </button>
      <button type="button" onClick={() => setMaterial(material === "plain" ? "clay" : "plain")}>
        Material
      </button>
      <label>
        Override
        <select value={override} onChange={(event) => setOverride(event.target.value)}>
          {["none", "fill", "style", "shape", "stroke", "off"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {[0, 1].map((chart) => (
        <Static.Root
          key={chart}
          config={{
            first: {
              color: gradient
                ? { light: ["#ff0000", "#0000ff"], dark: ["#ffffff", "#000000"] }
                : "#789abc",
              pattern: { kind },
            },
            second: { color: "var(--area-secondary)", pattern: { kind: "lines" } },
          }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Static.Legend>
            {chart === 1
              ? (item) => (
                  <>
                    {item.key === "second" ? (
                      <Static.FillPatternSwatch
                        pattern={{ kind: "hatch", color: "CanvasText" }}
                        color="var(--color-second)"
                      />
                    ) : (
                      item.marker
                    )}
                    {item.label}
                  </>
                )
              : undefined}
          </Static.Legend>
          <Static.AreaChart
            width={360}
            height={220}
            data={areaPatternRows}
            layout={horizontal ? "vertical" : "horizontal"}
          >
            <defs>
              <linearGradient id={`host-gradient-${chart}`}>
                <stop stopColor="red" />
                <stop offset="1" stopColor="blue" />
              </linearGradient>
            </defs>
            <Static.XAxis
              dataKey={horizontal ? undefined : "category"}
              type={horizontal ? "number" : "category"}
            />
            <Static.YAxis
              dataKey={horizontal ? "category" : undefined}
              type={horizontal ? "category" : "number"}
            />
            <Static.AreaSeries
              dataKey="first"
              stackId={stacked ? "total" : undefined}
              material={material}
              fillOpacity={0.4}
              stroke={override === "stroke" ? "#123456" : undefined}
              fill={override === "fill" ? `url(#host-gradient-${chart})` : undefined}
              style={override === "style" ? { fill: "#123456" } : undefined}
              shape={
                override === "shape" ? <Static.AreaRevealShape data-host-shape="" /> : undefined
              }
              pattern={override === "off" ? "none" : undefined}
            />
            <Static.AreaSeries
              dataKey="second"
              pattern={{ kind: "hatch", color: "CanvasText" }}
              stackId={stacked ? "total" : undefined}
            />
          </Static.AreaChart>
        </Static.Root>
      ))}
    </section>
  );
}
