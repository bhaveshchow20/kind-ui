import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./recipes.css";
import "./combos.css";
import {
  BalanceCombo,
  balanceData,
  ForecastCombo,
  forecastData,
  LoadCombo,
  loadData,
} from "./combo-recipes.js";
import { useReducedMotionPreference } from "./use-reduced-motion.js";

const recipes = [
  {
    title: "Workload & latency",
    eyebrow: "Three families · two axes",
    Component: LoadCombo,
    data: loadData,
    columns: ["Completed tasks", "Queued tasks", "Latency (ms)"],
    note: "Counts use the left axis; latency uses the right axis in milliseconds. Noon records zero tasks.",
  },
  {
    title: "Net cash against plan",
    eyebrow: "Signed stacks · missing data",
    Component: BalanceCombo,
    data: balanceData,
    columns: ["Product ($k)", "Services ($k)", "Plan ($k)"],
    note: "Product and services stack by sign. Wednesday is zero; Thursday was not recorded, so the plan has a gap.",
  },
  {
    title: "Actuals & forecast",
    eyebrow: "Step area · custom diamond marks",
    Component: ForecastCombo,
    data: forecastData,
    columns: ["Actual tasks", "Capacity tasks", "Forecast tasks"],
    note: "Actuals stop after March. The step area shows capacity; diamonds and a dashed line identify the forecast.",
  },
];
function App() {
  const [motion, setMotion] = useState(false);
  const [barMotion, setBarMotion] = useState(true);
  const reduced = useReducedMotionPreference();
  return (
    <main className="recipes combo-recipes" data-motion={motion && !reduced ? "on" : "off"}>
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Combo recipes</h1>
        <nav aria-label="Chart families">
          <a href="/recipes.html">Line</a>
          <a href="/areas.html">Area</a>
          <a href="/bars.html">Bar</a>
        </nav>
      </header>
      <div className="recipes-controls">
        <label>
          <input type="checkbox" checked={motion} onChange={(e) => setMotion(e.target.checked)} />
          Motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={barMotion}
            onChange={(e) => setBarMotion(e.target.checked)}
          />
          Bar entrance
        </label>
        <span>
          {reduced
            ? "Reduced motion: animations disabled."
            : "Line 700 ms · area 1100 ms · bar 900 ms"}
        </span>
      </div>
      <div className="recipe-stack">
        {recipes.map(({ title, eyebrow, Component, data, columns, note }, index) => (
          <section
            className={`recipe-card ${index === 2 ? "recipe-wide" : ""}`}
            aria-label={title}
            key={title}
          >
            <div className="recipe-eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
            <p className="recipe-description">Sample data · toggle a legend to compare</p>
            <Component
              animate={
                motion
                  ? {
                      lineReveal: { revealDurationMs: 700 },
                      areaReveal: { revealDurationMs: 1100 },
                      barReveal: barMotion ? { revealDurationMs: 900 } : false,
                    }
                  : false
              }
            />
            <p className="recipe-note">{note}</p>
            <details>
              <summary>View data</summary>
              <table>
                <caption>{title}, all series</caption>
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    {columns.map((name) => (
                      <th scope="col" key={name}>
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.period}>
                      <th scope="row">{row.period}</th>
                      {[row.volume, row.buffer, row.latency].map((value, column) => (
                        <td key={columns[column]}>{value === null ? "No data" : value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        ))}
      </div>
      <footer>
        Sample data · keyboard arrows select a period · legends control each chart independently.
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
