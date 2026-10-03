"use client";

import * as Chart from "@kind-ui/charts";
import { useId } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { type CommonSettings, Controls, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";

export type ExampleSettings = CommonSettings & {
  material: "plain" | "paper";
  activeFlow: string | null;
};

const data = Chart.prepareSankeyData({
  nodes: [
    { id: "supply", name: "Supply" },
    { id: "process", name: "Processing" },
    { id: "use", name: "Useful output" },
    { id: "loss", name: "Explicit loss" },
    { id: "reserve", name: "Reserve" },
  ],
  links: [
    { id: "feed", source: "supply", target: "process", value: 100 },
    { id: "useful", source: "process", target: "use", value: 75 },
    { id: "loss", source: "process", target: "loss", value: 25 },
    { id: "reserve", source: "supply", target: "reserve", value: 0 },
  ],
});

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const help = useId();
  const inspected = data.links.find((link) => link.id === s.activeFlow);

  return (
    <section className="chart-example">
      <h2>Sankey with an explicit energy balance</h2>
      <p id={help}>
        Processing receives 100 MWh and sends 75 MWh to useful output and 25 MWh to explicit loss.
        Link widths are proportional to energy. The measured zero reserve flow remains in the table
        and has no visible link. Select a link or inspect a flow in View data.
      </p>
      <Controls settings={s} onChange={set} />
      <div className="chart-controls">
        <label>
          Material{" "}
          <select
            value={s.material}
            onChange={(event) => {
              const material = event.currentTarget.value;
              if (material === "plain" || material === "paper") set({ ...s, material });
            }}
          >
            <option value="plain">Plain</option>
            <option value="paper">Paper</option>
          </select>
        </label>
        <button
          type="button"
          disabled={s.activeFlow === null}
          onClick={() => set({ ...s, activeFlow: null })}
        >
          Clear flow selection
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ width: "100%", minWidth: 560 }}>
          <ResponsiveContainer width="100%" height={320}>
            <Chart.SankeyChart
              key={s.animate ? "entrance" : "still"}
              data={data}
              animate={s.animate}
              nodePadding={42}
              nodeWidth={14}
              margin={{ left: 72, right: 125, top: 26, bottom: 26 }}
              title="Energy flows in MWh"
              desc="100 MWh enters processing, with 75 MWh useful output and 25 MWh loss. All four flows, including measured zero reserve, are available in the data table."
              aria-describedby={help}
              onClick={(item, kind) => {
                if (kind === "link") set({ ...s, activeFlow: item.payload.id });
              }}
              node={(props) => {
                const source = props.payload.id === "supply";
                const processing = props.payload.id === "process";
                return (
                  <g>
                    <Chart.SankeyNode {...props} color="#167d77" finish={s.material} />
                    <text
                      x={
                        processing
                          ? props.x + props.width / 2
                          : source
                            ? props.x - 10
                            : props.x + props.width + 10
                      }
                      y={processing ? props.y - 12 : props.y + props.height / 2}
                      textAnchor={processing ? "middle" : source ? "end" : "start"}
                      dominantBaseline="middle"
                      fontSize={12}
                      fill="currentColor"
                    >
                      {props.payload.name}
                    </text>
                  </g>
                );
              }}
              link={(props) => (
                <Chart.SankeyLink
                  {...props}
                  material="solid"
                  finish={s.material}
                  color="#167d77"
                  pathProps={{
                    opacity: s.activeFlow && s.activeFlow !== props.payload.id ? 0.3 : 0.8,
                  }}
                />
              )}
            >
              <Tooltip
                formatter={(value) => (typeof value === "number" ? `${value} MWh` : String(value))}
              />
            </Chart.SankeyChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p role="status">
        {inspected
          ? `${data.nodes[inspected.source]?.name} → ${data.nodes[inspected.target]?.name}: ${inspected.value} MWh`
          : "No flow selected. All values are available in View data."}
      </p>
      <details>
        <summary>View data</summary>
        <div style={{ overflowX: "auto" }}>
          <Chart.SankeyTable
            data={data}
            caption="Every supplied energy flow in MWh, including measured zero reserve"
            activeLinkId={s.activeFlow}
            onInspect={(link) => set({ ...s, activeFlow: link.id })}
            formatValue={(value) => `${value} MWh`}
          />
        </div>
      </details>
    </section>
  );
}
