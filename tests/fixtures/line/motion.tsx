import * as Motion from "@kind-ui/charts/motion";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { LineHost } from "./host.js";

function App() {
  const [enabled, setEnabled] = useState(true);
  const props: Motion.LineChartProps = {
    motion: enabled ? { revealDurationMs: 800, hoverTransition: { duration: 0.4 } } : false,
  };
  return (
    <>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Animate
      </label>
      <LineHost components={Motion} chartProps={props} />
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
