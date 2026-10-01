import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./pies.css";
import { Allocation } from "./pie-recipes.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <main>
    <header>
      <a href="./">Kind UI charts</a>
      <h1>Pie &amp; donut</h1>
      <p>Native composition, stable categories, and a readable data alternative.</p>
    </header>
    <div className="pie-grid">
      <Allocation />
      <Allocation donut />
    </div>
  </main>,
);
