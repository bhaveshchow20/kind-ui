"use client";

import {
  SankeyChart,
  type SankeyFlowData,
  SankeyLink,
  SankeyNode,
  SankeyTable,
} from "@kind-ui/charts";

// Import @kind-ui/charts/styles.css once at the app entry/root layout.
const flows = {
  nodes: [
    { id: "source", name: "Supply" },
    { id: "used", name: "Consumed" },
    { id: "stored", name: "Stored" },
  ],
  links: [
    { id: "consumed", source: "source", target: "used", value: 80 },
    { id: "stored", source: "source", target: "stored", value: 20 },
  ],
} satisfies SankeyFlowData;

export function EnergyFlows({ pending = false }: { pending?: boolean }) {
  return (
    <section aria-label="Energy flows (kWh)">
      <SankeyChart
        data={flows}
        width={600}
        height={300}
        animate={false}
        loading={pending}
        loadingLabel="Loading energy flows"
        node={(props) => <SankeyNode {...props} finish="clay" />}
        link={(props) => <SankeyLink {...props} material="gradient" finish="glow" />}
      />
      {pending ? (
        <p>Flows are loading.</p>
      ) : (
        <SankeyTable data={flows} caption="Energy flows (kWh)" />
      )}
    </section>
  );
}
