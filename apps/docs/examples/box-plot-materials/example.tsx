"use client";
import { BoxPlotChart, type SeriesConfig } from "@kind-ui/charts";

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
} satisfies SeriesConfig;

export function MaterialResponseTimeBoxPlot({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
} = {}) {
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
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Response time distributions in milliseconds"
        >
          <BoxPlotChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
          <BoxPlotChart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            height={48}
            interval={0}
            tick={{ fill: "#666" }}
          />
          <BoxPlotChart.YAxis
            type="number"
            domain={[0, 180]}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: "#666" }}
          />
          <BoxPlotChart.Series<(typeof data)[number]>
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
            {...(appearance !== "default" ? { material: appearance } : {})}
          />
          <BoxPlotChart.Tooltip
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Lower whisker</dt>
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Q1</dt>
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Median</dt>
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Q3</dt>
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Upper whisker</dt>
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
                      <dt style={{ color: "var(--muted-foreground, GrayText)" }}>Outlier</dt>
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
          <BoxPlotChart.Legend />
        </BoxPlotChart>
      </>
    </>
  );
}
