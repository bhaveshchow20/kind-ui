"use client";
import { LineChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
];
const config = { visitors: { label: "Visitors", color: "#733bff" } } satisfies SeriesConfig;

export function LinePresentationChart({
  presentation = "markers",
}: {
  presentation?: "markers" | "dashes" | "reveal" | "background";
}) {
  return (
    <LineChart
      key={presentation}
      data={data}
      config={config}
      height={280}
      aria-label="Monthly visitors"
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      animate={{ revealDirection: presentation === "reveal" ? "center-out" : "left-to-right" }}
    >
      {presentation === "background" && <LineChart.Background pattern="crossings" />}
      <LineChart.Grid />
      <LineChart.XAxis dataKey="period" />
      <LineChart.YAxis />
      <LineChart.Series
        dataKey="visitors"
        type="monotone"
        dot={{ r: 2.5 }}
        strokeWidth={2}
        pointStyle={presentation === "markers" ? "colored-border" : undefined}
        activePointStyle="border"
        strokeDasharray={presentation === "dashes" ? "6 4" : undefined}
        dashAnimation={presentation === "dashes" ? { durationMs: 1000 } : false}
      />
      <LineChart.Tooltip />
      <LineChart.Legend />
    </LineChart>
  );
}
