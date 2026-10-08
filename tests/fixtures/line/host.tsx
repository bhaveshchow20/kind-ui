// Host-only fixture: chart data, controls and engine extensions. No chart implementation.
import * as Static from "@kind-ui/charts";
import {
  CartesianGrid,
  Curve,
  type DotProps,
  LabelList,
  type LineDrawShapeProps,
  ReferenceLine,
  ResponsiveContainer,
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
function Shape({
  animationElapsedTime: _time,
  isAnimating: _active,
  isEntrance: _entrance,
  visibleLength: _length,
  ...props
}: LineDrawShapeProps) {
  return <Curve {...props} className="recharts-line-curve host-shape" />;
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
export function LineHost({
  chartProps,
  nativeVisibility = false,
}: {
  chartProps?: Static.LineChartProps;
  nativeVisibility?: boolean;
}) {
  const { LineChart, LineSeries, Tooltip } = Static;
  const [visible, setVisible] = useState(["value", "other", "alias"]);
  const [visibilityCallbacks, setVisibilityCallbacks] = useState(0);
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
  const sourceData = nativeVisibility ? nativeVisibilityData : data;
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
    <section aria-label="Packed lines">
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
      <button
        type="button"
        onClick={() => setVisible(visible.length ? [] : ["value", "other", "alias"])}
      >
        External visibility
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
      <span
        data-native-visibility={visible.join(",")}
        data-visibility-callbacks={visibilityCallbacks}
      />
      <Static.Root
        interaction={{
          kind: "series",
          mode: "visibility",
          eligibleKeys: ["value", "other", "alias"],
        }}
        config={{
          value: { label: "Value", color: "#345", formatValue: (v) => `${v} units` },
          other: { label: "Other", color: "#678" },
          alias: { label: "Renamed", color: "#678" },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={(next) => {
          setVisible(next);
          setVisibilityCallbacks((n) => n + 1);
        }}
      >
        <Static.Legend />
        {show && (
          <LineChart
            {...chartProps}
            width={small ? 160 : 440}
            height={220}
            {...(!seriesData ? { data: rows } : {})}
            aria-label="Packed chart"
            ref={chartRef}
            onMouseMove={() => setEntered((n) => n + 1)}
            onMouseLeave={() => setLeft((n) => n + 1)}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="time" />
            <YAxis width={32} />
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
            <LineSeries
              {...(seriesData ? { data: rows } : {})}
              dataKey="value"
              type="monotone"
              dot={<Mark />}
              shape={Shape}
              onClick={() => setClicked((n) => n + 1)}
            >
              <LabelList dataKey="value" />
            </LineSeries>
            <LineSeries
              {...(seriesData ? { data: rows } : {})}
              id=""
              dataKey={otherValue}
              hide={nativeHide}
              seriesKey={renamed ? "alias" : "other"}
              stroke="#678"
              name="Engine other"
              dot={{ r: 4 }}
            />
          </LineChart>
        )}
      </Static.Root>
    </section>
  );
}

// Packed public material proof, intentionally a small host fixture rather than a recipe.
export function MaterialsHost({ chartProps }: { chartProps?: Static.LineChartProps }) {
  const [palette, setPalette] = useState(false);
  const [custom, setCustom] = useState(false);
  const [flat, setFlat] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [native, setNative] = useState(false);
  const [equalWidth, setEqualWidth] = useState(false);
  const [gaps, setGaps] = useState(false);
  const [filter, setFilter] = useState(false);
  const [dots, setDots] = useState(false);
  const [cssPaint, setCssPaint] = useState(false);
  const [gradient, setGradient] = useState(false);
  const points = flat
    ? [
        { time: "A", value: 4, other: 6 },
        { time: "B", value: 4, other: 6 },
      ]
    : [
        { time: "A", value: 3, other: 7 },
        { time: "B", value: 6, other: 5 },
        { time: "C", value: 4, other: 8 },
        { time: "D", value: 8, other: 3 },
        { time: "E", value: 5, other: 6 },
      ];
  return (
    <main style={{ fontFamily: "system-ui", padding: 16, background: "#faf9f6", color: "#27272a" }}>
      <button type="button" onClick={() => setPalette(!palette)}>
        Palette
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom color
      </button>
      <button type="button" onClick={() => setFlat(!flat)}>
        Flat
      </button>
      <button type="button" onClick={() => setHidden(!hidden)}>
        Hide
      </button>
      <button type="button" onClick={() => setNative(!native)}>
        Native shape
      </button>
      <button type="button" onClick={() => setDots(!dots)}>
        Dots
      </button>
      <button type="button" onClick={() => setFilter(!filter)}>
        Native filter
      </button>
      <button type="button" onClick={() => setGaps(!gaps)}>
        Gaps
      </button>
      <button type="button" onClick={() => setEqualWidth(!equalWidth)}>
        Equal width
      </button>
      <button type="button" onClick={() => setCssPaint(!cssPaint)}>
        CSS paint
      </button>
      <button type="button" onClick={() => setGradient(!gradient)}>
        Gradient
      </button>
      {(["plain", "clay", "glow"] satisfies Static.LineMaterial[]).map((material) => (
        <section
          key={material}
          aria-label={material}
          style={{ width: "min(560px, 100%)", marginTop: 20 }}
        >
          <h2 style={{ fontSize: 14, margin: "0 0 8px" }}>{material}</h2>
          <Static.Root
            config={{
              value: {
                label: "Completed",
                color: custom ? "var(--host-series)" : palette ? "#9e503b" : "#242424",
              },
              other: { label: "Planned", color: palette ? "#427768" : "#727272" },
            }}
            visibleSeries={hidden ? [] : ["value", "other"]}
            style={{ "--host-series": "#6b45b3" } as CSSProperties}
          >
            <Static.Legend />
            <ResponsiveContainer width="100%" height={180}>
              <Static.LineChart
                {...chartProps}
                data={
                  gaps
                    ? points.map((p, index) => ({
                        ...p,
                        value: index === 1 ? null : index === 2 ? 0 : p.value,
                      }))
                    : points
                }
                margin={{ top: 14, right: 14, bottom: 8, left: 4 }}
                aria-label={`${material} chart`}
              >
                <defs>
                  <linearGradient id={`${material}-proof-gradient`}>
                    <stop offset="0%" stopColor="#9e503b" />
                    <stop offset="100%" stopColor="#427768" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e0db" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 10]}
                  allowDataOverflow
                  width={24}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Static.LineSeries
                  dataKey="value"
                  style={cssPaint ? { stroke: "#6b45b3" } : undefined}
                  {...(gradient ? { stroke: `url(#${material}-proof-gradient)` } : {})}
                  type="monotone"
                  material={material}
                  {...(equalWidth ? { strokeWidth: 6 } : {})}
                  dot={dots}
                  {...(native ? { shape: Shape } : {})}
                  {...(filter ? { filter: "none" } : {})}
                />
                <Static.LineSeries
                  dataKey="other"
                  type="monotone"
                  material={material}
                  {...(equalWidth ? { strokeWidth: 6 } : {})}
                  dot={false}
                  strokeDasharray="7 5"
                />
                <Static.Tooltip />
              </Static.LineChart>
            </ResponsiveContainer>
          </Static.Root>
        </section>
      ))}
    </main>
  );
}
