import * as Chart from "@kind-ui/charts";
import { Cell, ResponsiveContainer, XAxis, YAxis } from "@kind-ui/charts";
import { useState } from "react";
import { Bar } from "recharts";
import { useReducedMotionPreference } from "./use-reduced-motion.js";

function TaskIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <path d="m3 8 3 3 7-8" />
    </svg>
  );
}
const rows = [
  { day: "Monday", count: 0, review: 4 },
  { day: "Tuesday", count: 12, review: 6 },
  { day: "Wednesday", count: 18, review: null },
];
const itemKey: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) => String(entry.dataKey);
export function PresentationExample() {
  const [family, setFamily] = useState<"line" | "area" | "bar">("area");
  const [indicator, setIndicator] = useState<"dot" | "line" | "dashed">("line");
  const [hideLabel, setHideLabel] = useState(false);
  const [hideIndicator, setHideIndicator] = useState(false);
  const [icons, setIcons] = useState(true);
  const [hideIcon, setHideIcon] = useState(false);
  const [composed, setComposed] = useState(false);
  const [custom, setCustom] = useState(false);
  const [format, setFormat] = useState<"config" | "native" | "suppress">("config");
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState<string[]>(["count", "review"]);
  const formatting: Pick<Chart.TooltipProps, "formatter"> =
    format === "native"
      ? { formatter: (value, name) => [`${value} native`, `Native ${name}`] }
      : format === "suppress"
        ? { formatter: (_value, name) => (name === "count" ? null : "Review only") }
        : {};
  const config = {
    count: {
      label: "Completed",
      color: "var(--completed)",
      formatValue: (value) => `${value} tasks`,
      ...(icons ? { icon: TaskIcon } : {}),
    },
    review: { label: "Review", color: "var(--review)", formatValue: (value) => `${value} tasks` },
  } satisfies Chart.SeriesConfig;
  const Frame =
    family === "line" ? Chart.LineChart : family === "area" ? Chart.AreaChart : Chart.BarChart;
  const Series =
    family === "line" ? Chart.LineSeries : family === "area" ? Chart.AreaSeries : Chart.BarSeries;
  return (
    <main className="presentation" data-dark={dark}>
      <header>
        <p>Kind UI / Chart presentation</p>
        <h1>Clear signals</h1>
        <p>Shared tooltip and legend options, with host-owned formatting and controls.</p>
      </header>
      <fieldset aria-label="Presentation options">
        <label>
          Chart{" "}
          <select
            aria-label="Chart family"
            value={family}
            onChange={(event) => setFamily(event.target.value as typeof family)}
          >
            {["line", "area", "bar"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Indicator{" "}
          <select
            aria-label="Indicator"
            value={indicator}
            onChange={(event) => setIndicator(event.target.value as typeof indicator)}
          >
            {["dot", "line", "dashed"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Formatting{" "}
          <select
            aria-label="Formatting"
            value={format}
            onChange={(event) => setFormat(event.target.value as typeof format)}
          >
            {["config", "native", "suppress"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        {(
          [
            ["Hide label", hideLabel, setHideLabel],
            ["Hide indicator", hideIndicator, setHideIndicator],
            ["Series icons", icons, setIcons],
            ["Legend swatches", hideIcon, setHideIcon],
            ["Compose legend", composed, setComposed],
            ["Custom native content", custom, setCustom],
            ["Dark theme", dark, setDark],
          ] as const
        ).map(([label, checked, update]) => (
          <label key={label}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => update(event.target.checked)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <section aria-label="Task outcomes" className="presentation-card">
        <h2>Task outcomes</h2>
        <Chart.Root
          config={config}
          interaction={{ kind: "series", mode: "visibility", eligibleKeys: Object.keys(config) }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Chart.Legend aria-label="Task series focus" hideIcon={hideIcon}>
            {({ label, visible, marker }) => (
              <>
                {marker}
                <span>{label}</span>
                {composed && <small>{visible ? "Shown" : "Hidden"}</small>}
              </>
            )}
          </Chart.Legend>
          <p id="presentation-help">
            Focus the chart; use arrow keys to explore. Escape dismisses the tooltip.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <Frame
              animate
              data={rows}
              aria-label="Task outcomes by day"
              aria-describedby="presentation-help"
              accessibilityLayer
              margin={{ left: 0, right: 16, top: 12, bottom: 4 }}
            >
              <XAxis dataKey="day" tickFormatter={(day: string) => day.slice(0, 3)} />
              <YAxis width={30} domain={[0, 20]} />
              <Series dataKey="count" />
              <Series dataKey="review" />
              <Chart.Tooltip
                itemKey={itemKey}
                {...formatting}
                labelFormatter={(label) => `Day: ${label}`}
                content={(tooltip) =>
                  custom ? (
                    <div role="status" data-owner="native-content">
                      {tooltip.active &&
                        tooltip.payload.map((entry) => (
                          <p key={String(entry.dataKey)}>
                            {entry.name}: {entry.value ?? "Missing"}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <Chart.TooltipContent
                      tooltip={tooltip}
                      itemKey={itemKey}
                      hideLabel={hideLabel}
                      hideIndicator={hideIndicator}
                      indicator={indicator}
                    />
                  )
                }
              />
            </Frame>
          </ResponsiveContainer>
        </Chart.Root>
        <table>
          <caption>All task values, including hidden series</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Completed</th>
              <th scope="col">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.day}>
                <th scope="row">{row.day}</th>
                <td>{row.count} tasks</td>
                <td>{row.review == null ? "No data" : `${row.review} tasks`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

const categoryRows = [
  { category: "delivery", amount: 0 },
  { category: "support", amount: 10 },
];
const categoryKey: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) =>
  String(entry.payload.category);
/** Native host marks use amount as dataKey; category metadata intentionally has different IDs. */
export function CategoryIdentityExample() {
  const reduced = useReducedMotionPreference();
  const [visible, setVisible] = useState<string[]>(["delivery", "support"]);
  const [custom, setCustom] = useState(false);
  const config = {
    delivery: {
      label: "Delivery",
      color: "#3d6470",
      icon: TaskIcon,
      formatValue: (value) => `${value} category units`,
    },
    support: {
      label: "Support",
      color: "#aa7456",
      formatValue: (value) => `${value} category units`,
    },
  } satisfies Chart.SeriesConfig;
  return (
    <main className="presentation">
      <h1>Category identity</h1>
      <label>
        <input
          type="checkbox"
          checked={custom}
          onChange={(event) => setCustom(event.target.checked)}
        />
        Custom category content
      </label>
      <Chart.Root
        config={config}
        interaction={{ kind: "series", mode: "visibility", eligibleKeys: Object.keys(config) }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <ResponsiveContainer width="100%" height={240}>
          <Chart.BarChart data={categoryRows} aria-label="Category amounts" accessibilityLayer>
            <XAxis dataKey="category" />
            <YAxis domain={[0, 12]} />
            <Bar dataKey="amount" isAnimationActive={!reduced}>
              {categoryRows.map((row) => (
                <Cell
                  key={row.category}
                  fill={`var(--color-${row.category})`}
                  opacity={visible.includes(row.category) ? 1 : 0}
                />
              ))}
            </Bar>
            <Chart.Tooltip
              itemKey={categoryKey}
              {...(custom
                ? {
                    content: (tooltip: import("recharts").TooltipContentProps) => (
                      <div role="status" data-owner="category-content">
                        {tooltip.active &&
                          tooltip.payload.map((entry) => (
                            <p key={categoryKey(entry)}>
                              {categoryKey(entry)}: {entry.value}
                            </p>
                          ))}
                      </div>
                    ),
                  }
                : {})}
            />
          </Chart.BarChart>
        </ResponsiveContainer>
      </Chart.Root>
      <p>
        Focus the chart; arrow keys explore category values. Hidden categories remain in this table.
      </p>
      <table>
        <caption>All category amounts</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {categoryRows.map((row) => (
            <tr key={row.category}>
              <th scope="row">{config[row.category as keyof typeof config].label}</th>
              <td>{row.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
