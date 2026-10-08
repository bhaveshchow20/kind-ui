import * as Chart from "@kind-ui/charts";
import { CartesianGrid, Cell, Rectangle, ReferenceLine } from "@kind-ui/charts";
import { useCallback, useState } from "react";

const original: readonly Chart.HistogramBin[] = [
  { lower: -2, upper: 0, count: 2 },
  { lower: 0, upper: 1, count: 2 },
  { lower: 1, upper: 4, count: 6 },
  { lower: 5, upper: 6, count: 0 },
  { lower: 6, upper: 7, count: 2 },
];
export function HistogramHost() {
  const [measure, setMeasure] = useState<Chart.HistogramMeasure>("density");
  const [width, setWidth] = useState(480);
  const mode = new URLSearchParams(window.location.search).get("data");
  const initial =
    mode === "empty"
      ? []
      : mode === "zero"
        ? original.map((bin) => ({ ...bin, count: 0 }))
        : mode === "one"
          ? [{ lower: -2, upper: 7, count: 3 }]
          : original;
  const [bins, setBins] = useState<readonly Chart.HistogramBin[]>(initial);
  const [visible, setVisible] = useState(["count"]);
  const [clicked, setClicked] = useState(0);
  const [custom, setCustom] = useState(false);
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [override, setOverride] = useState("none");
  const [gradient, setGradient] = useState(false);
  const strokeMode = new URLSearchParams(window.location.search).get("stroke");
  const transparent = new URLSearchParams(window.location.search).has("transparent");
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.hostRef = "yes";
  }, []);
  return (
    <section aria-label="Packed histogram">
      <button type="button" onClick={() => setMeasure(measure === "count" ? "density" : "count")}>
        Measure
      </button>
      <button type="button" onClick={() => setWidth(width === 480 ? 240 : 480)}>
        Resize
      </button>
      <button
        type="button"
        onClick={() =>
          setBins(
            bins === original
              ? original.map((bin) => ({ ...bin, count: bin.count * 2 }))
              : original,
          )
        }
      >
        Update
      </button>
      <button type="button" onClick={() => setVisible(visible.length ? [] : ["count"])}>
        External visibility
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom shape
      </button>
      {(["plain", "clay", "glow"] as const).map((finish) => (
        <button type="button" key={finish} onClick={() => setMaterial(finish)}>
          {finish === "plain" ? "Default" : finish}
        </button>
      ))}
      {(["none", "series-filter", "series-style", "cell-filter", "cell-style"] as const).map(
        (value) => (
          <button type="button" key={value} onClick={() => setOverride(value)}>
            {value}
          </button>
        ),
      )}
      <button type="button" onClick={() => setGradient(!gradient)}>
        Gradient
      </button>
      {strokeMode === "css" && (
        <style>{'[data-kind-ui="histogram-bin"] { stroke-width: 32px; }'}</style>
      )}
      <output aria-label="Clicked">{clicked}</output>
      <Chart.Root
        interaction={{
          kind: "series",
          mode: "visibility",
          eligibleKeys: Object.keys({
            count: {
              label: measure === "count" ? "Samples" : "Density",
              color: "#187c79",
              formatValue: (value: number) => `${value} ${measure === "count" ? "samples" : "per ms"}`,
            },
          }),
        }}
        config={{
          count: {
            label: measure === "count" ? "Samples" : "Density",
            color: "#187c79",
            formatValue: (value) => `${value} ${measure === "count" ? "samples" : "per ms"}`,
          },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <Chart.HistogramChart
          ref={ref}
          bins={bins}
          measure={measure}
          width={width}
          height={260}
          animate={{ revealDurationMs: 10000 }}
          aria-label="Histogram proof"
          xAxisProps={{ label: { value: "Duration (ms)", position: "insideBottom", offset: -5 } }}
        >
          <defs>
            <filter id="histogram-host-filter">
              <feColorMatrix type="saturate" values="0.5" />
            </filter>
            <linearGradient id="histogram-host-gradient">
              <stop stopColor="#187c79" stopOpacity={0.2} />
              <stop offset="0.35" stopColor="#187c79" stopOpacity={0} />
              <stop offset="0.65" stopColor="#be7150" stopOpacity={0} />
              <stop offset="1" stopColor="#be7150" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <ReferenceLine x={0} stroke="red" />
          <Chart.HistogramSeries
            material={material}
            filter={override === "series-filter" ? "url(#histogram-host-filter)" : undefined}
            style={{
              ...(override === "series-style" ? { filter: "url(#histogram-host-filter)" } : {}),
              ...(strokeMode === "em" ? { fontSize: 16, strokeWidth: "2em" } : {}),
              ...(strokeMode === "var"
                ? { "--host-stroke": "32px", strokeWidth: "var(--host-stroke)" }
                : {}),
              ...(strokeMode === "percent" ? { strokeWidth: "5%" } : {}),
            }}
            fillOpacity={0.6}
            stroke="#183a36"
            strokeWidth={new URLSearchParams(window.location.search).has("wide-stroke") ? 24 : 1}
            strokeDasharray="2 2"
            onClick={() => setClicked((value) => value + 1)}
            shape={
              custom
                ? (props) => (
                    <g
                      data-host-numeric=""
                      data-value={props.value}
                      data-lower={props.bin.lower}
                      data-upper={props.bin.upper}
                      data-count={props.bin.count}
                    >
                      <Rectangle
                        x={props.x}
                        y={props.y}
                        width={props.width}
                        height={props.height}
                        fill={props.fill}
                        data-host-shape="yes"
                        data-lower={props.bin.lower}
                      />
                    </g>
                  )
                : undefined
            }
          >
            {bins.map((bin) => (
              <Cell
                key={bin.lower}
                {...(override === "cell-filter" && bin.lower === 0
                  ? { filter: "url(#histogram-host-filter)" }
                  : {})}
                {...(override === "cell-style" && bin.lower === 0
                  ? { style: { filter: "url(#histogram-host-filter)" } }
                  : {})}
                fill={
                  transparent
                    ? "transparent"
                    : gradient
                      ? "url(#histogram-host-gradient)"
                      : bin.lower === 0
                        ? "#be7150"
                        : "#187c79"
                }
                {...(transparent ? { stroke: "none" } : {})}
                fillOpacity={bin.lower === 0 ? 0.3 : 0.6}
              />
            ))}
          </Chart.HistogramSeries>
          <Chart.Tooltip
            shared={false}
            labelFormatter={(_label, entries) => {
              const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
              return bin ? `[${bin.lower}, ${bin.upper}${bin.upper === 7 ? "]" : ")"} ms` : "";
            }}
          />
        </Chart.HistogramChart>
      </Chart.Root>
      <table>
        <caption>
          Histogram data (ms);{" "}
          {measure === "count"
            ? "count height; area is not frequency"
            : "normalized density; area sums to one"}
        </caption>
        <thead>
          <tr>
            <th>Interval</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((bin) => (
            <tr key={bin.lower}>
              <th>
                [{bin.lower}, {bin.upper}
                {bin.upper === 7 ? "]" : ")"}
              </th>
              <td>{bin.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
const props: Chart.HistogramChartProps = { bins: [], measure: "density", width: 100, height: 100 };
void props;
// @ts-expect-error Explicit measure is required even for unequal bins.
const absentMeasure: Chart.HistogramChartProps = { bins: original };
const categorical: Chart.HistogramChartProps = {
  bins: original,
  measure: "count",
  // @ts-expect-error Histogram geometry cannot use a categorical domain.
  xAxisProps: { type: "category" },
};
// @ts-expect-error Stacking changes histogram meaning.
const stacked: Chart.HistogramSeriesProps = { stackId: "a" };
void absentMeasure;
void categorical;
void stacked;
