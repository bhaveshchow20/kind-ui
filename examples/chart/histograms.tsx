import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CartesianGrid, Rectangle, ReferenceLine } from "recharts";
import "@kind-ui/charts/styles.css";
import "./histograms.css";

const samples = [
  -9,
  -7,
  -5,
  -4,
  -3,
  -2,
  -2,
  -1,
  0,
  0,
  1,
  2,
  2,
  3,
  4,
  5,
  6,
  6,
  7,
  9,
  10,
  null,
  NaN,
  25,
];
const preBinned: readonly Chart.HistogramBin[] = [
  { lower: 0, upper: 10, count: 12 },
  { lower: 10, upper: 20, count: 24 },
  { lower: 20, upper: 50, count: 24 },
  { lower: 50, upper: 100, count: 0 },
];
function Distribution({
  bins,
  measure,
  unit,
  title,
  custom = false,
}: {
  bins: readonly Chart.HistogramBin[];
  measure: Chart.HistogramMeasure;
  unit: string;
  title: string;
  custom?: boolean;
}) {
  const [visible, setVisible] = useState(["count"]);
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const height = (bin: Chart.HistogramBin) =>
    measure === "count" ? bin.count : total ? bin.count / total / (bin.upper - bin.lower) : 0;
  const format = (value: number) =>
    measure === "count" ? `${value} samples` : `${value.toFixed(4)} per ${unit}`;
  return (
    <>
      <Chart.Root
        config={{
          count: {
            label: measure === "count" ? "Sample count" : "Probability density",
            color: "#167d77",
            formatValue: (value) => (typeof value === "number" ? format(value) : String(value)),
          },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <Chart.HistogramChart
          bins={bins}
          measure={measure}
          responsive
          style={{ width: "100%", height: 280 }}
          animate
          aria-label={title}
          xAxisProps={{
            tickFormatter: (value) => `${value}`,
            label: { value: unit, position: "insideBottom", offset: -5 },
          }}
          yAxisProps={{
            width: 62,
            tickFormatter: (value) => (measure === "count" ? `${value}` : Number(value).toFixed(3)),
          }}
          margin={{ top: 14, right: 14, left: 0, bottom: 18 }}
        >
          <CartesianGrid vertical={false} stroke="#dfe7e3" />
          {custom && <ReferenceLine x={20} stroke="#b66744" strokeDasharray="4 4" />}
          <Chart.HistogramSeries
            shape={
              custom
                ? (props) => (
                    <Rectangle
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      fill={props.bin.lower < 20 ? "#167d77" : "#b66744"}
                      stroke="#fff"
                      strokeWidth={1}
                      data-kind-ui="histogram-bin"
                    />
                  )
                : undefined
            }
          />
          <Chart.Tooltip
            shared={false}
            labelFormatter={(_label, entries) => {
              const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
              return bin
                ? `[${bin.lower}, ${bin.upper}${bin.upper === bins[bins.length - 1]?.upper ? "]" : ")"} ${unit} · ${bin.count} samples`
                : "";
            }}
          />
        </Chart.HistogramChart>
      </Chart.Root>
      <details>
        <summary>Data table · {total} samples</summary>
        <table>
          <caption>{title}; lower inclusive, upper exclusive except final interval</caption>
          <thead>
            <tr>
              <th>Interval ({unit})</th>
              <th>Count</th>
              <th>Height</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((bin, index) => (
              <tr key={bin.lower}>
                <th>
                  [{bin.lower}, {bin.upper}
                  {index === bins.length - 1 ? "]" : ")"}
                </th>
                <td>{bin.count}</td>
                <td>{format(height(bin))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
function App() {
  const [wide, setWide] = useState(false);
  const result = Chart.binHistogram(samples, wide ? [-10, 0, 10] : [-10, -5, 0, 5, 10]);
  return (
    <main>
      <header>
        <span className="eyebrow">KIND UI / DISTRIBUTIONS</span>
        <h1>Every interval matters.</h1>
        <p>Explicit boundaries. Honest counts. Quantitative widths.</p>
      </header>
      <div className="recipe-grid">
        <article>
          <span className="eyebrow">01 / RAW SAMPLES</span>
          <h2>Rebin, without losing the audit</h2>
          <p>
            Signed temperature offsets use equal-width intervals. Count height shows observations;
            zero stays zero.
          </p>
          <button type="button" onClick={() => setWide(!wide)}>
            Use {wide ? "four" : "two"} bins
          </button>
          <Distribution bins={result.bins} measure="count" unit="°C" title="Temperature offsets" />
          <p className="audit">
            {result.accepted} accepted · {result.missing} missing · {result.nonfinite} nonfinite ·{" "}
            {result.outOfRange} out of range
          </p>
        </article>
        <article>
          <span className="eyebrow">02 / PRE-BINNED + NATIVE EXTENSIONS</span>
          <h2>Unequal widths, equal evidence</h2>
          <p>
            Response times arrive aggregated. Density = count ÷ total ÷ width, so rectangle areas
            sum to one. The 20–50 ms bin is wider and lower than 10–20 ms despite equal counts.
          </p>
          <Distribution
            bins={preBinned}
            measure="density"
            unit="ms"
            title="Response time distribution"
            custom
          />
          <p className="audit">60 samples · density in ms⁻¹ · empty 50–100 ms interval retained</p>
        </article>
      </div>
      <footer>
        Keyboard: Tab to each chart, then use arrow keys. Tables include every interval, including
        zero counts. The chart follows reduced-motion preferences.
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
