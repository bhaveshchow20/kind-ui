"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { month: "Jan", capacity: 960, shipped: 640, target: 700 },
  { month: "Feb", capacity: 960, shipped: 730, target: 720 },
  { month: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { month: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { month: "May", capacity: 1120, shipped: 920, target: 880 },
  { month: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];
type Row = (typeof data)[number];
function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
const config = {
  capacity: {
    color: { light: ["#c4b5fd", "#7c3aed"], dark: ["#ddd6fe", "#a78bfa"] },
    pattern: { kind: "dots" },
  },
  shipped: { color: "#2563eb", pattern: { kind: "hatch" } },
  target: { color: "#0f766e", icon: TargetIcon },
} satisfies Chart.SeriesConfig;
const projected = (row: Row) => row.month === "Jun";
const background = Chart.defineChartBackgroundPattern(({ size, color }) => (
  <circle cx={size / 2} cy={size / 2} r={1} fill={color} />
));

/** The application supplies request state, errors, cancellation and retry. */
export function PresentationOptions({ status = "ready" }: { status?: "ready" | "loading" }) {
  const loading = status === "loading";
  return (
    <section aria-label="Monthly production options">
      <Chart.Root
        config={config}
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: Object.keys(config),
          markActivation: "matching-legend",
        }}
      >
        <Chart.Legend />
        <Chart.ResponsiveContainer width="100%" height={280}>
          <Chart.ComboChart
            data={data}
            loading={loading}
            loadingLabel="Loading monthly production"
            accessibilityLayer
            aria-label="Production, capacity and target in units"
            animate={{
              revealDirection: "center-out",
              lineReveal: { revealDirection: "right-to-left" },
            }}
          >
            <Chart.ChartBackgroundPattern pattern={background} />
            <Chart.XAxis dataKey="month" />
            <Chart.YAxis width={80} />
            <Chart.AreaSeries dataKey="capacity" fillOpacity={0.15} pointStyle="border" />
            <Chart.BarSeries<Row>
              dataKey="shipped"
              projection={{ isProjected: projected, pattern: { kind: "stripe" } }}
            />
            <Chart.LineSeries
              dataKey="target"
              strokeDasharray="6 4"
              dashAnimation={{ durationMs: 1000 }}
              pointStyle="colored-border"
              activePointStyle="border"
            />
            <Chart.Tooltip
              content={(tooltip) => (
                <Chart.TooltipContent
                  tooltip={tooltip}
                  isProjected={(entry) => entry.payload?.month === "Jun"}
                />
              )}
            />
          </Chart.ComboChart>
        </Chart.ResponsiveContainer>
      </Chart.Root>
      <div className="sr-only">
        <table>
          <caption>Monthly production in units; June is projected</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Capacity</th>
              <th scope="col">Shipped</th>
              <th scope="col">Target</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.month}>
                <th scope="row">{row.month}</th>
                <td>{row.capacity}</td>
                <td>{row.shipped}</td>
                <td>{row.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
