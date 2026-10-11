"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  {
    period: "Search",
    lowerWhisker: 18,
    q1: 32,
    median: 44,
    q3: 61,
    upperWhisker: 84,
    outlier: 112,
  },
  {
    period: "Checkout",
    lowerWhisker: 26,
    q1: 46,
    median: 68,
    q3: 88,
    upperWhisker: 126,
    outlier: 154,
  },
  {
    period: "Profile",
    lowerWhisker: 12,
    q1: 22,
    median: 31,
    q3: 46,
    upperWhisker: 72,
    outlier: 98,
  },
];
const config = {
  latency: { label: "Response time · ms", color: "#733bff" },
} satisfies Chart.SeriesConfig;

function HorizontalResponseTimeBoxPlotComposition() {
  return (
    <Chart.Root config={config} defaultVisibleSeries={Object.keys(config)}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BoxPlotChart
          data={data}
          animate
          accessibilityLayer
          layout="vertical"
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Response time distributions in milliseconds"
        >
          <Chart.CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <Chart.XAxis
            type="number"
            domain={[0, 180]}
            tickFormatter={(value: number) => `${value}`}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            height={44}
          />
          <Chart.YAxis
            type="category"
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={120}
            interval={0}
          />
          <Chart.BoxPlotSeries<(typeof data)[number]>
            dataKey={(row) => ({
              lowerWhisker: row.lowerWhisker,
              q1: row.q1,
              median: row.median,
              q3: row.q3,
              upperWhisker: row.upperWhisker,
              outliers: [row.outlier],
            })}
            seriesKey="latency"
            barSize={32}
            strokeWidth={1.5}
            fillOpacity={0.28}
          />
          <Chart.Tooltip
            maxWidth={220}
            content={({ active, payload, label }) => {
              const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !row) return null;
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
                        {row.lowerWhisker} ms
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
                        {row.q1} ms
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
                        {row.median} ms
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
                        {row.q3} ms
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
                        {row.upperWhisker} ms
                      </dd>
                    </div>
                    <div style={{ display: "contents" }}>
                      <dt style={{ color: "var(--kind-ui-chart-muted, GrayText)" }}>Outlier</dt>
                      <dd
                        style={{
                          margin: 0,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {row.outlier} ms
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

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function HorizontalResponseTimeBoxPlot() {
  return (
    <div className="chart-example">
      <HorizontalResponseTimeBoxPlotComposition />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Horizontal distributions data">
          <caption>{"Caller-computed response time summaries, in milliseconds"}</caption>
          <thead><tr><th scope="col">{"Endpoint"}</th><th scope="col">{"Lower whisker (ms)"}</th><th scope="col">{"Q1 (ms)"}</th><th scope="col">{"Median (ms)"}</th><th scope="col">{"Q3 (ms)"}</th><th scope="col">{"Upper whisker (ms)"}</th><th scope="col">{"Outlier (ms)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Search"}</th><td>{18}</td><td>{32}</td><td>{44}</td><td>{61}</td><td>{84}</td><td>{112}</td></tr><tr><th scope="row">{"Checkout"}</th><td>{26}</td><td>{46}</td><td>{68}</td><td>{88}</td><td>{126}</td><td>{154}</td></tr><tr><th scope="row">{"Profile"}</th><td>{12}</td><td>{22}</td><td>{31}</td><td>{46}</td><td>{72}</td><td>{98}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
