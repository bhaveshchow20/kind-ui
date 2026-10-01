import type * as Motion from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { AreaHost } from "./host.js";

function App() {
  const [enabled, setEnabled] = useState(true);
  const [defaults, setDefaults] = useState(false);
  const props: Motion.AreaChartProps = {
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
