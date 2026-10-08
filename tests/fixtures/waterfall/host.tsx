// Host composition only: all Waterfall behavior comes from the installed tarball.
import * as Chart from "@kind-ui/charts";
import {
  Cell,
  LabelList,
  Rectangle,
  ReferenceLine,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useMemo, useState } from "react";

const entries: Chart.WaterfallEntry[] = [
  { id: "a", label: "Opening", kind: "start", value: 80 },
  { id: "b", label: "Gain", kind: "delta", value: 50 },
  { id: "c", label: "Loss", kind: "delta", value: -160 },
  { id: "d", label: "Subtotal", kind: "subtotal" },
  { id: "e", label: "Zero", kind: "delta", value: 0 },
  { id: "f", label: "Recovery", kind: "delta", value: 70 },
  { id: "g", label: "Closing", kind: "end", value: 40 },
];
function Probe({ data, horizontal }: { data: Chart.WaterfallDatum[]; horizontal: boolean }) {
  const x = useXAxisScale("x");
  const y = useYAxisScale("y");
  const scale = horizontal ? x : y;
  return (
    <g
      data-probe={JSON.stringify(
        data.map((row) => ({
          ...row,
          first: row.start === null ? null : scale?.(row.start),
          last: row.end === null ? null : scale?.(row.end),
        })),
      )}
    />
  );
}
export function WaterfallHost() {
  const [mode, setMode] = useState("mixed");
  const [updated, setUpdated] = useState(false);
  const [visible, setVisible] = useState(true);
  const [hide, setHide] = useState(false);
  const [horizontal, setHorizontal] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [small, setSmall] = useState(false);
  const [custom, setCustom] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [clicks, setClicks] = useState(0);
  const data = useMemo(
    () =>
      Chart.computeWaterfallData(
        entries.map((row) => {
          if (row.kind === "subtotal") return row;
          if (mode === "zero") return { ...row, value: 0 };
          if (mode === "negative")
            return { ...row, value: row.value === null ? null : -Math.abs(row.value) };
          if (mode === "positive")
            return { ...row, value: row.value === null ? null : Math.abs(row.value) };
          if (mode === "missing" && row.id === "c") return { ...row, value: null };
          if (updated && row.id === "b") return { ...row, value: 100 };
          if (updated && row.id === "g") return { ...row, value: 90 };
          return row;
        }),
      ),
    [mode, updated],
  );
  const displayed =
    mode === "ids"
      ? data.map((row, index) => ({
          ...row,
          id: ["a/b", "c", "a", "b/c", "e", "f", "g"][index] ?? row.id,
        }))
      : data;
  return (
    <section style={{ width: small ? 240 : 640, maxWidth: "100%" }}>
      <label>
        Values
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          {["mixed", "positive", "negative", "zero", "missing", "ids"].map((mode) => (
            <option key={mode}>{mode}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update
      </button>
      <button type="button" onClick={() => setVisible(!visible)}>
        Visibility
      </button>
      <button type="button" onClick={() => setHide(!hide)}>
        Native hide
      </button>
      <button type="button" onClick={() => setHorizontal(!horizontal)}>
        Orientation
      </button>
      <button type="button" onClick={() => setReversed(!reversed)}>
        Reverse
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Extensions
      </button>
      <button type="button" onClick={() => setAnimate(!animate)}>
        Motion
      </button>
      {(["plain", "clay", "glow"] as const).map((value) => (
        <button type="button" key={value} onClick={() => setMaterial(value)}>
          {value === "plain" ? "Default" : value}
        </button>
      ))}
      <output aria-label="Clicks">{clicks}</output>
      <Chart.Root
        interaction={{
          kind: "series",
          mode: "visibility",
          eligibleKeys: Object.keys({ bridge: { label: "Bridge", color: "#3478ae" } }),
        }}
        config={{ bridge: { label: "Bridge", color: "#3478ae" } }}
        visibleSeries={visible ? ["bridge"] : []}
      >
        <Chart.WaterfallChart
          width={small ? 240 : 640}
          height={300}
          data={displayed}
          animate={animate}
          layout={horizontal ? "vertical" : "horizontal"}
          aria-label="Packed Waterfall"
          ref={(node) => {
            if (node) node.dataset.nativeRef = "svg";
          }}
        >
          <XAxis
            xAxisId="x"
            reversed={reversed}
            {...(horizontal
              ? { type: "number", domain: ["auto", "auto"] }
              : { dataKey: "id", type: "category" })}
          />
          <YAxis
            yAxisId="y"
            {...(horizontal
              ? { dataKey: "id", type: "category" }
              : { type: "number", domain: ["auto", "auto"] })}
          />
          <Chart.WaterfallConnectors
            data={displayed}
            seriesKey="bridge"
            hide={hide}
            xAxisId="x"
            yAxisId="y"
          />
          <ReferenceLine
            xAxisId="x"
            yAxisId="y"
            {...(horizontal ? { x: 0 } : { y: 0 })}
            stroke="#777"
          />
          <Chart.WaterfallSeries
            seriesKey="bridge"
            hide={hide}
            xAxisId="x"
            yAxisId="y"
            material={material}
            onClick={() => setClicks((n) => n + 1)}
            {...(custom
              ? {
                  shape: (props) => (
                    <Rectangle
                      data-host-shape=""
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      fill={props.fill}
                      radius={0}
                    />
                  ),
                }
              : {})}
          >
            {displayed.map((row) => (
              <Cell
                key={row.id}
                fill={row.kind === "delta" && (row.value ?? 0) < 0 ? "#b54d46" : "#3478ae"}
              />
            ))}
            {custom && <LabelList dataKey="value" position="top" />}
          </Chart.WaterfallSeries>
          <Probe data={displayed} horizontal={horizontal} />
          <Chart.Tooltip
            axisId={horizontal ? "y" : "x"}
            filterNull={false}
            content={(tip) => {
              const row = displayed.find((row) => row.id === String(tip.label));
              return tip.active && row && visible && !hide ? (
                <div role="status">
                  {row.label}: {row.value ?? "Unknown"}; balance {row.balance ?? "Unknown"}
                </div>
              ) : null;
            }}
          />
        </Chart.WaterfallChart>
      </Chart.Root>
    </section>
  );
}
// Invalid geometry controls stay excluded from the public API.
// @ts-expect-error Stacks fabricate range geometry.
void (<Chart.WaterfallSeries stackId="offset" />);
// @ts-expect-error Nonzero minimum sizes fabricate zero geometry.
void (<Chart.WaterfallSeries minPointSize={5} />);
// @ts-expect-error Waterfall binds the numeric range key.
void (<Chart.WaterfallSeries dataKey="value" />);
