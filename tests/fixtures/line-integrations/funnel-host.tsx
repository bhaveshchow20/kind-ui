import { FunnelChart } from "@kind-ui/charts";
import { useState } from "react";
export function FunnelIntegrationHost() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section aria-label="Funnel integration">
      <FunnelChart
        data={[
          { id: "submitted", label: "Submitted", value: 40 },
          { id: "reviewed", label: "Reviewed", value: 20 },
          { id: "unknown", label: "Unknown", value: null },
        ]}
        config={{
          submitted: { color: "blue" },
          reviewed: { color: "green" },
          unknown: { color: "gray" },
        }}
        width={420}
        height={260}
        aria-label="Applications by stage"
        denominator="first"
        ratioLabel="Share of submitted applications"
        activeId={active}
        onActiveIdChange={setActive}
      >
        <FunnelChart.Stages />
        <FunnelChart.Labels />
        <FunnelChart.Tooltip />
        <FunnelChart.DataTable caption="Application stages" />
      </FunnelChart>
      <output aria-label="Funnel integration inspection">{active ?? "none"}</output>
    </section>
  );
}
