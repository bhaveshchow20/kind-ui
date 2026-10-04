import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useLayoutEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

const rows = [
  {
    month: "Jan",
    orders: 480,
    summary: { lowerWhisker: 120, q1: 220, median: 300, q3: 380, upperWhisker: 480 },
  },
  {
    month: "Feb",
    orders: 980,
    summary: { lowerWhisker: 180, q1: 360, median: 550, q3: 720, upperWhisker: 980 },
  },
];
const bins = [
  { lower: 0, upper: 1, count: 480 },
  { lower: 1, upper: 2, count: 980 },
];
const entries: Chart.WaterfallEntry[] = [
  { id: "Jan", label: "Jan", kind: "start", value: 480 },
  { id: "Feb", label: "Feb", kind: "delta", value: 500 },
];
const config = { orders: { label: "Orders", color: "#733bff" } };
const visible = ["orders"];
const hidden: string[] = [];
const animation = { revealDurationMs: 1000, revealEasing: "linear" } as const;

function GeometryProbe() {
  const width = Chart.useChartWidth();
  const height = Chart.useChartHeight();
  const x = Chart.useXAxisScale();
  const y = Chart.useYAxisScale();
  const geometry = {
    width,
    height,
    x: [x?.("Jan"), x?.("Feb"), x?.(0), x?.(1)],
    y: [y?.(0), y?.(980)],
  };
  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent("entrance-geometry", { detail: geometry }));
  });
  return null;
}

function Host() {
  const params = new URLSearchParams(location.search);
  const family = params.get("family") ?? "bar";
  const horizontal = params.has("horizontal");
  const [active, setActive] = useState(!params.has("deferred"));
  const [replay, setReplay] = useState(0);
  const [updated, setUpdated] = useState(false);
  const [shown, setShown] = useState(true);
  const [small, setSmall] = useState(false);
  const [long, setLong] = useState(params.has("long"));
  const [serif, setSerif] = useState(params.has("serif"));
  const data = useMemo(
    () =>
      updated
        ? rows.map((row) => ({
            ...row,
            orders: row.orders + 50,
            summary: { ...row.summary, upperWhisker: row.summary.upperWhisker + 50 },
          }))
        : rows,
    [updated],
  );
  const histogramBins = useMemo(
    () => (updated ? bins.map((bin) => ({ ...bin, count: bin.count + 50 })) : bins),
    [updated],
  );
  const bridge = useMemo(
    () =>
      Chart.computeWaterfallData(
        updated
          ? entries.map((entry) => (entry.kind === "start" ? { ...entry, value: 530 } : entry))
          : entries,
      ),
    [updated],
  );
  const yAxisProps = {
    width: params.has("fixed") ? 80 : "auto",
    tick: { fontFamily: serif ? "serif" : "sans-serif" },
    tickFormatter: (value: unknown) => (long ? `${value} fulfilled orders` : String(value)),
  } as const;
  const chartProps = { animate: animation, "aria-label": "Entrance proof" };
  const axes = (
    <>
      <Chart.XAxis
        dataKey={family === "waterfall" ? "id" : "month"}
        type={horizontal ? "number" : "category"}
      />
      <Chart.YAxis
        {...yAxisProps}
        type={horizontal ? "category" : "number"}
        dataKey={horizontal ? "month" : undefined}
      />
    </>
  );
  return (
    <main style={{ width: small ? 360 : "min(640px, 100%)", fontFamily: "sans-serif" }}>
      {(
        [
          ["Activate", () => setActive(true)],
          ["Replay", () => setReplay(replay + 1)],
          ["Data", () => setUpdated(!updated)],
          ["Visibility", () => setShown(!shown)],
          ["Resize", () => setSmall(!small)],
          ["Labels", () => setLong(!long)],
          ["Font", () => setSerif(!serif)],
        ] as const
      ).map(([label, onClick]) => (
        <button type="button" key={label} onClick={onClick}>
          {label}
        </button>
      ))}
      {active && (
        <Chart.Root key={replay} config={config} visibleSeries={shown ? visible : hidden}>
          <Chart.ResponsiveContainer width="100%" height={240}>
            {family === "histogram" ? (
              <Chart.HistogramChart
                {...chartProps}
                bins={histogramBins}
                measure="count"
                yAxisProps={yAxisProps}
              >
                <Chart.HistogramSeries seriesKey="orders" />
                <GeometryProbe />
              </Chart.HistogramChart>
            ) : family === "box" ? (
              <Chart.BoxPlotChart {...chartProps} data={data}>
                {axes}
                <Chart.BoxPlotSeries dataKey="summary" seriesKey="orders" />
                <GeometryProbe />
              </Chart.BoxPlotChart>
            ) : family === "waterfall" ? (
              <Chart.WaterfallChart {...chartProps} data={bridge}>
                {axes}
                <Chart.WaterfallSeries seriesKey="orders" />
                <GeometryProbe />
              </Chart.WaterfallChart>
            ) : (
              <Chart.BarChart
                {...chartProps}
                data={data}
                layout={horizontal ? "vertical" : "horizontal"}
              >
                {axes}
                <Chart.BarSeries dataKey="orders" />
                <GeometryProbe />
              </Chart.BarChart>
            )}
          </Chart.ResponsiveContainer>
        </Chart.Root>
      )}
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<Host />);
