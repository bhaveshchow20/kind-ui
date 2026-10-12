import "./tailwind.css";
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
        <Chart.SankeyChart
          config={config}
          interaction={{
            kind: "node",
            mode: "focus",
            eligibleKeys: Object.keys(config),
            markActivation: "matching-legend",
          }}
          aria-label="Chart fixture"
          data={flows}
          width={600}
          height={250}
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
        >
          {null}
          {/* Explicit renderer ownership belongs to the family parts. */}
          <Chart.SankeyChart.Nodes></Chart.SankeyChart.Nodes>
          <Chart.SankeyChart.Links></Chart.SankeyChart.Links>
          <Chart.SankeyChart.Legend />
        </Chart.SankeyChart>
        <output data-standalone-payload={JSON.stringify(payload)} />
        <button type="button" onClick={() => setMotion((value) => !value)}>
          {motion ? "Disable motion" : "Enable motion"}
        </button>
      </section>
      <section id="standalone-heatmap">
        <Chart.HeatmapChart
          rows={["A", "B"]}
          columns={["X", "Y"]}
          data={cells}
          scale={scale}
          animate
          config={config}
          aria-label="Chart fixture"
        >
          <Chart.HeatmapGrid caption="Independent cells" />
          <Chart.HeatmapTooltip />
          <Chart.HeatmapLegend label="Value" />
        </Chart.HeatmapChart>
      </section>
    </>
  );
}
