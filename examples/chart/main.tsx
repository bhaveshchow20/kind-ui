import { type ChartConfig, ChartContainer, ChartLegend, ChartTooltipContent } from "kind-ui";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CartesianGrid,
  type DotProps,
  Line,
  LineChart,
  ResponsiveContainer,
  Symbols,
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
const cellClass = "border-b border-border px-3 py-2.5 text-right";
function ReviewMarker({ cx, cy, size = 34 }: Pick<DotProps, "cx" | "cy"> & { size?: number }) {
  if (cx == null || cy == null) return <g />;
  return (
    <Symbols
      cx={cx}
      cy={cy}
      type="diamond"
      size={size}
      fill="var(--color-review)"
      stroke="var(--card)"
      strokeWidth={1.5}
    />
  );
}
function App() {
  const [palette, setPalette] = useState<"monochrome" | "color">("monochrome");
  const [visible, setVisible] = useState<string[]>([...keys]);
  const [empty, setEmpty] = useState(false);
  const rows = empty ? [] : data;
  return (
    <div data-palette={palette} className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-lg font-semibold tracking-tight">Kind UI</p>
          <fieldset
            aria-label="Chart palette"
            className="flex gap-1 rounded-lg bg-muted p-1 text-xs"
          >
            {(["monochrome", "color"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={palette === value}
                onClick={() => setPalette(value)}
                className="rounded-md px-3 py-2 text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {value === "monochrome" ? "Monochrome" : "Color"}
              </button>
            ))}
          </fieldset>
        </div>
        <section
          aria-label="Task outcomes"
          className="rounded-lg border border-border bg-card p-4 sm:p-5"
        >
          <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-medium tracking-tight">Task outcomes</h1>
            <label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
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
              style={{ margin: "4px 0 10px", gap: 4 }}
              className="text-[13px] [&_button]:border-transparent! [&_button:hover]:[--chart-legend-background:var(--accent)] [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-ring [&_button[aria-pressed=false]]:text-muted-foreground [&_li:first-child_span]:rounded-full [&_li:nth-child(2)_span]:rotate-45 [&_span]:size-2!"
            />
            <p id="chart-help" className="sr-only">
              Focus the chart and use left and right arrow keys to explore values. Escape dismisses
              the tooltip.
            </p>
            {rows.length === 0 || visible.length === 0 ? (
              <p className="grid h-[180px] place-items-center text-muted-foreground" role="status">
                {rows.length ? "Select a series to show it." : "No data yet."}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
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
                        className="min-w-44 max-w-64 shadow-sm tabular-nums [&_strong]:font-medium"
                      />
                    )}
                  />
                  {keys.map((key) => (
                    <Line
                      key={key}
                      dataKey={key}
                      stroke={`var(--color-${key})`}
                      strokeWidth={2.5}
                      dot={
                        key === "review" ? (
                          <ReviewMarker />
                        ) : (
                          {
                            r: 3.5,
                            strokeWidth: 1.5,
                            stroke: "var(--card)",
                            fill: "var(--color-completed)",
                          }
                        )
                      }
                      activeDot={
                        key === "review" ? (
                          <ReviewMarker size={64} />
                        ) : (
                          {
                            r: 5,
                            strokeWidth: 2,
                            stroke: "var(--card)",
                            fill: "var(--color-completed)",
                          }
                        )
                      }
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
          <p className="mt-3 text-xs text-muted-foreground">
            Gaps mean no data. Hidden series stay in the table.
          </p>
        </section>
        <div className="mt-6 overflow-hidden">
          <table className="w-full border-collapse text-xs tabular-nums">
            <caption className="sr-only">Task outcomes, all series</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="border-b border-border px-3 py-2.5 text-left">
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
                      className="border-b border-border px-3 py-2.5 text-left font-medium"
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
    </div>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
