import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { CompactHeatmap, DismissalHeatmaps, Edges, HeatmapRecipes } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <>
    <style>{`.heatmap-card { padding: 1rem; border: 1px solid #d1d5db; border-radius: 1rem; color: #172033; background: white; }`}</style>
    <HeatmapRecipes />
    <Edges />
    <CompactHeatmap />
    <DismissalHeatmaps />
  </>,
);
