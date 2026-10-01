import * as Chart from "@kind-ui/charts";
import { useId, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Symbols,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Mon", current: 18, previous: 14 },
  { day: "Tue", current: 32, previous: 26 },
  { day: "Wed", current: null, previous: 24 },
  { day: "Thu", current: 0, previous: 20 },
  { day: "Fri", current: 40, previous: 30 },
  { day: "Sat", current: 48, previous: 36 },
  { day: "Sun", current: 62, previous: 42 },
];
const config = {
  current: {
    label: "This week",
    color: "var(--material-current)",
    formatValue: (value) => `${value} tasks`,
  },
  previous: {
    label: "Last week",
    color: "var(--material-previous)",
    formatValue: (value) => `${value} tasks`,
  },
} satisfies Chart.SeriesConfig;
const keys = ["current", "previous"] as const;

// Local consumer composition: no chart geometry or theme state enters the package.
export function ThemeChart({ material }: { material: "glass" | "clay" }) {
  const id = useId().replace(/:/g, "");
  const [visible, setVisible] = useState<string[]>([...keys]);
  const [empty, setEmpty] = useState(false);
  const rows = empty ? [] : data;
  return (
    <>
      <div className="material-summary">
        <div>
          <p className="material-metric">
            {empty ? "—" : "62"}
            <span>tasks</span>
          </p>
          <p className="material-muted">Sunday completions</p>
        </div>
        <span className={`material-badge ${material}`}>Weekly overview</span>
      </div>
      <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
        <Chart.Legend aria-label="Visible series" />
        <p id={`${id}-help`} className="sr-only">
          Use left and right arrow keys to explore values. Escape dismisses the tooltip.
        </p>
        {empty || visible.length === 0 ? (
          <p role="status" className="material-empty">
            {empty ? "No data yet." : "Select a series to show it."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={rows}
              accessibilityLayer
              aria-label={`${material === "glass" ? "Glass" : "Clay"} task outcomes by day`}
              aria-describedby={`${id}-help`}
              margin={{ top: 24, right: 16, bottom: 12, left: 0 }}
            >
              <defs>
                <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--material-highlight)" />
                  <stop offset="55%" stopColor="var(--material-current)" />
                  <stop offset="100%" stopColor="var(--material-deep)" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--material-grid)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={12} />
              <YAxis width={32} axisLine={false} tickLine={false} domain={[0, 80]} />
              <Tooltip
                filterNull={false}
                isAnimationActive={false}
                content={(tooltip) => (
                  <Chart.TooltipContent
                    tooltip={tooltip}
                    className={`material-tooltip ${material}`}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--color-previous)"
                strokeWidth={2}
                strokeDasharray="5 5"
                hide={!visible.includes("previous")}
                connectNulls={false}
                isAnimationActive={false}
                dot={({ cx, cy }) =>
                  cx == null || cy == null ? (
                    <g />
                  ) : (
                    <Symbols cx={cx} cy={cy} type="square" size={22} fill="var(--color-previous)" />
                  )
                }
                activeDot={{
                  r: 5,
                  fill: "var(--color-previous)",
                  stroke: "var(--material-surface)",
                }}
              />
              <Line
                className="material-primary-line"
                type="monotone"
                dataKey="current"
                stroke={`url(#${id}-line)`}
                strokeWidth={material === "clay" ? 6 : 3}
                strokeLinecap="round"
                hide={!visible.includes("current")}
                connectNulls={false}
                isAnimationActive={false}
                dot={{
                  r: 3.5,
                  fill: "var(--color-current)",
                  stroke: "var(--material-surface)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--color-current)",
                  stroke: "var(--material-surface)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Chart.Root>
      <div className="material-chart-footer">
        <p className="material-muted">Gaps mean no data. Zero stays zero.</p>
        <label className="material-empty-toggle">
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />
          Empty data
        </label>
      </div>
      <details className="material-data">
        <summary>View data</summary>
        <table>
          <caption>Daily completions, all series</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {keys.map((key) => (
                <th scope="col" key={key}>
                  {config[key].label}
                  <small>{visible.includes(key) ? "Shown" : "Hidden"}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.day}>
                  <th scope="row">{row.day}</th>
                  {keys.map((key) => (
                    <td key={key}>{row[key] == null ? "No data" : `${row[key]} tasks`}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </details>
    </>
  );
}
