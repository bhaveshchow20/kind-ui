"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const data = [
  { period: "Request 1", milliseconds: 12 },
  { period: "Request 2", milliseconds: 18 },
  { period: "Request 3", milliseconds: 23 },
  { period: "Request 4", milliseconds: 25 },
  { period: "Request 5", milliseconds: 27 },
  { period: "Request 6", milliseconds: 30 },
  { period: "Request 7", milliseconds: 31 },
  { period: "Request 8", milliseconds: 32 },
  { period: "Request 9", milliseconds: 34 },
  { period: "Request 10", milliseconds: 35 },
  { period: "Request 11", milliseconds: 36 },
  { period: "Request 12", milliseconds: 38 },
  { period: "Request 13", milliseconds: 40 },
  { period: "Request 14", milliseconds: 42 },
  { period: "Request 15", milliseconds: 43 },
  { period: "Request 16", milliseconds: 45 },
  { period: "Request 17", milliseconds: 47 },
  { period: "Request 18", milliseconds: 49 },
  { period: "Request 19", milliseconds: 50 },
  { period: "Request 20", milliseconds: 52 },
  { period: "Request 21", milliseconds: 55 },
  { period: "Request 22", milliseconds: 58 },
  { period: "Request 23", milliseconds: 60 },
  { period: "Request 24", milliseconds: 63 },
  { period: "Request 25", milliseconds: 66 },
  { period: "Request 26", milliseconds: 70 },
  { period: "Request 27", milliseconds: 74 },
  { period: "Request 28", milliseconds: 80 },
  { period: "Request 29", milliseconds: 88 },
  { period: "Request 30", milliseconds: 95 },
  { period: "Request 31", milliseconds: 100 },
  { period: "Request 32", milliseconds: 110 },
  { period: "Request 33", milliseconds: 125 },
  { period: "Request 34", milliseconds: 150 },
  { period: "Request 35", milliseconds: 180 },
  { period: "Request 36", milliseconds: 200 },
  { period: "Missing reading", milliseconds: null },
  { period: "Outside window", milliseconds: 260 },
];
const result = Chart.binHistogram(
  data.map((row) => row.milliseconds),
  [0, 25, 50, 100, 200],
);
const config = {
  count: {
    label: "Probability per ms",
    color: "#733bff",
    formatValue: (value) => `${Number(value).toFixed(4)} / ms`,
  },
} satisfies Chart.SeriesConfig;

function MaterialHistogramComposition({
  appearance = "default",
}: {
  appearance?: "default" | "clay" | "glow";
} = {}) {
  return (
    <Chart.Root config={config}>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.HistogramChart
          bins={result.bins}
          measure="density"
          animate
          accessibilityLayer
          aria-label="Checkout response time, density by millisecond interval"
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          xAxisProps={{
            axisLine: false,
            tickLine: false,
            tickMargin: 12,
            height: 48,
            ticks: [0, 50, 100, 150, 200],
            tickFormatter: (value) => `${value} ms`,
          }}
          yAxisProps={{
            axisLine: false,
            tickLine: false,
            tickMargin: 12,
            width: 72,

            tickFormatter: (value) => Number(value).toFixed(3),
          }}
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.HistogramSeries material={appearance === "default" ? undefined : appearance} />
          <Chart.Tooltip
            labelFormatter={(_label, payload) => {
              const bin = payload[0]?.payload as Chart.HistogramBin | undefined;
              return bin
                ? `${bin.lower}–${bin.upper} ms${bin.upper === 200 ? " (final edge included)" : " (upper edge excluded)"}`
                : "Response time";
            }}
          />
        </Chart.HistogramChart>
      </Chart.ResponsiveContainer>
      <p
        style={{
          fontSize: "0.75rem",
          margin: "8px 0 0",
          color: "var(--color-fd-muted-foreground, #666)",
        }}
      >
        {result.accepted} accepted · {result.missing} missing · {result.nonfinite} nonfinite ·{" "}
        {result.outOfRange} outside 0–200 ms
      </p>
    </Chart.Root>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function MaterialHistogram(props: import("react").ComponentProps<typeof MaterialHistogramComposition>) {
  return (
    <div className="chart-example">
      <MaterialHistogramComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Materials data">
          <caption>{"Response-time density; [ includes an edge and ) excludes it. 36 accepted, 1 missing, 0 nonfinite, 1 out of range."}</caption>
          <thead><tr><th scope="col">{"Interval (ms)"}</th><th scope="col">{"Requests"}</th><th scope="col">{"Probability per ms"}</th></tr></thead>
          <tbody><tr><th scope="row">{"[0, 25)"}</th><td>{3}</td><td>{0.003333333333333333}</td></tr><tr><th scope="row">{"[25, 50)"}</th><td>{15}</td><td>{0.016666666666666666}</td></tr><tr><th scope="row">{"[50, 100)"}</th><td>{12}</td><td>{0.006666666666666666}</td></tr><tr><th scope="row">{"[100, 200]"}</th><td>{6}</td><td>{0.0016666666666666666}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
