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
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
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
            tickMargin={8}
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
                <div
                  data-kind-ui="chart-tooltip"
                  style={{
                    fontSize: 12,
                    lineHeight: "18px",
                    minWidth: 180,
                    maxWidth: "min(220px, calc(100vw - 32px))",
                  }}
                >
                  <strong>{label}</strong>
                  <dl
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: "4px 16px",
                      margin: "8px 0 0",
                    }}
                  >
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>
                        Lower whisker
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.lowerWhisker} pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>Q1</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.q1} pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>Median</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.median} pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>Q3</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.q3} pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>
                        Upper whisker
                      </dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.upperWhisker} pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>Outliers</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.outliers?.join(", ") || "None"}
                      </dd>
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
