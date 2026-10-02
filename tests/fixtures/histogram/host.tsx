import * as Chart from "@kind-ui/charts";
import { useCallback, useState } from "react";
import { CartesianGrid, Cell, Rectangle, ReferenceLine } from "recharts";

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
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom shape
      </button>
      <output aria-label="Clicked">{clicked}</output>
      <Chart.Root
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
          <CartesianGrid strokeDasharray="3 3" />
          <ReferenceLine x={0} stroke="red" />
          <Chart.HistogramSeries
            fillOpacity={0.6}
            stroke="#183a36"
            strokeDasharray="2 2"
            onClick={() => setClicked((value) => value + 1)}
            shape={
              custom
                ? (props) => (
                    <Rectangle
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      fill={props.fill}
                      data-host-shape="yes"
                      data-lower={props.bin.lower}
                    />
                  )
                : undefined
            }
          >
            {bins.map((bin) => (
              <Cell
                key={bin.lower}
                fill={bin.lower === 0 ? "#be7150" : "#187c79"}
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
