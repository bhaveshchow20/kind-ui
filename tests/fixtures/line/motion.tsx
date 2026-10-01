import type * as Motion from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { LineHost, MaterialsHost } from "./host.js";

function App() {
  const [enabled, setEnabled] = useState(true);
  const [defaults, setDefaults] = useState(false);
  const props: Motion.LineChartProps = {
    animate: enabled
      ? defaults
        ? true
        : { revealDurationMs: 800, hoverTransition: { duration: 0.4 } }
      : false,
  };
  return (
    <>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Animate
      </label>
      <label>
        <input type="checkbox" checked={defaults} onChange={(e) => setDefaults(e.target.checked)} />
        Default animation
      </label>
      {location.search.includes("materials") ? (
        <MaterialsHost chartProps={props} />
      ) : (
        <LineHost chartProps={props} />
      )}
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
