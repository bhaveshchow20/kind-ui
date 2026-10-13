"use client";
import { FunnelChart, type FunnelDatum, type SeriesConfig } from "@kind-ui/charts";

const data: readonly FunnelDatum[] = [
  { id: "started", label: "Started checkout", value: 2400 },
  { id: "details", label: "Contact details", value: 1800 },
  { id: "delivery", label: "Delivery selected", value: 1440 },
  { id: "payment", label: "Reached payment", value: 1080 },
  { id: "ordered", label: "Placed order", value: 900 },
];
const config = {
  started: { label: "Started checkout", color: "#476da2" },
  details: { label: "Contact details", color: "#577aa4" },
  delivery: { label: "Delivery selected", color: "#5e8d91" },
  payment: { label: "Reached payment", color: "#659684" },
  ordered: { label: "Placed order", color: "#8f85ad" },
} satisfies SeriesConfig;
const sessions = new Intl.NumberFormat("en-US");

export function CheckoutCohortChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <figure className="m-0 min-w-0">
      <FunnelChart
        data={data}
        config={config}
        width="100%"
        height={260}
        aria-label="June checkout cohort in sessions"
        denominator="first"
        ratioLabel="Share of starting sessions"
        formatValue={(value) => sessions.format(value)}
        animate={{ revealDurationMs: 700 }}
        loading={state === "loading"}
        loadingLabel="Loading checkout cohort"
      >
        <FunnelChart.Stages />
        <FunnelChart.Labels className="grid gap-1 text-xs" />
        <FunnelChart.Tooltip />
      </FunnelChart>
      <figcaption className="mt-2 text-xs text-[var(--muted-foreground,#666)]">
        June cohort · sessions · share of starters
      </figcaption>
    </figure>
  );
}
