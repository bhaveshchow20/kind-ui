"use client";

import {
  createHeatmapScale,
  HeatmapChart,
  HeatmapDataTable,
  type HeatmapDatum,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
} from "@kind-ui/charts";

// Import @kind-ui/charts/styles.css once at the app entry/root layout.
const scale = createHeatmapScale({ domain: [0, 10], colors: ["#eff6ff", "#1d4ed8"] });

export function TeamActivity({
  teams,
  weeks,
  data,
  pending = false,
}: {
  teams: string[];
  weeks: string[];
  data: HeatmapDatum[];
  pending?: boolean;
}) {
  if (!pending && data.length === 0) return <p>No activity observations.</p>;
  return (
    <HeatmapChart
      rows={teams}
      columns={weeks}
      data={data}
      scale={scale}
      aria-label="Team activity by week (count)"
      missingLabel="No observation"
      loading={pending}
      loadingLabel="Loading team activity"
      animate={false}
    >
      <HeatmapGrid caption="Team activity by week (count)" />
      <HeatmapTooltip />
      <HeatmapLegend label="Activity count, from 0 to 10" />
      {pending ? (
        <p>Observations are loading.</p>
      ) : (
        <HeatmapDataTable caption="Team activity by week (count)" />
      )}
    </HeatmapChart>
  );
}
