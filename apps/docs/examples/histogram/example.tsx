"use client";

import * as Chart from "@kind-ui/charts";
import { useId } from "react";
import { CartesianGrid } from "recharts";
import { type CommonSettings, Controls, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";

export type ExampleSettings = CommonSettings & {
  material: "plain" | "paper";
  dataset: "samples" | "response-times";
  wide: boolean;
};

const samples: readonly (number | null)[] = [
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

function interval(bin: Chart.HistogramBin, final: boolean) {
  return `[${bin.lower}, ${bin.upper}${final ? "]" : ")"}`;
}

function sampleStatus(sample: number | null, bins: readonly Chart.HistogramBin[]) {
  if (sample === null) return "Missing";
  if (!Number.isFinite(sample)) return "Nonfinite";
  const lower = bins[0]?.lower;
  const upper = bins[bins.length - 1]?.upper;
  return lower !== undefined && upper !== undefined && sample >= lower && sample <= upper
    ? "Accepted"
    : "Out of range";
}

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const help = useId();
  const result = Chart.binHistogram(samples, s.wide ? [-10, 0, 10] : [-10, -5, 0, 5, 10]);
  const raw = s.dataset === "samples";
  const bins = raw ? result.bins : preBinned;
  const measure: Chart.HistogramMeasure = raw ? "count" : "density";
  const unit = raw ? "°C" : "ms";
  const title = raw ? "Temperature offsets" : "Response time distribution";
  const total = bins.reduce((sum, bin) => sum + bin.count, 0);
  const height = (bin: Chart.HistogramBin) =>
    measure === "count" ? bin.count : total === 0 ? 0 : bin.count / total / (bin.upper - bin.lower);
  const formatHeight = (value: number) =>
    measure === "count" ? `${value} samples` : `${value.toFixed(4)} ms⁻¹`;

  return (
    <section className="chart-example">
      <h2>Histogram with explicit intervals</h2>
      <p id={help}>
        {raw
          ? "Equal-width temperature intervals use count height. The final interval includes its upper edge; missing, nonfinite and out-of-range inputs are counted separately."
          : "Response-time intervals have unequal widths. Density is count divided by total count and interval width, so rectangle areas sum to one. The empty final interval remains in the data."}
      </p>
      <Controls settings={s} onChange={set} />
      <div className="chart-controls">
        <label>
          Material{" "}
          <select
            value={s.material}
            onChange={(event) => {
              const material = event.currentTarget.value;
              if (material === "plain" || material === "paper") set({ ...s, material });
            }}
          >
            <option value="plain">Plain</option>
            <option value="paper">Paper</option>
          </select>
        </label>
        <label>
          Distribution{" "}
          <select
            value={s.dataset}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (value === "samples" || value === "response-times") set({ ...s, dataset: value });
            }}
          >
            <option value="samples">Temperature offsets · count</option>
            <option value="response-times">Response times · density</option>
          </select>
        </label>
        {raw && (
          <label>
            <input
              type="checkbox"
              checked={s.wide}
              onChange={(event) => set({ ...s, wide: event.currentTarget.checked })}
            />{" "}
            Use two wider intervals
          </label>
        )}
      </div>
      <Chart.Root
        emphasis={s.emphasis}
        config={{
          count: {
            label: raw ? "Sample count" : "Probability density",
            color: "#167d77",
            formatValue: (value) =>
              typeof value === "number" ? formatHeight(value) : String(value),
          },
        }}
      >
        <Chart.HistogramChart
          key={s.animate ? "entrance" : "still"}
          bins={bins}
          measure={measure}
          responsive
          style={{ width: "100%", height: 300 }}
          animate={s.animate}
          accessibilityLayer
          aria-label={title}
          aria-describedby={help}
          margin={{ top: 18, right: 16, left: 4, bottom: 26 }}
          xAxisProps={{
            tickFormatter: (value) => String(value),
            tickLine: false,
            label: { value: unit, position: "insideBottom", offset: -10 },
          }}
          yAxisProps={{
            width: 66,
            tickLine: false,
            tickFormatter: (value) => (raw ? String(value) : Number(value).toFixed(3)),
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--border, #dfe7e3)" />
          <Chart.HistogramSeries material={s.material} fill="#167d77" />
          <Chart.Tooltip
            shared={false}
            labelFormatter={(_label, entries) => {
              const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
              return bin
                ? `${interval(bin, bin.upper === bins[bins.length - 1]?.upper)} ${unit} · ${bin.count} samples`
                : "";
            }}
          />
        </Chart.HistogramChart>
      </Chart.Root>
      <p>
        {raw
          ? `${result.accepted} accepted · ${result.missing} missing · ${result.nonfinite} nonfinite · ${result.outOfRange} out of range`
          : `${total} samples · density in ms⁻¹`}
      </p>
      <details>
        <summary>View data</summary>
        <div style={{ overflowX: "auto" }}>
          <table>
            <caption>{title} · lower inclusive, upper exclusive except the final interval</caption>
            <thead>
              <tr>
                <th scope="col">Interval ({unit})</th>
                <th scope="col">Count</th>
                <th scope="col">{raw ? "Count height" : "Density (ms⁻¹)"}</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin, index) => (
                <tr key={bin.lower}>
                  <th scope="row">{interval(bin, index === bins.length - 1)}</th>
                  <td>{bin.count}</td>
                  <td>{raw ? height(bin) : height(bin).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {raw && (
            <table>
              <caption>Every supplied temperature sample and its aggregation status</caption>
              <thead>
                <tr>
                  <th scope="col">Observation</th>
                  <th scope="col">Offset (°C)</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Immutable observations have fixed input order; duplicates and missing values need their own rows.
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>{sample === null ? "Missing" : String(sample)}</td>
                    <td>{sampleStatus(sample, result.bins)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>
    </section>
  );
}
