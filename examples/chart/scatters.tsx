import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "@fontsource-variable/geist";
import "./scatters.css";
import { ScatterRecipes } from "./scatter-recipes.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<ScatterRecipes />);
