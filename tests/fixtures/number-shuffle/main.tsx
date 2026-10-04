import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { type TooltipRenderProps as TooltipContentProps, XAxis, YAxis } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";

const points = [
  { day: "Jul 9", count: 13, x: 0, y: 13 },
  { day: "Jul 22", count: 8, x: 1, y: 8 },
  { day: "Jul 28", count: 11, x: 2, y: 11 },
  { day: "Jul 14", count: 4, x: 3, y: 4 },
  { day: "Jul 15", count: 13, x: 4, y: 13 },
];
const config = {
  count: { label: "Commits", color: "#06b6b8", formatValue: (v: unknown) => `${v} commits` },
};
const columns = points.map((point) => point.day);
const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({
    row,
    column,
    value: r === 1 ? (points[c]?.count ?? 0) : (c * 7 + r * 3) % 14,
  })),
);
const scale = Chart.createHeatmapScale({ domain: [0, 13], colors: ["#202020", "#00c5c7"] });
function CustomContent(tooltip: TooltipContentProps) {
  const [count, setCount] = useState(0);
  return (
    <div data-custom="owned">
      <button type="button" onClick={() => setCount(count + 1)}>
        Custom {count}
      </button>
      <Chart.TooltipContent tooltip={tooltip} />
    </div>
  );
}
function CustomHeatmap({ formattedValue }: Chart.HeatmapCellContentProps) {
  return <em data-custom="heatmap">{formattedValue}</em>;
}

function Host() {
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState(13);
  const [active, setActive] = useState(true);
  const [custom, setCustom] = useState(false);
  const [rich, setRich] = useState(false);
  const [locale, setLocale] = useState(false);
  const animation = enabled ? { valueAnimation: "shuffle" as const } : {};
  const tooltip: TooltipContentProps = {
    active,
    label: "Direct",
    activeIndex: "0",
    coordinate: undefined,
    accessibilityLayer: true,
    payload: [
      { dataKey: "count", name: "Commits", value, graphicalItemId: "count" },
      {
        dataKey: "money",
        graphicalItemId: "money",
        name: "Currency",
        value: -12.5,
        formatter: () => "$-12.50",
      },
      {
        dataKey: "rate",
        graphicalItemId: "rate",
        name: "Percent",
        value: 0.125,
        formatter: () => "12.5%",
      },
      { dataKey: "missing", graphicalItemId: "missing", name: "Missing", value: undefined },
      { dataKey: "nan", graphicalItemId: "nan", name: "NaN", value: Number.NaN },
      {
        dataKey: "infinity",
        graphicalItemId: "infinity",
        name: "Infinity",
        value: Number.POSITIVE_INFINITY,
      },
      { dataKey: "range", graphicalItemId: "range", name: "Range", value: [0, 2] },
      { dataKey: "string", graphicalItemId: "string", name: "String", value: "123" },
      {
        dataKey: "suppressed",
        graphicalItemId: "suppressed",
        name: "Suppressed",
        value: 2,
        formatter: () => null,
      },
      {
        dataKey: "rich",
        graphicalItemId: "rich",
        name: "Rich",
        value: 7,
        formatter: () => (rich ? <em data-rich="true">Seven</em> : "7 units"),
      },
      {
        dataKey: "locale",
        graphicalItemId: "locale",
        name: "Locale",
        value: 12,
        formatter: () => (locale ? "١٢٫٥٪" : "€12,50"),
      },
    ],
  };
  return (
    <main
      dir={window.location.search.includes("rtl") ? "rtl" : "ltr"}
      style={{ fontFamily: "system-ui", padding: 24, maxWidth: 760, margin: "auto" }}
    >
      <h1>Optional tooltip number shuffle</h1>
      <p>
        Enable rolling digits, then inspect the chart or calendar. Default rendering is unchanged.
      </p>
      <label>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />{" "}
        Shuffle values
      </label>
      <label>
        <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} />{" "}
        Custom content
      </label>
      <section
        aria-label="Calendar preview"
        style={{
          background: "#121212",
          color: "#ddd",
          padding: 24,
          marginTop: 20,
          borderRadius: 12,
        }}
      >
        <h2>Activity</h2>
        <Chart.HeatmapChart
          rows={rows}
          columns={columns}
          data={data}
          scale={scale}
          formatValue={(v) => `${v} commits`}
        >
          <Chart.HeatmapGrid caption="Activity by day" />
          <Chart.HeatmapTooltip {...animation} {...(custom ? { Content: CustomHeatmap } : {})} />
        </Chart.HeatmapChart>
      </section>
      <section aria-label="Line preview">
        <h2>Shared tooltip</h2>
        <Chart.Root config={config}>
          <Chart.LineChart width={700} height={220} data={points} aria-label="Shuffle line">
            <XAxis dataKey="day" />
            <YAxis />
            <Chart.LineSeries dataKey="count" />
            <Chart.Tooltip {...animation} {...(custom ? { content: CustomContent } : {})} />
          </Chart.LineChart>
        </Chart.Root>
      </section>
      <section aria-label="Scatter preview">
        <h2>Scatter dimensions</h2>
        <Chart.Root config={{ points: { label: "Points", color: "#06b6b8" } }}>
          <Chart.ScatterChart width={700} height={220} aria-label="Shuffle scatter">
            <XAxis type="number" dataKey="x" />
            <YAxis type="number" dataKey="y" />
            <Chart.ScatterSeries seriesKey="points" data={points} />
            <Chart.ScatterTooltip
              {...animation}
              pointLabel={(record: (typeof points)[number]) => record.day}
            />
          </Chart.ScatterChart>
        </Chart.Root>
      </section>
      <section aria-label="Direct content">
        <h2>Formatting and interruption contracts</h2>
        {[0, 4, 8, 13, -12.5, 123456.75].map((n) => (
          <button type="button" key={n} onClick={() => setValue(n)}>
            Value {n}
          </button>
        ))}
        <button type="button" onClick={() => setActive(!active)}>
          Active
        </button>
        <button type="button" onClick={() => setRich(!rich)}>
          Rich formatter
        </button>
        <button type="button" onClick={() => setLocale(!locale)}>
          Arabic formatter
        </button>
        <Chart.Root config={config}>
          <Chart.TooltipContent tooltip={tooltip} {...animation} data-direct="true" />
        </Chart.Root>
        <Chart.Root config={config}>
          <Chart.ScatterTooltipContent
            tooltip={{ ...tooltip, payload: tooltip.payload.slice(0, 3) }}
            {...animation}
            data-scatter-direct="true"
          />
        </Chart.Root>
      </section>
    </main>
  );
}

// Public declarations are checked against the installed tarball in both resolution modes.
const props: Chart.TooltipProps = { valueAnimation: "shuffle" };
const heatmap: Chart.HeatmapTooltipProps = { valueAnimation: "shuffle" };
const scatter: Chart.ScatterTooltipProps<{ day: string }> = {
  valueAnimation: "shuffle",
  pointLabel: (row) => row.day,
};
void props;
void heatmap;
void scatter;
// @ts-expect-error Only the explicit shuffle mode is supported.
const invalid: Chart.TooltipProps = { valueAnimation: true };
void invalid;

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<Host />);
