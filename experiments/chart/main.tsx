import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue, type Row, type SeriesKey, sample, series } from "./data";
import "./style.css";

function ChartTooltip({
  active,
  activeIndex,
  accessibilityLayer,
  rows,
  visible,
}: TooltipContentProps & { rows: Row[]; visible: SeriesKey[] }) {
  const row = activeIndex == null ? undefined : rows[Number(activeIndex)];
  return (
    <div
      className="tooltip"
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "assertive" : undefined}
      aria-atomic="true"
    >
      {active && row && (
        <>
          <strong>{row.day} · Task outcomes</strong>
          {series
            .filter((item) => visible.includes(item.key))
            .map((item) => (
              <p key={item.key}>
                {item.label}: <b>{formatValue(row[item.key])}</b>
              </p>
            ))}
        </>
      )}
    </div>
  );
}

function App() {
  const [visible, setVisible] = useState<SeriesKey[]>(["completed", "review"]);
  const [scenario, setScenario] = useState("sample");
  const rows =
    scenario === "empty"
      ? []
      : scenario === "missing"
        ? sample.map((row) => ({ ...row, completed: null, review: null }))
        : sample;
  const noValues =
    rows.length > 0 && rows.every((row) => visible.every((key) => row[key] === null));
  const emptyMessage =
    rows.length === 0
      ? "No task data yet."
      : visible.length === 0
        ? "All series are hidden. Select a series to show it."
        : noValues
          ? "No values for the selected series."
          : null;
  return (
    <main>
      <header>
        <a className="wordmark" href="#chart-title">
          kind ui<span> / experiments</span>
        </a>
        <span className="badge">Chart 01</span>
      </header>
      <section className="intro">
        <p className="eyebrow">A working composition study</p>
        <h1>Every outcome, in view.</h1>
        <p>A small chart with explicit state and a data view you can always read.</p>
      </section>
      <section className="card" aria-labelledby="chart-title">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Synthetic sample · one week</p>
            <h2 id="chart-title">Task outcomes</h2>
          </div>
          <label>
            Data scenario
            <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
              <option value="sample">Sample week</option>
              <option value="empty">Empty data</option>
              <option value="missing">Missing values</option>
            </select>
          </label>
        </div>
        <p id="chart-help" className="hint">
          Toggle a series below. Focus the chart and use the left and right arrow keys to explore
          values.
        </p>
        <fieldset className="legend" aria-label="Visible series">
          {series.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={visible.includes(item.key)}
              onClick={() =>
                setVisible((current) =>
                  current.includes(item.key)
                    ? current.filter((key) => key !== item.key)
                    : [...current, item.key],
                )
              }
            >
              <span
                className="swatch"
                style={{ borderColor: item.color, borderStyle: item.dash ? "dashed" : "solid" }}
              />
              {item.label}
              <span className="visibility">{visible.includes(item.key) ? "Shown" : "Hidden"}</span>
            </button>
          ))}
        </fieldset>
        <div className="plot">
          {emptyMessage ? (
            <p role="status" className="empty">
              {emptyMessage}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={rows}
                accessibilityLayer
                aria-label="Task outcomes by day"
                aria-describedby="chart-help"
                margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid vertical={false} stroke="#e4e7ed" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={12} />
                <YAxis
                  width={36}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  isAnimationActive={false}
                  filterNull={false}
                  content={(props) => <ChartTooltip {...props} rows={rows} visible={visible} />}
                />
                {series.map((item) => (
                  <Line
                    key={item.key}
                    dataKey={item.key}
                    name={item.label}
                    stroke={item.color}
                    strokeDasharray={item.dash ?? "none"}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    hide={!visible.includes(item.key)}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="hint">
          Gaps mean no data, never zero. Hidden series remain available in the table.
        </p>
        <div className="table-scroll">
          <table>
            <caption>Task outcomes data · all series</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {series.map((item) => (
                  <th key={item.key} scope="col">
                    {item.label}
                    <small>
                      {visible.includes(item.key) ? "Shown in chart" : "Hidden in chart"}
                    </small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>No task data yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.day}>
                    <th scope="row">{row.day}</th>
                    {series.map((item) => (
                      <td key={item.key}>{formatValue(row[item.key])}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <footer>Experimental composition · no published component API · sample data only</footer>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Chart experiment requires a root element");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
