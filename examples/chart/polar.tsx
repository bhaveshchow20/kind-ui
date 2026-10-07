import type { PolarMaterial } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PolarGalleryCard } from "./polar-gallery.js";
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
  const [motion, setMotion] = useState(true);
  const [palette, setPalette] = useState("mono");
  const [material, setMaterial] = useState<PolarMaterial>("plain");
  const [showText, setShowText] = useState(true);
  const [tooltips, setTooltips] = useState(true);
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
    <main className="polar-showcase" data-palette={palette}>
      <header>
        <a href="/">Kind UI charts</a>
        <h1>Radar & radial charts</h1>
        <p>
          Six polar recipes and all 18 official gallery variations. Compare dimensions, show ranges,
          or track progress with an explicit scale.
        </p>
        <p>
          Focus a chart and use Left/Right to inspect values; Enter toggles the current tooltip. Use
          the legend to toggle series, or open the value table.
        </p>
      </header>
      <div className="polar-controls">
        <label>
          Color{" "}
          <select
            aria-label="Color"
            value={palette}
            onChange={(event) => setPalette(event.target.value)}
          >
            <option value="mono">Monochrome</option>
            <option value="color">Violet</option>
            <option value="pink">Pink</option>
          </select>
        </label>
        <label>
          Material{" "}
          <select
            aria-label="Material"
            value={material}
            onChange={(event) => setMaterial(event.target.value as PolarMaterial)}
          >
            <option value="plain">Default</option>

            <option value="clay">Clay</option>
            <option value="glow">Glow</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => setMotion(event.target.checked)}
          />{" "}
          Motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={showText}
            onChange={(event) => setShowText(event.target.checked)}
          />{" "}
          Chart text
        </label>
        <label>
          <input
            type="checkbox"
            checked={tooltips}
            onChange={(event) => setTooltips(event.target.checked)}
          />{" "}
          Tooltips
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
          <PolarRecipeCard
            key={recipe}
            recipe={recipe}
            data={rows}
            material={material}
            animate={motion}
            showText={showText}
            tooltips={tooltips}
          />
        ))}
        <PolarGalleryCard
          kind="radar"
          data={rows}
          material={material}
          animate={motion}
          showText={showText}
          tooltips={tooltips}
        />
        <PolarGalleryCard
          kind="radial"
          data={rows}
          material={material}
          animate={motion}
          showText={showText}
          tooltips={tooltips}
        />
      </div>
    </main>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Showcase />);
