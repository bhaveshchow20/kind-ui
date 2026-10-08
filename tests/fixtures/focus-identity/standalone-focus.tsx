import * as Chart from "@kind-ui/charts";
import { useState } from "react";

const config = {
  solar: { label: "Solar", color: "#d29319" },
  wind: { label: "Wind", color: "#159c91" },
  homes: { label: "Homes", color: "#8865ce" },
  industry: { label: "Industry", color: "#447fd1" },
};
const flows = {
  nodes: Object.keys(config).map((id) => ({ id, name: id })),
  links: [
    { id: "solar-homes", source: "solar", target: "homes", value: 35 },
    { id: "solar-industry", source: "solar", target: "industry", value: 25 },
    { id: "wind-homes", source: "wind", target: "homes", value: 15 },
    { id: "wind-industry", source: "wind", target: "industry", value: 25 },
  ],
} satisfies Chart.SankeyFlowData;
const cells = [
  { row: "A", column: "X", value: 15 },
  { row: "A", column: "Y", value: 80 },
  { row: "B", column: "X", value: 35 },
  { row: "B", column: "Y", value: null },
];
const scale = Chart.createHeatmapScale({ domain: [0, 80], colors: ["#ffffff", "#112233"] });

export function StandaloneFocus() {
  const [payload, setPayload] = useState<unknown>(null);
  const [motion, setMotion] = useState(true);
  return (
    <>
      <section id="standalone-sankey">
        <Chart.Root
          config={config}
          interaction={{
            kind: "node",
            mode: "focus",
            eligibleKeys: Object.keys(config),
            markActivation: "matching-legend",
          }}
        >
          <Chart.SankeyChart
            data={flows}
            nodeConfig={config}
            width={600}
            height={250}
            interactionBinding="root"
            animate={
              motion
                ? { revealDurationMs: 3000, hoverTransition: { duration: 0.4, ease: "linear" } }
                : false
            }
            onMouseEnter={(item, type) => {
              setPayload(
                type === "node"
                  ? { node: (item as Chart.SankeyNodeProps).payload.id }
                  : {
                      id: (item as Chart.SankeyLinkProps).payload.id,
                      source: (item as Chart.SankeyLinkProps).payload.source.id,
                      target: (item as Chart.SankeyLinkProps).payload.target.id,
                      value: (item as Chart.SankeyLinkProps).payload.value,
                    },
              );
            }}
          />
          <Chart.SankeyLegend config={config} interactionBinding="root" />
          <output data-standalone-payload={JSON.stringify(payload)} />
          <button type="button" onClick={() => setMotion((value) => !value)}>
            {motion ? "Disable motion" : "Enable motion"}
          </button>
        </Chart.Root>
      </section>
      <section id="standalone-heatmap">
        <Chart.HeatmapChart
          rows={["A", "B"]}
          columns={["X", "Y"]}
          data={cells}
          scale={scale}
          animate
        >
          <Chart.HeatmapGrid caption="Independent cells" />
          <Chart.HeatmapTooltip />
          <Chart.HeatmapLegend label="Value" />
        </Chart.HeatmapChart>
      </section>
    </>
  );
}
