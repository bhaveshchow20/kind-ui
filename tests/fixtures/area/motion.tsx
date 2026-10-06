import type * as Motion from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { AreaHost } from "./host.js";

const requestedDirection = new URLSearchParams(location.search).get("direction");
const directions: Motion.RevealDirection[] = [
  "left-to-right",
  "right-to-left",
  "center-out",
  "edges-in",
];
const revealDirection = directions.find((value) => value === requestedDirection);

function App() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [defaults, setDefaults] = useState(false);
  const props: Motion.AreaChartProps = {
    loading,
    animate: enabled
      ? defaults
        ? true
        : {
            revealDurationMs: 800,
            ...(revealDirection ? { revealDirection } : {}),
            hoverTransition: { duration: 0.4 },
          }
      : false,
  };
  return (
    <>
      <button type="button" onClick={() => setLoading(!loading)}>
        Toggle loading
      </button>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Animate
      </label>
      <label>
        <input type="checkbox" checked={defaults} onChange={(e) => setDefaults(e.target.checked)} />
        Default animation
      </label>
      <AreaHost
        chartProps={props}
        nativeVisibility={new URLSearchParams(window.location.search).has("native-visibility")}
      />
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
