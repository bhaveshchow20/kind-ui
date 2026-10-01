import { useState } from "react";
import { createRoot } from "react-dom/client";
import { type PolarPoint, PolarRecipeCard, polarRecipes } from "./polar-recipes.js";
import "./style.css";
import "./polar.css";

const data: PolarPoint[] = [
  { category: "Speed", actual: 85, target: 75, range: [60, 90] },
  { category: "Quality", actual: 68, target: 80, range: [55, 85] },
  { category: "Reliability", actual: 92, target: 85, range: [70, 95] },
  { category: "Coverage", actual: 58, target: 70, range: [40, 75] },
  { category: "Efficiency", actual: 74, target: 65, range: [50, 80] },
];
function Showcase() {
  const [motion, setMotion] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [mode, setMode] = useState("sample");
  const rows =
    mode === "empty"
      ? []
      : data.map((row) => ({
          ...row,
          actual: mode === "zero" ? 0 : updated ? 100 - row.actual : row.actual,
        }));
  return (
    <main className="polar-showcase">
      <header>
        <a href="/">Kind UI charts</a>
        <h1>Radar & radial charts</h1>
        <p>
          Six polar recipes. Compare dimensions, show ranges, or track progress with an explicit
          scale.
        </p>
        <p>
          Focus a chart and use Left/Right to inspect values. Use the legend to toggle series, or
          open the value table.
        </p>
      </header>
      <div className="polar-controls">
        <label>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => setMotion(event.target.checked)}
          />{" "}
          Motion
        </label>
        <label>
          Data{" "}
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="sample">Sample</option>
            <option value="zero">Zero actuals</option>
            <option value="empty">Empty</option>
          </select>
        </label>
        <button type="button" onClick={() => setUpdated(!updated)}>
          Update scores
        </button>
      </div>
      <div className="polar-grid">
        {polarRecipes.map((recipe) => (
          <PolarRecipeCard key={recipe} recipe={recipe} data={rows} animate={motion} />
        ))}
      </div>
    </main>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Showcase />);
