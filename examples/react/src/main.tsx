import {
  DataTable,
  darkTheme,
  LineChart,
  lightTheme,
  type MissingPolicy,
  normalizeSeries,
} from "@kind-ui/charts";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const observations = [
  { id: "2026-01", label: "January", x: 1, y: 8 },
  { id: "2026-02", label: "February", x: 2, y: null },
  { id: "2026-03", label: "March", x: 3, y: 12 },
  { id: "2026-04", label: "April", x: 4, y: 9.5 },
  { id: "2026-05", label: "May", x: 5, y: 15 },
  { id: "2026-06", label: "June", x: 6, y: 13.25 },
];

function App() {
  const [missing, setMissing] = useState<MissingPolicy>("gap");
  const [dark, setDark] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [selectedId, onSelectionChange] = useState<string | null>(null);
  const model = useMemo(
    () =>
      normalizeSeries(reversed ? [...observations].reverse() : observations, {
        missing,
        x: { kind: "number", unit: null },
        y: { unit: "kWh" },
      }),
    [missing, reversed],
  );
  return (
    <main>
      <p className="eyebrow">KIND UI · CHARTS FIRST</p>
      <header>
        <div>
          <h1>One model. Two linked views.</h1>
          <p>Explicit missing data, stable identity, and a table you can trust.</p>
        </div>
        <span className="badge">Local scaffold</span>
      </header>
      <section className="panel" aria-labelledby="energy-title">
        <div className="section-heading">
          <div>
            <h2 id="energy-title">Monthly energy use</h2>
            <p>Sample data · January–June 2026 · kWh</p>
          </div>
        </div>
        <div className="controls">
          <label>
            Missing values{" "}
            <select
              value={missing}
              onChange={(event) => setMissing(event.target.value as MissingPolicy)}
            >
              <option value="gap">Preserve gaps</option>
              <option value="zero">Explicitly impute zero</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={dark}
              onChange={(event) => setDark(event.target.checked)}
            />{" "}
            Dark chart
          </label>
          <button type="button" onClick={() => setReversed((value) => !value)}>
            Reverse input order
          </button>
          <button
            type="button"
            onClick={() => onSelectionChange(null)}
            disabled={selectedId === null}
          >
            Clear selection
          </button>
        </div>
        <div className="chart">
          <LineChart
            model={model}
            title="Monthly energy use"
            selectedId={selectedId}
            onSelectionChange={onSelectionChange}
            theme={dark ? darkTheme : lightTheme}
          />
        </div>
        <p className="status" aria-live="polite">
          {selectedId
            ? `Selected: ${model.points.find((point) => point.id === selectedId)?.label}`
            : "Select a point or table row to link both views"}
        </p>
        <div className="table-scroll">
          <DataTable
            model={model}
            caption="Exact source values. Imputed values stay visibly marked."
            selectedId={selectedId}
            onSelectionChange={onSelectionChange}
          />
        </div>
      </section>
      <section className="panel guide" aria-labelledby="usage-title">
        <p className="eyebrow">MAINTAINED RUNTIME + YOUR COMPOSITION</p>
        <h2 id="usage-title">Use the package. Own the recipe.</h2>
        <p>
          A small React chart package starts this UI-library family. The optional CLI copies an
          editable composition like this one, while normalization, geometry, and accessible
          rendering stay in maintained Kind UI packages. Every package remains private and
          unpublished; npm scope ownership is unverified.
        </p>
        <div className="guide-grid">
          <div>
            <h3>One application-owned selection</h3>
            <pre>
              <code>{`import { LineChart, DataTable, normalizeSeries }
  from "@kind-ui/charts";

// model = normalizeSeries(data, explicitOptions)
// selectedId and onSelectionChange belong to your app
<LineChart model={model} title="Energy"
  selectedId={selectedId}
  onSelectionChange={onSelectionChange} />
<DataTable model={model} caption="Exact values"
  selectedId={selectedId}
  onSelectionChange={onSelectionChange} />`}</code>
            </pre>
            <p className="note">
              Usage excerpt. The complete component is bundled as the charts/line recipe.
            </p>
          </div>
          <div>
            <h3>Optional local CLI</h3>
            <pre>
              <code>{`# From the built workspace, target a React TS app
node packages/cli/dist/bin.js init --cwd /path/to/app
node packages/cli/dist/bin.js add charts/line \\
  --cwd /path/to/app --dry-run
# Remove --dry-run after inspecting the plan`}</code>
            </pre>
            <p className="note">
              Bundled files only. No network fetching, automatic installs, or file overwrites.
              Repeated adds preserve your recorded recipe edits; automatic recipe upgrades are not
              implemented.
            </p>
          </div>
        </div>
        <h3>Small API, explicit contracts</h3>
        <dl className="api-list">
          <div>
            <dt>normalizeSeries(data, options)</dt>
            <dd>
              Stable IDs, units, and an explicit missing-value policy become one immutable model.
            </dd>
          </div>
          <div>
            <dt>LineChart / DataTable</dt>
            <dd>
              Two views consume that same model and emit stable selection IDs to the application.
            </dd>
          </div>
          <div>
            <dt>lightTheme / darkTheme</dt>
            <dd>Paint tokens change appearance without changing values, geometry, or domains.</dd>
          </div>
        </dl>
        <p className="note">
          Foundation only: one series, React 19, and SVG. Production browser, assistive-technology,
          narrow-container, and performance validation remain open. The table is this chart’s
          exact-value companion; a separate general table product is not scaffolded.
        </p>
      </section>
      <footer>
        February is intentionally missing. Change the missing-value policy and watch the domain.
        Reordering keeps selection stable.
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
