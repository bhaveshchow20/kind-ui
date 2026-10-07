import * as Chart from "@kind-ui/charts";
import {
  Legend,
  LineChart,
  LineSeries,
  ResponsiveContainer,
  Root,
  Tooltip,
  TooltipContent,
} from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";
import { PercentStacks } from "./percent-stacks.js";

function Fixture({ name, color }: { name: string; color: string }) {
  const [visible, setVisible] = useState<string[]>([]);
  const [locked, setLocked] = useState(true);
  const [request, setRequest] = useState("");
  return (
    <section aria-label={name} style={{ width: "100%", minWidth: 0 }}>
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />
        Hold {name} changes
      </label>
      <output aria-label={`${name} request`}>{request}</output>
      <Root
        config={{ count: { label: `${name} tasks`, color } }}
        visibleSeries={visible}
        onVisibleSeriesChange={(next) => {
          setRequest(next.join(","));
          if (!locked) setVisible(next);
        }}
        data-owner={name}
        ref={(node) => {
          if (node) node.dataset.forwarded = "container";
        }}
      >
        <Legend
          className="gap-[19px] p-[7px] text-[17px] [&_[data-kind-ui=chart-legend-button]]:p-[3px]"
          aria-label={`${name} legend`}
          ref={(node) => {
            if (node) node.dataset.forwarded = "legend";
          }}
          onClick={(event) => {
            event.currentTarget.dataset.clicked = "yes";
          }}
        />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={[{ count: 0 }, { count: 10 }]}
            accessibilityLayer
            aria-label={`Chart ${name}`}
          >
            <LineSeries dataKey="count" stroke="var(--color-count)" />
            <Tooltip
              content={(tooltip) => (
                <TooltipContent
                  className="p-[5px] text-[18px]"
                  tooltip={tooltip}
                  aria-label={`${name} tooltip`}
                  ref={(node) => {
                    if (node) node.dataset.forwarded = "tooltip";
                  }}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </Root>
    </section>
  );
}
const data = [
  { x: "A", value: 4 },
  { x: "B", value: 8 },
  { x: "C", value: 6 },
];
// Test-only JavaScript/spread misuse; normal examples keep the supported Area API.
const unsupportedAreaInput = location.search.includes("unsupported-area")
  ? { dashAnimation: { durationMs: 800 } }
  : {};
function DashedLinesContract() {
  const [animate, setAnimate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  return (
    <section id="dashed-lines" aria-label="Animated dashed strokes">
      <h2>Animated dashed strokes</h2>
      <p>A: 4, B: 8, C: 6. The combo overlays a moving line on a static area.</p>
      <button type="button" onClick={() => setAnimate(!animate)}>
        Toggle animation
      </button>
      <button type="button" onClick={() => setLoading(!loading)}>
        Toggle loading
      </button>
      <button type="button" onClick={() => setVisible(!visible)}>
        Toggle visibility
      </button>
      <button type="button" onClick={() => setMounted(!mounted)}>
        Toggle mount
      </button>
      {mounted && (
        <>
          <section data-example="line">
            <Chart.Root
              config={{ value: { label: "Value", color: "teal" } }}
              visibleSeries={visible ? ["value"] : []}
            >
              <Chart.LineChart
                width={480}
                height={240}
                data={data}
                animate={animate}
                loading={loading}
              >
                <Chart.XAxis dataKey="x" />
                <Chart.YAxis />
                <Chart.LineSeries
                  dataKey="value"
                  strokeDasharray="6 4"
                  strokeDashoffset={3}
                  dashAnimation={{ durationMs: 800 }}
                  pointStyle="border"
                  material="glow"
                />
              </Chart.LineChart>
            </Chart.Root>
          </section>
          <section data-example="combo">
            <Chart.Root config={{ value: { label: "Value", color: "teal" } }}>
              <Chart.ComboChart
                width={480}
                height={240}
                data={data}
                animate={animate}
                loading={loading}
              >
                <Chart.XAxis dataKey="x" />
                <Chart.YAxis />
                <Chart.AreaSeries
                  {...unsupportedAreaInput}
                  dataKey="value"
                  stroke="none"
                  fillOpacity={0.2}
                />
                <Chart.LineSeries
                  dataKey="value"
                  className="reverse-dashes"
                  strokeDasharray="3 2 1"
                  dashAnimation={{ durationMs: 1200, direction: "reverse" }}
                  dot={false}
                />
                <Chart.LineSeries
                  className="style-dashes"
                  dataKey="value"
                  strokeDasharray="8 2"
                  strokeDashoffset={2}
                  style={{ strokeDasharray: "2 2", strokeDashoffset: 7, strokeWidth: 5 }}
                  dashAnimation={{ durationMs: 600 }}
                  dot={false}
                />
                <Chart.LineSeries
                  dataKey="value"
                  strokeDasharray="6 4"
                  dashAnimation={{}}
                  shape={<Chart.Curve data-custom="owned" />}
                />
              </Chart.ComboChart>
            </Chart.Root>
          </section>
        </>
      )}
    </section>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(
  <main style={{ width: "90vw", maxWidth: 700, margin: "auto" }}>
    <Fixture name="A" color="#2563eb" />
    <Fixture name="B" color="#15803d" />
    <PercentStacks />
    <DashedLinesContract />
