import { type ChartConfig, ChartContainer, ChartLegend, ChartTooltipContent } from "kind-ui";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./style.css";

const config = {
  completed: { label: "Completed", color: "#3659b8", formatValue: (value) => `${value} tasks` },
  review: { label: "Needs review", color: "#a75019", formatValue: (value) => `${value} tasks` },
} satisfies ChartConfig;
const data = [
  { day: "Mon", completed: 42, review: 12 },
  { day: "Tue", completed: 58, review: 8 },
  { day: "Wed", completed: null, review: 14 },
  { day: "Thu", completed: 64, review: 0 },
  { day: "Fri", completed: 82, review: 9 },
];
const keys = ["completed", "review"] as const;
function App() {
  const [visible, setVisible] = useState<string[]>([...keys]);
  const [empty, setEmpty] = useState(false);
  const rows = empty ? [] : data;
  return (
    <main>
      <h1>Task outcomes</h1>
      <label className="data-control">
        <input
          type="checkbox"
          checked={empty}
          onChange={(event) => setEmpty(event.target.checked)}
        />
        Empty data
      </label>
      <ChartContainer
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        className="chart"
      >
        <ChartLegend aria-label="Visible series" />
        <p id="chart-help" className="sr-only">
          Focus the chart and use left and right arrow keys to explore values. Escape dismisses the
          tooltip.
        </p>
        {rows.length === 0 || visible.length === 0 ? (
          <p className="empty" role="status">
            {rows.length ? "Select a series to show it." : "No data yet."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={rows}
              accessibilityLayer
              aria-label="Task outcomes by day"
              aria-describedby="chart-help"
              margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#e2e7ef" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis width={32} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                filterNull={false}
                isAnimationActive={false}
                content={(tooltip) => <ChartTooltipContent tooltip={tooltip} />}
              />
              {keys.map((key) => (
                <Line
                  key={key}
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2.5}
                  strokeDasharray={key === "review" ? "5 4" : "none"}
                  hide={!visible.includes(key)}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
      <p className="hint">Gaps mean no data. Hidden series stay in the table.</p>
      <table>
        <caption className="sr-only">Task outcomes, all series</caption>
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
                  <td key={key}>
                    {row[key] == null ? "No data" : config[key].formatValue(row[key])}
                  </td>
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
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
