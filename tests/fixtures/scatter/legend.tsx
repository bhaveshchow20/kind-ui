// Host-only fixture: all chart behavior comes from the installed public tarball.
import * as Chart from "@kind-ui/charts";
import { type ScatterShapeProps, Symbols, XAxis, YAxis } from "@kind-ui/charts";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import "@kind-ui/charts/styles.css";

const symbols = ["circle", "diamond", "cross", "square", "star", "triangle", "wye"] as const;
const keys = ["search", "social", "cross", "square", "star", "triangle", "wye"];
const points = [{ x: 1, y: 2 }];
function Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" data-consumer-icon>
      <path d="M1 8H15" stroke="currentColor" />
    </svg>
  );
}
function CustomPoint(props: ScatterShapeProps) {
  return <Symbols {...props} type="cross" data-custom-point />;
}
function App() {
  const [visible, setVisible] = useState([...keys, "custom", "icon"]);
  const [updated, setUpdated] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [removed, setRemoved] = useState(false);
  const [hideIcon, setHideIcon] = useState(false);
  const [composed, setComposed] = useState(false);
  const entries = keys
    .map(
      (key, i) =>
        [
          key,
          {
            label: key === "search" ? "Search" : key === "social" ? "Social" : symbols[i],
            color: "#333",
            legendShape: key === "social" && updated ? ("star" as const) : symbols[i],
          },
        ] as const,
    )
    .filter(([key]) => !removed || key !== "social");
  if (reversed) entries.reverse();
  const config: Chart.SeriesConfig = {
    ...Object.fromEntries(entries),
    custom: { label: "Custom", color: "#333" },
    icon: { label: "Icon", color: "#333", legendShape: "triangle", icon: Icon },
    ordinary: { label: "Ordinary", color: "#333" },
  };
  function plot(label: string) {
    return (
      <Chart.ScatterChart width={500} height={140} aria-label={label}>
        <XAxis type="number" dataKey="x" domain={[0, 3]} />
        <YAxis type="number" dataKey="y" domain={[0, 4]} />
        {entries.map(([key, item], i) => (
          <Chart.ScatterSeries
            key={key}
            seriesKey={key}
            data={[{ x: 0.3 + i * 0.35, y: 2 }]}
            // Search intentionally exercises the native default circle.
            {...(key === "search" ? {} : { shape: item.legendShape })}
          />
        ))}
        <Chart.ScatterSeries seriesKey="custom" data={points} shape={CustomPoint} />
      </Chart.ScatterChart>
    );
  }
  return (
    <main>
      <h1>Scatter legend contract — monochrome</h1>
      <div>
        {[
          ["Update shape", () => setUpdated(!updated)],
          ["Reorder", () => setReversed(!reversed)],
          ["Mount charts", () => setMounted(!mounted)],
          ["Remove social", () => setRemoved(!removed)],
          ["Square fallback", () => setHideIcon(!hideIcon)],
          ["Compose markers", () => setComposed(!composed)],
        ].map(([label, action]) => (
          <button key={String(label)} type="button" onClick={action as () => void}>
            {String(label)}
          </button>
        ))}
      </div>
      <Chart.Root
        interaction={{ kind: "series", mode: "visibility", eligibleKeys: Object.keys(config) }}
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        id="primary"
      >
        <Chart.Legend
          hideIcon={hideIcon}
          aria-label="Primary legend"
          ref={(node) => {
            if (node) node.dataset.consumerRef = "ul";
          }}
        >
          {composed
            ? ({ key, label, marker }) => (
                <>
                  {key === "custom" ? (
                    <svg aria-hidden="true" width="12" height="12" data-custom-legend>
                      <path d="M0 6H12M6 0V12" stroke="currentColor" />
                    </svg>
                  ) : (
                    marker
                  )}
                  {label}
                </>
              )
            : undefined}
        </Chart.Legend>
        {mounted ? (
          <>
            {plot("First scatter")}
            {plot("Second scatter")}
          </>
        ) : null}
      </Chart.Root>
      <Chart.Root
        config={{ search: { label: "Independent Search", color: "#333", legendShape: "triangle" } }}
        id="independent"
      >
        <Chart.Legend />
      </Chart.Root>
      <Chart.Root
        interaction={{
          kind: "series",
          mode: "visibility",
          eligibleKeys: Object.keys({
            search: { label: "Read-only Search", color: "#333", legendShape: "circle" },
          }),
        }}
        config={{ search: { label: "Read-only Search", color: "#333", legendShape: "circle" } }}
        visibleSeries={[]}
        id="readonly"
      >
        <Chart.Legend />
      </Chart.Root>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
