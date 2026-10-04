"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

type Row = { period: string; summary: Chart.BoxPlotSummary | null };
const data: Row[] = [
  { period: "Stable", summary: { lowerWhisker: 5, q1: 5, median: 5, q3: 5, upperWhisker: 5 } },
  { period: "Zero", summary: { lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 } },
  { period: "Pending", summary: null },
  {
    period: "Variable",
    summary: { lowerWhisker: -12, q1: -5, median: 1, q3: 8, upperWhisker: 18, outliers: [-20, 24] },
  },
];
const config = {
  change: { label: "Change · percentage points", color: "#16756c" },
} satisfies Chart.SeriesConfig;

export function EdgeCaseBoxPlot() {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BoxPlotChart
          data={data}
          animate
          accessibilityLayer
          aria-label="Collapsed, zero, missing and variable distributions"
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
        >
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            height={48}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <Chart.YAxis
            type="number"
            domain={[-25, 30]}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
          />
          <Chart.BoxPlotSeries<Row>
            dataKey="summary"
            seriesKey="change"
            barSize={28}
            strokeWidth={2.5}
          />
          <Chart.Tooltip
            maxWidth={220}
            content={({ active, payload, label }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row?.summary) return null;
              const summary = row.summary;
              return (
                <div data-kind-ui="chart-tooltip">
                  <strong>{label}</strong>
                  <dl>
                    <div>
                      <dt>Lower whisker</dt>
                      <dd>{summary.lowerWhisker} pp</dd>
                    </div>
                    <div>
                      <dt>Q1</dt>
                      <dd>{summary.q1} pp</dd>
                    </div>
                    <div>
                      <dt>Median</dt>
                      <dd>{summary.median} pp</dd>
                    </div>
                    <div>
                      <dt>Q3</dt>
                      <dd>{summary.q3} pp</dd>
                    </div>
                    <div>
                      <dt>Upper whisker</dt>
                      <dd>{summary.upperWhisker} pp</dd>
                    </div>
                    <div>
                      <dt>Outliers</dt>
                      <dd>{summary.outliers?.join(", ") || "None"}</dd>
                    </div>
                  </dl>
                </div>
              );
            }}
          />
        </Chart.BoxPlotChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
