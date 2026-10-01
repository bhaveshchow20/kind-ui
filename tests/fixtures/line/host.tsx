// Host-only fixture: chart data, controls and engine extensions. No chart implementation.
import * as Static from "@kind-ui/charts";
import { useCallback, useState } from "react";
import type { DotProps, LineDrawShapeProps } from "recharts";
import { CartesianGrid, Curve, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";

const data = [
  { time: "A", value: 5, other: 8 },
  { time: "B", value: null, other: 6 },
  { time: "C", value: 0, other: 4 },
  { time: "D", value: 7, other: 2 },
];
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
export function LineHost({ chartProps }: { chartProps?: Static.LineChartProps }) {
  const { LineChart, LineSeries, Tooltip } = Static;
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
  const rows = updated
    ? data.map((point) => ({ ...point, value: point.value == null ? null : point.value + 10 }))
    : data;
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
