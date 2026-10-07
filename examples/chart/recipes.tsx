import { LineChart, type LineMaterial, type PointStyle, type SeriesConfig } from "@kind-ui/charts";
import { type CSSProperties, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ComparisonLine,
  type ComparisonPoint,
  CustomMarkerLine,
  DotsLine,
  LabeledLine,
  SmoothLine,
  StepLine,
  TargetLine,
  TrendLine,
  type TrendPoint,
} from "./line-recipes";
import { useReducedMotionPreference } from "./use-reduced-motion.js";
import "./style.css";
import "./recipes.css";

const volume: TrendPoint[] = [
  { period: "Mon", value: 18 },
  { period: "Tue", value: 26 },
  { period: "Wed", value: 23 },
  { period: "Thu", value: 34 },
  { period: "Fri", value: 31 },
  { period: "Sat", value: 42 },
  { period: "Sun", value: 48 },
];
const latency: TrendPoint[] = [
  { period: "Mon", value: 280 },
  { period: "Tue", value: 260 },
  { period: "Wed", value: null },
  { period: "Thu", value: 230 },
  { period: "Fri", value: 210 },
  { period: "Sat", value: 195 },
  { period: "Sun", value: 180 },
];
const comparison: ComparisonPoint[] = [
  { period: "Mon", current: null, previous: 14 },
  { period: "Tue", current: 26, previous: 20 },
  { period: "Wed", current: null, previous: 22 },
  { period: "Thu", current: 0, previous: 16 },
  { period: "Fri", current: 31, previous: 24 },
  { period: "Sat", current: 42, previous: 30 },
  { period: "Sun", current: 48, previous: 32 },
];
const tasks = (value: number) => `${value} tasks`;
const milliseconds = (value: number) => `${value} ms`;
const config = {
  current: {
    label: "This week",
    color: "var(--chart-1)",
    formatValue: (value) => (typeof value === "number" ? tasks(value) : "No data"),
  },
  previous: {
    label: "Last week",
    color: "var(--chart-2)",
    formatValue: (value) => (typeof value === "number" ? tasks(value) : "No data"),
  },
} satisfies SeriesConfig;

