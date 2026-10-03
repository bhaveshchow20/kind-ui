"use client";
import * as Chart from "@kind-ui/charts";
import { CartesianGrid } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & { material: "plain" | "paper" };
const bins: readonly Chart.HistogramBin[] = [
  { lower: 0, upper: 10, count: 12 },
  { lower: 10, upper: 20, count: 24 },
  { lower: 20, upper: 30, count: 38 },
  { lower: 30, upper: 50, count: 32 },
  { lower: 50, upper: 75, count: 18 },
  { lower: 75, upper: 100, count: 6 },
];
const total = bins.reduce((sum, bin) => sum + bin.count, 0);
const density = (bin: Chart.HistogramBin) => bin.count / total / (bin.upper - bin.lower);
const interval = (bin: Chart.HistogramBin) =>
  `[${bin.lower}, ${bin.upper}${bin.upper === 100 ? "]" : ")"}`;
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s] = useSettings(defaultSettings, onSettingsChange);
  return (
    <section className="chart-example" aria-label="Response time distribution">
      <Chart.Root
        emphasis={s.emphasis}
        config={{
          count: {
            label: "Probability density",
            color: "#89bfb0",
            formatValue: (value) => `${Number(value).toFixed(4)} ms⁻¹`,
          },
        }}
      >
        <p className="chart-sr-only" id="histogram-instructions">
          Response time in milliseconds. Unequal-width intervals use density height, so rectangle
          area represents probability. All counts and endpoints are in View data.
        </p>
        <Chart.HistogramChart
          bins={bins}
          measure="density"
          responsive
          style={{ width: "100%", height: 320 }}
          animate={s.animate}
          aria-label="Response time probability density"
          aria-describedby="histogram-instructions"
          margin={{ top: 20, right: 16, left: 4, bottom: 26 }}
          xAxisProps={{
            tickLine: false,
            label: { value: "Milliseconds", position: "insideBottom", offset: -10 },
          }}
          yAxisProps={{
            width: 66,
            tickLine: false,
            tickFormatter: (value) => Number(value).toFixed(3),
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <Chart.HistogramSeries material={s.material} fill="#89bfb0" />
          <Chart.Tooltip
            shared={false}
            labelFormatter={(_label, entries) => {
              const bin = entries[0]?.payload as Chart.HistogramBin | undefined;
              return bin ? `${interval(bin)} ms · ${bin.count} samples` : "";
            }}
          />
        </Chart.HistogramChart>
      </Chart.Root>
      <details>
        <summary>View data</summary>
        <div className="table-scroll">
          <table>
            <caption>
              130 samples · lower inclusive, upper exclusive except the final interval
            </caption>
            <thead>
              <tr>
                <th scope="col">Interval (ms)</th>
                <th scope="col">Count</th>
                <th scope="col">Density (ms⁻¹)</th>
              </tr>
            </thead>
            <tbody>
              {bins.map((bin) => (
                <tr key={bin.lower}>
                  <th scope="row">{interval(bin)}</th>
                  <td>{bin.count}</td>
                  <td>{density(bin).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
