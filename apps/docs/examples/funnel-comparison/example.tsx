"use client";
import { FunnelChart, type FunnelDatum, type SeriesConfig } from "@kind-ui/charts";

interface CohortStage extends FunnelDatum {
  cohort: "June" | "July";
}
const data: readonly CohortStage[] = [
  { cohort: "June", id: "started", label: "Started", value: 1200 },
  { cohort: "June", id: "verified", label: "Verified", value: 840 },
  { cohort: "June", id: "activated", label: "Activated", value: 504 },
  { cohort: "July", id: "started", label: "Started", value: 1600 },
  { cohort: "July", id: "verified", label: "Verified", value: 1040 },
  { cohort: "July", id: "activated", label: "Activated", value: 728 },
];
const cohorts = ["June", "July"] as const;
const config = {
  started: { label: "Started", color: "#476da2" },
  verified: { label: "Verified", color: "#5e8d91" },
  activated: { label: "Activated", color: "#8f85ad" },
} satisfies SeriesConfig;
const people = new Intl.NumberFormat("en-US");

export function CohortComparisonChart() {
  return (
    <figure className="m-0 min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
        {cohorts.map((cohort) => (
          <section key={cohort} className="min-w-0" aria-label={`${cohort} cohort`}>
            <h3 className="mt-0 mb-2 text-sm font-medium">{cohort}</h3>
            <FunnelChart
              data={data.filter((record) => record.cohort === cohort)}
              config={config}
              width="100%"
              height={200}
              aria-label={`${cohort} signup cohort in users`}
              scaleMax={1600}
              denominator="first"
              ratioLabel="Share of cohort starters"
              formatValue={(value) => people.format(value)}
            >
              <FunnelChart.Stages />
              <FunnelChart.Labels className="grid gap-1 text-xs" />
              <FunnelChart.Tooltip />
            </FunnelChart>
          </section>
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-[var(--muted-foreground,#666)]">
        Signup cohorts · users · shared scale of 1,600 · each cohort's own starters
      </figcaption>
    </figure>
  );
}
