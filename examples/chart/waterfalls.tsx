import * as Chart from "@kind-ui/charts";
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { WaterfallRecipe, WaterfallTable, waterfallSample } from "./waterfall-recipes.js";
import "./style.css";
import "./recipes.css";
import "./waterfalls.css";

function App() {
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [animate, setAnimate] = useState(true);
  const [visible, setVisible] = useState(true);
  const [hide, setHide] = useState(false);
  const [custom, setCustom] = useState(false);
  const [mode, setMode] = useState("mixed");
  const [updated, setUpdated] = useState(false);
  const [clicks, setClicks] = useState(0);
  const data = useMemo(
    () =>
      Chart.computeWaterfallData(
        mode === "empty"
          ? []
          : waterfallSample.map((row) => {
              if (row.kind === "subtotal") return row;
              if (mode === "zero") return { ...row, value: 0 };
              if (mode === "negative")
                return { ...row, value: row.value === null ? null : -Math.abs(row.value) };
              if (mode === "missing" && row.id === "costs") return { ...row, value: null };
              if (updated && row.id === "sales") return { ...row, value: 100 };
              if (updated && row.id === "closing") return { ...row, value: 90 };
              return row;
            }),
      ),
    [mode, updated],
  );
  return (
    <main className="recipes waterfall-recipes" data-palette="color">
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Waterfall recipes</h1>
        <p>Explicit balances, signed changes and honest gaps.</p>
      </header>
      <div className="recipes-controls">
        <fieldset aria-label="Material">
          <legend className="sr-only">Material</legend>
          {(["plain", "clay", "glow"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={material === value}
              onClick={() => setMaterial(value)}
            >
              {value === "plain" ? "Default" : value}
            </button>
          ))}
        </fieldset>
        <label>
          <input
            type="checkbox"
            checked={animate}
            onChange={(event) => setAnimate(event.target.checked)}
          />
          Motion
        </label>
        <label>
          Values{" "}
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            {["mixed", "negative", "zero", "missing", "empty"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(event) => setVisible(event.target.checked)}
          />
          Visible
        </label>
        <label>
          <input
            type="checkbox"
            checked={hide}
            onChange={(event) => setHide(event.target.checked)}
          />
          Native hide
        </label>
        <label>
          <input
            type="checkbox"
            checked={custom}
            onChange={(event) => setCustom(event.target.checked)}
          />
          Native extensions
        </label>
        <button type="button" onClick={() => setUpdated(!updated)}>
          Update values
        </button>
      </div>
      <div className="recipe-stack">
        <section className="recipe-card" aria-label="Balance bridge">
          <h2>Balance bridge</h2>
          <p className="recipe-description">Opening → signed changes → subtotal → closing</p>
          {data.length ? (
            <WaterfallRecipe
              data={data}
              label="Waterfall balance bridge"
              material={material}
              animate={animate}
              visible={visible}
              hide={hide}
              custom={custom}
              onClick={() => setClicks((count) => count + 1)}
            />
          ) : (
            <p role="status">No waterfall data</p>
          )}
          <p className="recipe-note">
            Totals establish a balance. Subtotals show it without adding it again. Costs cross zero;
            Refund is exactly zero. Missing costs make later balances unknown until Closing supplies
            a total.
          </p>
          <p className="recipe-note">
            Native shape and labels are optional. Mark clicks:{" "}
            <output aria-label="Mark clicks">{clicks}</output>
          </p>
          <WaterfallTable data={data} />
        </section>
      </div>
      <footer>Sample units · motion enabled by default; respects reduced motion.</footer>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
