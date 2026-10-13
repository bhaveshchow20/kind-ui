"use client";
import { FunnelChart, type FunnelDatum, type SeriesConfig } from "@kind-ui/charts";

const data: readonly FunnelDatum[] = [
  { id: "submitted", label: "Submitted", value: 180 },
  { id: "screened", label: "Screened", value: 120 },
  { id: "interviewed", label: "Interviewed", value: 75 },
  { id: "offered", label: "Offered", value: 45 },
];
const config = {
  submitted: { label: "Submitted", color: "#476da2" },
  screened: { label: "Screened", color: "#5e8d91" },
  interviewed: { label: "Interviewed", color: "#8f85ad" },
  offered: { label: "Offered", color: "#a28b71" },
} satisfies SeriesConfig;

export function ApplicationWorkflowChart({
  orientation = "horizontal",
}: {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <figure className="m-0 min-w-0">
      <FunnelChart
        data={data}
        config={config}
        width="100%"
        height={240}
        orientation={orientation}
        aria-label="Historical application cohort stages"
        denominator="previous"
        ratioLabel="Share of previous stage"
        animate={{ revealDurationMs: 700 }}
      >
        <FunnelChart.Stages geometry="trapezoid" />
        <FunnelChart.Labels className="grid gap-1 text-xs" />
        <FunnelChart.Tooltip />
      </FunnelChart>
      <figcaption className="mt-2 text-xs text-[var(--muted-foreground,#666)]">
        Applications · current-to-next boundary widths · share of previous stage
      </figcaption>
    </figure>
  );
}
