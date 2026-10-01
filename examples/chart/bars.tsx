import type { SeriesConfig } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type BarPoint,
  type GroupedBarPoint,
  GroupedBars,
  HorizontalBars,
  type StackedBarPoint,
  StackedBars,
  VerticalBars,
} from "./bar-recipes.js";
import { useReducedMotionPreference } from "./use-reduced-motion.js";
import "./style.css";
import "./recipes.css";

const counts: BarPoint[] = [
  { category: "Mon", value: 18 },
  { category: "Tue", value: 26 },
  { category: "Wed", value: null },
  { category: "Thu", value: 0 },
  { category: "Fri", value: 34 },
];
const channels: BarPoint[] = [
  { category: "Chat", value: 42 },
  { category: "Search", value: 31 },
  { category: "Workflow", value: 24 },
  { category: "Email", value: 16 },
];
const comparison: GroupedBarPoint[] = [
  { category: "Mon", primary: 18, secondary: 14 },
  { category: "Tue", primary: 26, secondary: 20 },
  { category: "Wed", primary: null, secondary: 22 },
  { category: "Thu", primary: 0, secondary: 16 },
  { category: "Fri", primary: 34, secondary: 28 },
];
const outcomes: StackedBarPoint[] = [
  { category: "Mon", primary: 18, secondary: 4 },
  { category: "Tue", primary: 26, secondary: 3 },
  { category: "Wed", primary: 22, secondary: 6 },
  { category: "Thu", primary: 0, secondary: 5 },
  { category: "Fri", primary: 34, secondary: 0 },
];
const tasks = (value: number) => `${value} tasks`;
const formatValue: SeriesConfig[string]["formatValue"] = (value) =>
  typeof value === "number" ? tasks(value) : "No data";
const comparisonConfig = {
  primary: { label: "This week", color: "var(--chart-1)", formatValue },
  secondary: { label: "Last week", color: "var(--chart-2)", formatValue },
} satisfies SeriesConfig;
const outcomeConfig = {
  primary: { label: "Completed", color: "var(--chart-1)", formatValue },
  secondary: { label: "Retried", color: "var(--chart-2)", formatValue },
} satisfies SeriesConfig;
function Table({ data, labels }: { data: (BarPoint | GroupedBarPoint)[]; labels: string[] }) {
  return (
    <details>
      <summary>View data</summary>
      <table>
        <caption>Sample task counts</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            {labels.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.category}>
              <th scope="row">{row.category}</th>
              {("value" in row ? [row.value] : [row.primary, row.secondary]).map((value, index) => (
                <td key={labels[index]}>{value === null ? "No data" : tasks(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
function App() {
  const [palette, setPalette] = useState("monochrome");
  const [motion, setMotion] = useState(false);
  const [empty, setEmpty] = useState(false);
  const reduced = useReducedMotionPreference();
  const animate = motion && !reduced;
  const animation = animate ? {} : undefined;
  return (
    <main className="recipes" data-palette={palette} data-motion={animate ? "on" : "off"}>
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Bar recipes</h1>
        <a href="/recipes.html">Line recipes</a>
      </header>
      <div className="recipes-controls">
        <fieldset aria-label="Palette">
          <legend className="sr-only">Palette</legend>
          {["monochrome", "color"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={palette === value}
              onClick={() => setPalette(value)}
            >
              {value === "color" ? "Color" : "Monochrome"}
            </button>
          ))}
        </fieldset>
        <label>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => setMotion(event.target.checked)}
          />
          Motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />
          Empty data
        </label>
      </div>
      <div className="recipe-stack">
        <section className="recipe-card" aria-labelledby="vertical-title">
          <h2 id="vertical-title">Vertical</h2>
          <p className="recipe-description">Daily completions · Mon–Fri</p>
          {empty ? (
            <p className="recipe-empty" role="status">
              No daily data
            </p>
          ) : (
            <>
              <VerticalBars
                data={counts}
                label="Daily completions"
                formatValue={tasks}
                motion={animation}
              />
              <p className="recipe-note">
                Wednesday is unknown. Thursday is zero; neither gets an invented bar.
              </p>
              <Table data={counts} labels={["Completed"]} />
            </>
          )}
        </section>
        <section className="recipe-card" aria-labelledby="horizontal-title">
          <h2 id="horizontal-title">Horizontal</h2>
          <p className="recipe-description">Completed tasks by channel</p>
          {empty ? (
            <p className="recipe-empty" role="status">
              No channel data
            </p>
          ) : (
            <>
              <HorizontalBars
                data={channels}
                label="Tasks by channel"
                formatValue={tasks}
                motion={animation}
              />
              <p className="recipe-note">Category labels remain visible in a narrow card.</p>
              <Table data={channels} labels={["Completed"]} />
            </>
          )}
        </section>
        <section className="recipe-card" aria-labelledby="grouped-title">
          <h2 id="grouped-title">Grouped</h2>
          <p className="recipe-description">Compare the same weekday across two weeks</p>
          {empty ? (
            <p className="recipe-empty" role="status">
              No comparison data
            </p>
          ) : (
            <>
              <GroupedBars
                data={comparison}
                label="Weekly comparison"
                config={comparisonConfig}
                motion={animation}
              />
              <p className="recipe-note">Missing values retain their category and tooltip entry.</p>
              <Table data={comparison} labels={["This week", "Last week"]} />
            </>
          )}
        </section>
        <section className="recipe-card" aria-labelledby="stacked-title">
          <h2 id="stacked-title">Stacked</h2>
          <p className="recipe-description">Task outcomes · complete daily totals</p>
          {empty ? (
            <p className="recipe-empty" role="status">
              No outcome data
            </p>
          ) : (
            <>
              <StackedBars
                data={outcomes}
                label="Task outcomes"
                config={outcomeConfig}
                motion={animation}
              />
              <p className="recipe-note">
                Completed + retried. Only complete, nonnegative segments belong in a total.
              </p>
              <Table data={outcomes} labels={["Completed", "Retried"]} />
            </>
          )}
        </section>
      </div>
      <footer>Sample data</footer>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
