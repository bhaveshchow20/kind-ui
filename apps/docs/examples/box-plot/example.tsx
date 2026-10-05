"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

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

export function ResponseTimeBoxPlot() {
  return (
    <Chart.Root config={config}>
      <Chart.Legend />
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.BoxPlotChart
          data={data}
          animate
          accessibilityLayer
          margin={{ top: 20, right: 24, bottom: 8, left: 0 }}
          aria-label="Response time distributions in milliseconds"
        >
          <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
          <Chart.XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            height={48}
            interval={0}
          />
          <Chart.YAxis
            type="number"
            domain={[0, 180]}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
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
                <div data-kind-ui="chart-tooltip">
                  <strong>{label}</strong>
                  <dl>
                    <div>
                      <dt>Lower whisker</dt>
                      <dd>{row.lowerWhisker} ms</dd>
                    </div>
                    <div>
                      <dt>Q1</dt>
                      <dd>{row.q1} ms</dd>
                    </div>
                    <div>
                      <dt>Median</dt>
                      <dd>{row.median} ms</dd>
                    </div>
                    <div>
                      <dt>Q3</dt>
                      <dd>{row.q3} ms</dd>
                    </div>
                    <div>
                      <dt>Upper whisker</dt>
                      <dd>{row.upperWhisker} ms</dd>
                    </div>
                    <div>
                      <dt>Outlier</dt>
                      <dd>{row.outlier} ms</dd>
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
