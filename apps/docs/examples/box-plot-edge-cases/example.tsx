"use client";
import { BoxPlotChart, type BoxPlotSummary, type SeriesConfig } from "@kind-ui/charts";

type Row = { period: string; summary: BoxPlotSummary | null };
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
} satisfies SeriesConfig;

export function EdgeCaseBoxPlot() {
  return (
    <>
      <>
        <BoxPlotChart
          legendPosition="top"
          config={config}
          defaultVisibleSeries={Object.keys(config)}
          width="100%"
          height={280}
          data={data}
          animate
          accessibilityLayer
          aria-label="Collapsed, zero, missing and variable distributions"
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
        >
          <BoxPlotChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            height={48}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <BoxPlotChart.YAxis
            type="number"
            domain={[-25, 30]}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: "#666" }}
          />
          <BoxPlotChart.Series<Row>
            dataKey="summary"
            seriesKey="change"
            barSize={28}
            strokeWidth={2.5}
          />
          <BoxPlotChart.Tooltip
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Lower whisker</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.lowerWhisker}pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Q1</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.q1}pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Median</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.median}pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Q3</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.q3}pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Upper whisker</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {summary.upperWhisker}pp
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Outliers</dt>
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
          <BoxPlotChart.Legend />
        </BoxPlotChart>
      </>
    </>
  );
}
