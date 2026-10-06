import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";

const data = [
  { x: "A", value: 4 },
  { x: "B", value: 8 },
  { x: "C", value: 6 },
];
// Test-only JavaScript/spread misuse; normal examples keep the supported Area API.
const unsupportedAreaInput = location.search.includes("unsupported-area")
  ? { dashAnimation: { durationMs: 800 } }
  : {};
function Example() {
  const [animate, setAnimate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  return (
    <main>
      <h1>Animated dashed strokes</h1>
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
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing example root");
createRoot(root).render(<Example />);
