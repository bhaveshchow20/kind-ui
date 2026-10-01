import type { SeriesConfig } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type BarPoint,
  CategoryBars,
  CustomLabelBars,
  type GroupedBarPoint,
  GroupedBars,
  HighlightedBars,
  HorizontalBars,
  InteractiveBars,
  LabeledBars,
  SignedBars,
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
const labeledCounts: BarPoint[] = [
  { category: "Mon", value: 18 },
  { category: "Tue", value: 26 },
  { category: "Wed", value: 22 },
  { category: "Thu", value: 0 },
  { category: "Fri", value: 34 },
];
const labeledChannels = channels.map((point) =>
  point.category === "Email" ? { ...point, value: 2 } : point,
);
const categoryCounts = channels.map((point, index) => ({
  ...point,
  color: `var(--chart-${index + 1})`,
}));
const signedCounts: BarPoint[] = [
  { category: "Mon", value: 18 },
  { category: "Tue", value: -12 },
  { category: "Wed", value: null },
  { category: "Thu", value: 0 },
  { category: "Fri", value: -24 },
  { category: "Sat", value: 32 },
];
// Fixed sample dates and counts. Real data and date formatting belong to the host.
const dailyViews: GroupedBarPoint[] = Array.from({ length: 90 }, (_, day) => ({
  category: new Date(Date.UTC(2026, 3, day + 1)).toISOString().slice(0, 10),
  primary: 20 + ((day * 17) % 61),
  secondary: 15 + ((day * 23) % 73),
}));
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const dateLabel = (value: string) => dateFormatter.format(new Date(`${value}T00:00:00Z`));
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
  const [activeSeries, setActiveSeries] = useState<"primary" | "secondary">("primary");
  const [highlightedCategory, setHighlightedCategory] = useState("Wed");
  const [signedMode, setSignedMode] = useState<"mixed" | "negative" | "zero">("mixed");
  const [empty, setEmpty] = useState(false);
  const reduced = useReducedMotionPreference();
  const animate = motion && !reduced;
  const animation = animate ? {} : undefined;
  const signedData = signedCounts.map((point) => ({
    ...point,
    value:
      point.value === null
        ? null
        : signedMode === "negative"
          ? -Math.abs(point.value)
          : signedMode === "zero"
            ? 0
            : point.value,
  }));
  const extraExamples = [
    {
      title: "Labels",
      description: "Values above each bar",
      data: labeledCounts,
      chart: (
        <LabeledBars
          data={labeledCounts}
          label="Labeled completions"
          formatValue={tasks}
          motion={animation}
        />
      ),
    },
    {
      title: "Custom labels",
      description: "Category inside the bar; value at its end",
      data: labeledChannels,
      chart: (
        <CustomLabelBars
          data={labeledChannels}
          label="Labeled channels"
          formatValue={tasks}
          motion={animation}
        />
      ),
    },
    {
      title: "Category colors",
      description: "Each channel has a distinct color",
      data: categoryCounts,
      chart: (
        <CategoryBars
          data={categoryCounts}
          label="Colored channels"
          formatValue={tasks}
          motion={animation}
        />
      ),
    },
  ];
  return (
    <main
      className="recipes bar-recipes"
      data-palette={palette}
      data-motion={animate ? "on" : "off"}
    >
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Bar recipes</h1>
        <nav aria-label="Chart families">
          <a href="/recipes.html">Line recipes</a>
          <a href="/areas.html">Area recipes</a>
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
              <p className="recipe-note">
                Missing categories stay in the table; zero remains a value.
              </p>
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
        {extraExamples.map((example) => (
          <section className="recipe-card" key={example.title} aria-label={example.title}>
            <h2>{example.title}</h2>
            <p className="recipe-description">{example.description}</p>
            {empty ? (
              <p className="recipe-empty" role="status">
                No example data
              </p>
            ) : (
              <>
                {example.chart}
                <Table data={example.data} labels={["Completed"]} />
              </>
            )}
          </section>
        ))}
        <section className="recipe-card" aria-label="Highlighted">
          <h2>Highlighted</h2>
          <p className="recipe-description">Keep one category in focus</p>
          <label className="recipe-select">
            Highlight{" "}
            <select
              value={highlightedCategory}
              onChange={(event) => setHighlightedCategory(event.target.value)}
            >
              {labeledCounts.map((point) => (
                <option key={point.category}>{point.category}</option>
              ))}
            </select>
          </label>
          {empty ? (
            <p className="recipe-empty" role="status">
              No highlighted data
            </p>
          ) : (
            <>
              <HighlightedBars
                data={labeledCounts}
                label="Highlighted completions"
                highlightedCategory={highlightedCategory}
                formatValue={tasks}
                motion={animation}
              />
              <Table data={labeledCounts} labels={["Completed"]} />
            </>
          )}
        </section>
        <section className="recipe-card" aria-label="Signed">
          <h2>Signed</h2>
          <p className="recipe-description">Net change around a true zero baseline</p>
          <label className="recipe-select">
            Values{" "}
            <select
              value={signedMode}
              onChange={(event) => setSignedMode(event.target.value as typeof signedMode)}
            >
              <option value="mixed">Mixed signs</option>
              <option value="negative">All negative</option>
              <option value="zero">All zero</option>
            </select>
          </label>
          {empty ? (
            <p className="recipe-empty" role="status">
              No change data
            </p>
          ) : (
            <>
              <SignedBars
                data={signedData}
                label="Net task change"
                formatValue={tasks}
                motion={animation}
              />
              <p className="recipe-note">Wednesday is unknown. Zero has no artificial bar.</p>
              <Table data={signedData} labels={["Net change"]} />
            </>
          )}
        </section>
        <section className="recipe-card" aria-label="Interactive">
          <h2>Interactive</h2>
          <p className="recipe-description">Daily completions · Apr–Jun 2026</p>
          <div className="recipes-controls">
            <fieldset aria-label="Displayed series">
              <legend className="sr-only">Displayed series</legend>
              {(["primary", "secondary"] as const).map((key) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={activeSeries === key}
                  onClick={() => setActiveSeries(key)}
                >
                  {key === "primary" ? "Automated" : "Assisted"}{" "}
                  <span className="recipe-total">
                    {dailyViews
                      .reduce((total, point) => total + (point[key] ?? 0), 0)
                      .toLocaleString("en-US")}
                  </span>
                </button>
              ))}
            </fieldset>
          </div>
          {empty ? (
            <p className="recipe-empty" role="status">
              No daily history
            </p>
          ) : (
            <>
              <InteractiveBars
                data={dailyViews}
                label="Daily history"
                config={{
                  primary: { ...comparisonConfig.primary, label: "Automated" },
                  secondary: { ...comparisonConfig.secondary, label: "Assisted" },
                }}
                activeSeries={activeSeries}
                formatCategory={dateLabel}
                motion={animation}
              />
              <Table data={dailyViews} labels={["Automated", "Assisted"]} />
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
