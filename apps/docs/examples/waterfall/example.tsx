"use client";

import * as Chart from "@kind-ui/charts";
import { useId } from "react";
import { CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type CommonSettings, Controls, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";

export type ExampleSettings = CommonSettings & { material: "plain" | "paper" };

const entries: readonly Chart.WaterfallEntry[] = [
  { id: "opening", label: "Opening", kind: "start", value: 80 },
  { id: "sales", label: "Sales", kind: "delta", value: 50 },
  { id: "costs", label: "Costs", kind: "delta", value: -160 },
  { id: "net", label: "Net", kind: "subtotal" },
  { id: "refund", label: "Refund", kind: "delta", value: 0 },
  { id: "recovery", label: "Recovery", kind: "delta", value: 70 },
  { id: "closing", label: "Closing", kind: "end", value: 40 },
];
const data = Chart.computeWaterfallData(entries);
const labels = new Map(data.map((row) => [row.id, row.label]));
const format = (value: number | null) =>
  value === null ? "Unknown" : value.toLocaleString("en-US");

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const help = useId();

  return (
    <section className="chart-example">
      <h2>Waterfall with explicit changes and balances</h2>
      <p id={help}>
        Opening establishes 80 units. Sales and costs bring the balance to −30; the subtotal records
        that balance without adding it again. A zero refund stays zero, recovery adds 70, and the
        supplied closing checkpoint is 40. Green indicates increases, brown decreases, and blue
        checkpoints or subtotals.
      </p>
      <Controls settings={s} onChange={set} />
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
      <Chart.Root
        config={{ range: { label: "Balance · units", color: "#3478ae" } }}
        emphasis={s.emphasis}
      >
        <div style={{ overflowX: "auto" }}>
          <div style={{ width: "100%", minWidth: 620 }}>
            <ResponsiveContainer width="100%" height={320}>
              <Chart.WaterfallChart
                key={s.animate ? "entrance" : "still"}
                data={data}
                animate={s.animate}
                accessibilityLayer
                aria-label="Opening balance, signed changes and closing balance in sample units"
                aria-describedby={help}
                margin={{ top: 24, right: 16, bottom: 28, left: 8 }}
                barCategoryGap="32%"
              >
                <CartesianGrid vertical={false} stroke="var(--border, #dfe7e3)" />
                <XAxis
                  dataKey="id"
                  tickFormatter={(id) => labels.get(String(id)) ?? String(id)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis
                  type="number"
                  domain={["auto", "auto"]}
                  width={54}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => String(value)}
                  label={{ value: "Units", angle: -90, position: "insideLeft" }}
                />
                <ReferenceLine y={0} stroke="var(--foreground, #30433b)" />
                <Chart.WaterfallConnectors
                  data={data}
                  position="middle"
                  stroke="var(--muted-foreground, #87988f)"
                />
                <Chart.WaterfallSeries material={s.material} seriesKey="range">
                  {data.map((row) => (
                    <Cell
                      key={row.id}
                      fill={
                        row.kind !== "delta"
                          ? "#3478ae"
                          : (row.value ?? 0) < 0
                            ? "#b66744"
                            : "#167d77"
                      }
                    />
                  ))}
                </Chart.WaterfallSeries>
                <Chart.Tooltip
                  filterNull={false}
                  content={(tooltip) => {
                    const row = data.find((candidate) => candidate.id === String(tooltip.label));
                    return tooltip.active && row ? (
                      <div data-kind-ui="chart-tooltip">
                        <strong>{row.label}</strong>
                        <dl>
                          <div>
                            <dt>Kind</dt>
                            <dd>{row.kind}</dd>
                          </div>
                          <div>
                            <dt>{row.kind === "subtotal" ? "Subtotal" : "Value"}</dt>
                            <dd>{format(row.value)} units</dd>
                          </div>
                          <div>
                            <dt>From</dt>
                            <dd>{format(row.start)} units</dd>
                          </div>
                          <div>
                            <dt>To</dt>
                            <dd>{format(row.end)} units</dd>
                          </div>
                          <div>
                            <dt>Balance</dt>
                            <dd>{format(row.balance)} units</dd>
                          </div>
                        </dl>
                      </div>
                    ) : null;
                  }}
                />
              </Chart.WaterfallChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Chart.Root>
      <details>
        <summary>View data</summary>
        <div style={{ overflowX: "auto" }}>
          <table>
            <caption>
              Every waterfall step in sample units; Value is computed for the subtotal
            </caption>
            <thead>
              <tr>
                {["Step", "Kind", "Value", "From", "To", "Balance"].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.kind}</td>
                  <td>{format(row.value)}</td>
                  <td>{format(row.start)}</td>
                  <td>{format(row.end)}</td>
                  <td>{format(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
