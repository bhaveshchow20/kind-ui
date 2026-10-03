"use client";

import * as Chart from "@kind-ui/charts";
import { useId } from "react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";

export type ExampleSettings = CommonSettings & {
  material: "plain" | "paper";
  dataset: Dataset;
  horizontal: boolean;
};

type Row = { category: string; summary: Chart.BoxPlotSummary | null };
type Dataset = "latency" | "changes" | "exact";
const latency: Row[] = [
  {
    category: "Search",
    summary: { lowerWhisker: 18, q1: 32, median: 44, q3: 61, upperWhisker: 84, outliers: [112] },
  },
  {
    category: "Checkout",
    summary: { lowerWhisker: 26, q1: 46, median: 68, q3: 88, upperWhisker: 126, outliers: [154] },
  },
  {
    category: "Profile",
    summary: { lowerWhisker: 12, q1: 22, median: 31, q3: 46, upperWhisker: 72 },
  },
];
const fields = ["lowerWhisker", "q1", "median", "q3", "upperWhisker"] as const;
const fieldLabels = ["Lower whisker", "Q1", "Median", "Q3", "Upper whisker"] as const;

function Summary({ row, unit }: { row: Row; unit: string }) {
  const summary = row.summary;
  if (!summary) return null;
  return (
    <div data-kind-ui="chart-tooltip">
      <strong>{row.category}</strong>
      <dl>
        {fields.map((field, index) => (
          <div key={field}>
            <dt>{fieldLabels[index]}</dt>
            <dd>
              {summary[field]} {unit}
            </dd>
          </div>
        ))}
        <div>
          <dt>Outliers</dt>
          <dd>{summary.outliers?.map((value) => `${value} ${unit}`).join(", ") || "None"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const help = useId();
  const rows = latency;
  const unit = "ms";
  const title = "Request latency";
  const values = rows.flatMap((row) => (row.summary ? Chart.boxPlotExtent(row.summary) : []));
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const padding = Math.max(1, (high - low) * 0.08);
  const domain: [number, number] = [low - padding, high + padding];

  return (
    <section className="chart-example">
      <h2>Request latency</h2>
      <p id={help} className="chart-sr-only">
        Boxes span Q1–Q3, the center line marks the median, and whiskers use the supplied endpoints.
        Circles show supplied outliers. The caller chooses the quartile and outlier convention.
        Equal statistics collapse to a line; a missing summary produces no mark.
      </p>
      <Chart.Root
        config={{ spread: { label: `Distribution · ${unit}`, color: "#16756c" } }}
        emphasis={s.emphasis}
      >
        <ResponsiveContainer width="100%" height={310}>
          <Chart.BoxPlotChart
            data={rows}
            animate={s.animate}
            layout={s.horizontal ? "vertical" : "horizontal"}
            accessibilityLayer
            aria-label={title}
            aria-describedby={help}
            margin={{ top: 20, right: 20, bottom: 28, left: 6 }}
          >
            <CartesianGrid
              vertical={s.horizontal}
              horizontal={!s.horizontal}
              stroke="var(--border, #e1e6e3)"
            />
            <XAxis
              type={s.horizontal ? "number" : "category"}
              {...(s.horizontal
                ? { domain, label: { value: unit, position: "insideBottom", offset: -16 } }
                : { dataKey: "category" })}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              type={s.horizontal ? "category" : "number"}
              {...(s.horizontal
                ? { dataKey: "category" }
                : { domain, tickFormatter: (value: number | string) => `${value} ${unit}` })}
              width={s.horizontal ? 80 : 72}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <ReferenceLine
              {...(s.horizontal ? { x: 0 } : { y: 0 })}
              stroke="var(--muted-foreground, #b1bcb5)"
            />
            <Chart.BoxPlotSeries<Row>
              dataKey="summary"
              seriesKey="spread"
              material={s.material}
              fill="#16756c"
              stroke="#16756c"
              fillOpacity={0.65}
              barSize={32}
            />
            <Chart.Tooltip
              maxWidth={260}
              content={(tooltip) => {
                const row = rows.find((candidate) => candidate.category === String(tooltip.label));
                return tooltip.active && row ? <Summary row={row} unit={unit} /> : null;
              }}
            />
          </Chart.BoxPlotChart>
        </ResponsiveContainer>
      </Chart.Root>
      <details>
        <summary>View data</summary>
        <div style={{ overflowX: "auto" }}>
          <table>
            <caption>
              {title} · every supplied statistic in {unit}
            </caption>
            <thead>
              <tr>
                <th scope="col">Group</th>
                {fieldLabels.map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
                <th scope="col">Outliers</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, summary }) => (
                <tr key={category}>
                  <th scope="row">{category}</th>
                  {fields.map((field) => (
                    <td key={field}>{summary?.[field] ?? "Missing"}</td>
                  ))}
                  <td>{summary ? summary.outliers?.join(", ") || "None" : "Missing"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
