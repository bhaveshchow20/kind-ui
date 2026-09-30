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
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
    formatValue: (value) => `${value} tasks`,
  },
  review: {
    label: "Needs review",
    color: "var(--chart-2)",
    formatValue: (value) => `${value} tasks`,
  },
} satisfies ChartConfig;
const data = [
  { day: "Mon", completed: 42, review: 12 },
  { day: "Tue", completed: 58, review: 8 },
  { day: "Wed", completed: null, review: 14 },
  { day: "Thu", completed: 64, review: 0 },
  { day: "Fri", completed: 82, review: 9 },
];
const keys = ["completed", "review"] as const;
const cellClass = "border-b border-border px-3 py-3 text-right";
function App() {
  const [visible, setVisible] = useState<string[]>([...keys]);
  const [empty, setEmpty] = useState(false);
  const rows = empty ? [] : data;
  return (
    <main className="mx-3 my-4 max-w-[780px] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:mx-auto sm:my-12 sm:p-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Task outcomes</h1>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />
          Empty data
        </label>
      </header>
      <ChartContainer
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        className="text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-surface]:focus-visible:outline-2 [&_.recharts-surface]:focus-visible:outline-offset-2 [&_.recharts-surface]:focus-visible:outline-ring"
      >
        <ChartLegend
          aria-label="Visible series"
          className="text-sm [&_button:hover]:[--chart-legend-background:var(--accent)] [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-ring [&_button[aria-pressed=false]]:[--chart-legend-background:var(--muted)]"
        />
        <p id="chart-help" className="sr-only">
          Focus the chart and use left and right arrow keys to explore values. Escape dismisses the
          tooltip.
        </p>
        {rows.length === 0 || visible.length === 0 ? (
          <p className="grid h-[260px] place-items-center text-muted-foreground" role="status">
            {rows.length ? "Select a series to show it." : "No data yet."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={rows}
              accessibilityLayer
              aria-label="Task outcomes by day"
              aria-describedby="chart-help"
              margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.65} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis width={32} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                filterNull={false}
                isAnimationActive={false}
                content={(tooltip) => (
                  <ChartTooltipContent
                    tooltip={tooltip}
                    className="min-w-44 max-w-64 shadow-lg tabular-nums"
                  />
                )}
              />
              {keys.map((key) => (
                <Line
                  key={key}
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2, strokeDasharray: "none", fill: "var(--card)" }}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    stroke: "var(--card)",
                    fill: `var(--color-${key})`,
                  }}
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
      <p className="my-4 text-xs text-muted-foreground">
        Gaps mean no data. Hidden series stay in the table.
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-xs tabular-nums">
          <caption className="sr-only">Task outcomes, all series</caption>
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th scope="col" className="border-b border-border px-3 py-3 text-left">
                Day
              </th>
              {keys.map((key) => (
                <th scope="col" key={key} className={cellClass}>
                  {config[key].label}
                  <small className="mt-1 block font-normal text-muted-foreground">
                    {visible.includes(key) ? "Shown" : "Hidden"}
                  </small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child>*]:border-b-0">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.day} className="hover:bg-muted/40">
                  <th
                    scope="row"
                    className="border-b border-border px-3 py-3 text-left font-medium"
                  >
                    {row.day}
                  </th>
                  {keys.map((key) => (
                    <td key={key} className={cellClass}>
                      {row[key] == null ? "No data" : config[key].formatValue(row[key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className={cellClass}>
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
