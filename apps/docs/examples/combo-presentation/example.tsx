"use client";
import {
  ComboChart,
  defineChartBackgroundPattern,
  type SeriesConfig,
  TooltipContent,
} from "@kind-ui/charts";

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
} satisfies SeriesConfig;
const projected = (row: Row) => row.month === "Jun";
const background = defineChartBackgroundPattern(({ size, color }) => (
  <circle cx={size / 2} cy={size / 2} r={1} fill={color} />
));

/** The application supplies request state, errors, cancellation and retry. */
export function PresentationOptions({ status = "ready" }: { status?: "ready" | "loading" }) {
  const loading = status === "loading";
  return (
    <section aria-label="Monthly production options">
      <>
        <>
          <ComboChart
            legendPosition="top"
            config={config}
            interaction={{
              kind: "series",
              mode: "focus",
              eligibleKeys: Object.keys(config),
              markActivation: "matching-legend",
            }}
            width="100%"
            height={280}
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
            <ComboChart.Background pattern={background} />
            <ComboChart.XAxis dataKey="month" tick={{ fill: "#666" }} />
            <ComboChart.YAxis width={80} tick={{ fill: "#666" }} />
            <ComboChart.Area dataKey="capacity" fillOpacity={0.15} pointStyle="border" />
            <ComboChart.Bar<Row>
              dataKey="shipped"
              projection={{ isProjected: projected, pattern: { kind: "stripe" } }}
            />
            <ComboChart.Line
              dataKey="target"
              strokeDasharray="6 4"
              dashAnimation={{ durationMs: 1000 }}
              pointStyle="colored-border"
              activePointStyle="border"
            />
            <ComboChart.Tooltip
              content={(tooltip) => (
                <TooltipContent
                  tooltip={tooltip}
                  isProjected={(entry) => entry.payload?.month === "Jun"}
                />
              )}
            />
            <ComboChart.Legend />
          </ComboChart>
        </>
      </>
    </section>
  );
}