const markerData = [
  { month: "Jan", total: 4 },
  { month: "Feb", total: 9 },
  { month: "Mar", total: 6 },
];
const variants: PointStyle[] = ["default", "border", "colored-border"];
function MarkerGallery() {
  const [dark, setDark] = useState(false);
  return (
    <section
      id="point-markers"
      aria-label="Point markers"
      className="recipe-card"
      style={
        {
          "--gallery-series": dark ? "#9eaaff" : "#4055ee",
          "--kind-ui-chart-marker-surface": dark ? "#172033" : "white",
          background: dark ? "#172033" : "white",
          color: dark ? "white" : "#172033",
          padding: 24,
        } as CSSProperties
      }
    >
      <button type="button" aria-pressed={dark} onClick={() => setDark(!dark)}>
        Toggle theme
      </button>
      <h2>Point markers</h2>
      <p>Focus a chart and use arrow keys, or move the pointer, to inspect values.</p>
      {variants.map((variant) => (
        <section key={variant}>
          <h3>{variant}</h3>
          <LineChart
            config={{ total: { label: "Total", color: "var(--gallery-series)" } }}
            data={markerData}
            xDataKey="month"
            aria-label={`${variant} markers`}
            series={[
              {
                seriesKey: "total",
                dataKey: "total",
                pointStyle: variant,
                activePointStyle: variant,
              },
            ]}
          />
        </section>
      ))}
      <table>
        <caption>Monthly totals</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {markerData.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function App() {
  const [palette, setPalette] = useState("monochrome");
  const [material, setMaterial] = useState<LineMaterial>("plain");
  const [guide, setGuide] = useState(false);
  const [motion, setMotion] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  const [empty, setEmpty] = useState(false);
  const [visible, setVisible] = useState<string[]>(["current", "previous"]);
  const animate = motion && !reducedMotion;
  return (
    <main
      className="recipes"
      data-palette={palette}
      data-material={material}
      data-motion={animate ? "on" : "off"}
    >
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Line recipes</h1>
        <nav aria-label="Chart families">
          <a href="/areas.html">Area recipes</a>
          <a href="/bars.html">Bar recipes</a>
        </nav>
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
        <fieldset aria-label="Line material">
          <legend className="sr-only">Line material</legend>
          {(["plain", "paper", "clay", "glow"] satisfies LineMaterial[]).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={material === value}
              onClick={() => setMaterial(value)}
            >
              {value === "plain"
                ? "Plain"
                : value === "paper"
                  ? "Paper"
                  : value === "clay"
                    ? "Clay"
                    : "Glow"}
            </button>
          ))}
        </fieldset>
        <label>
          <input
            type="checkbox"
            checked={guide}
            onChange={(event) => setGuide(event.target.checked)}
          />{" "}
          Hover guide
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
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty data
        </label>
      </div>
      <div className="recipe-stack">
        {[
          { title: "Smooth", Component: SmoothLine },
          { title: "Step", Component: StepLine },
          { title: "Dots", Component: DotsLine },
          { title: "Custom markers", Component: CustomMarkerLine },
          { title: "Labels", Component: LabeledLine },
        ].map(({ title, Component }) => (
          <section className="recipe-card" aria-label={title} key={title}>
            <h2>{title}</h2>
            <p className="recipe-description">Daily completions · Mon–Sun</p>
            {empty ? (
              <p role="status" className="recipe-empty">
                No data yet.
              </p>
            ) : (
              <Component
                data={volume}
                label={`${title} daily completions`}
                formatValue={tasks}
                animate={animate}
                material={material}
                guide={guide}
              />
            )}
            <details>
              <summary>View data</summary>
              <TrendTable
                data={empty ? [] : volume}
                caption={`${title}, daily completions`}
                formatValue={tasks}
              />
            </details>
          </section>
        ))}

        <section className="recipe-card" aria-labelledby="trend-title">
          <div className="recipe-eyebrow">Linear</div>
          <h2 id="trend-title">Tasks completed</h2>
          <p className="recipe-metric">
            {empty ? "—" : "48"}
            <span>Sunday · tasks</span>
          </p>
          {empty ? (
            <p role="status" className="recipe-empty">
              No data yet.
            </p>
          ) : (
            <TrendLine
              data={volume}
              label="Completed tasks"
              formatValue={tasks}
              animate={animate}
              material={material}
              guide={guide}
            />
          )}
          <p className="recipe-note">Daily completions · Mon–Sun</p>
          <details>
            <summary>View data</summary>
            <TrendTable
              data={empty ? [] : volume}
              caption="Completed tasks by day"
              formatValue={tasks}
            />
          </details>
        </section>
        <section className="recipe-card" aria-labelledby="target-title">
          <div className="recipe-eyebrow">Target</div>
          <h2 id="target-title">Response time</h2>
          <p className="recipe-metric">
            {empty ? "—" : "180"}
            <span>Sunday · milliseconds</span>
          </p>
          {empty ? (
            <p role="status" className="recipe-empty">
              No data yet.
            </p>
          ) : (
            <TargetLine
              data={latency}
              label="Response time in milliseconds"
              formatValue={milliseconds}
              target={240}
              targetLabel="Budget"
              animate={animate}
              material={material}
              guide={guide}
            />
          )}
          <p className="recipe-note">Lower is faster. Wednesday was not recorded.</p>
          <details>
            <summary>View data</summary>
            <TrendTable
              data={empty ? [] : latency}
              caption="Response time by day"
              formatValue={milliseconds}
            />
          </details>
        </section>
        <section className="recipe-card recipe-wide" aria-labelledby="compare-title">
          <div className="recipe-eyebrow">Multiple · interactive legend</div>
          <h2 id="compare-title">Week over week</h2>
          <p className="recipe-description">Daily completions, with last week for context.</p>
          {empty ? (
            <p role="status" className="recipe-empty">
              No data yet.
            </p>
          ) : (
            <ComparisonLine
              data={comparison}
              config={config}
              visibleSeries={visible}
              onVisibleSeriesChange={setVisible}
              label="Weekly comparison"
              animate={animate}
              material={material}
              guide={guide}
            />
          )}
          <p className="recipe-note">
            Gaps mean no data; zero stays zero. Last week is dashed. Hidden series remain in the
            table.
          </p>
          <details>
            <summary>View data</summary>
            <table>
              <caption>Weekly comparison, all series</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">This week</th>
                  <th scope="col">Last week</th>
                </tr>
              </thead>
              <tbody>
                {empty ? (
                  <tr>
                    <td colSpan={3}>No data yet.</td>
                  </tr>
                ) : (
                  comparison.map((row) => (
                    <tr key={row.period}>
                      <th scope="row">{row.period}</th>
                      <td>{row.current == null ? "No data" : tasks(row.current)}</td>
                      <td>{row.previous == null ? "No data" : tasks(row.previous)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </details>
        </section>
      </div>
      <MarkerGallery />
      <footer>Sample data</footer>
    </main>
  );
}
function TrendTable({
  data,
  caption,
  formatValue,
}: {
  data: TrendPoint[];
  caption: string;
  formatValue: (value: number) => string;
}) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {data.length ? (
          data.map((row) => (
            <tr key={row.period}>
              <th scope="row">{row.period}</th>
              <td>{row.value == null ? "No data" : formatValue(row.value)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2}>No data yet.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
