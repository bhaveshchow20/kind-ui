"use client";
import {
  type FunnelAccessors,
  FunnelChart,
  type FunnelTooltipContentProps,
  type SeriesConfig,
} from "@kind-ui/charts";

interface PipelineStage {
  key: string;
  title: string;
  weightedUsd: number | null;
  medianDays: number | null;
}
const data: readonly PipelineStage[] = [
  { key: "discovery", title: "Discovery", weightedUsd: 84250.5, medianDays: 3.5 },
  { key: "evaluation", title: "Evaluation", weightedUsd: 126500.75, medianDays: 8 },
  { key: "proposal", title: "Proposal", weightedUsd: null, medianDays: null },
  { key: "negotiation", title: "Negotiation", weightedUsd: 0, medianDays: 0 },
  { key: "committed", title: "Committed", weightedUsd: 63000.25, medianDays: 11 },
];
const accessors = {
  id: (record) => record.key,
  label: (record) => record.title,
  value: (record) => record.weightedUsd,
} satisfies FunnelAccessors<PipelineStage>;
const config = {
  discovery: { label: "Discovery", color: "#476da2" },
  evaluation: { label: "Evaluation", color: "#5e8d91" },
  proposal: { label: "Proposal", color: "#8f85ad" },
  negotiation: { label: "Negotiation", color: "#a28b71" },
  committed: { label: "Committed", color: "#659684" },
} satisfies SeriesConfig;
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const duration = (days: number | null) =>
  days === null ? "Unknown duration" : `${days} median days`;

function PipelineReadout({ stage, formattedValue }: FunnelTooltipContentProps<PipelineStage>) {
  return (
    <>
      <strong>{stage.label}</strong>
      <div>Weighted amount: {formattedValue}</div>
      <div>{duration(stage.datum.medianDays)}</div>
    </>
  );
}

export function WeightedPipelineChart() {
  return (
    <figure className="m-0 min-w-0">
      <FunnelChart
        data={data}
        accessors={accessors}
        config={config}
        width="100%"
        height={260}
        aria-label="Current weighted pipeline amount in US dollars"
        formatValue={(value) => dollars.format(value)}
        missingLabel="Not reported"
        animate={{ revealDurationMs: 700 }}
      >
        <FunnelChart.Stages<PipelineStage> />
        <FunnelChart.Labels<PipelineStage>
          className="grid gap-1 text-xs"
          render={(stage) => (
            <span>
              {stage.label}: {stage.value === null ? "Not reported" : dollars.format(stage.value)}
              {" · "}
              {duration(stage.datum.medianDays)}
            </span>
          )}
        />
        <FunnelChart.Tooltip<PipelineStage> Content={PipelineReadout} />
      </FunnelChart>
      <figcaption className="mt-2 text-xs text-[var(--muted-foreground,#666)]">
        Current stage snapshot · weighted USD · supplied stage duration
      </figcaption>
    </figure>
  );
}
