import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "@fontsource-variable/geist";
import "./heatmaps.css";
import { HeatmapRecipes } from "./heatmap-recipes.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<HeatmapRecipes />);
