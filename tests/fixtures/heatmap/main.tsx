import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { Edges, HeatmapRecipes } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <>
    <HeatmapRecipes />
    <Edges />
  </>,
);
