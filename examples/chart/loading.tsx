import * as Chart from "@kind-ui/charts";
import { type ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./loading.css";

const config = {
  sales: { label: "Sales", color: "#568577" },
  target: { label: "Target", color: "#b68967" },
  spread: { label: "Distribution", color: "#568577" },
  move: { label: "Move", color: "#568577" },
  rest: { label: "Rest", color: "#b68967" },
};
const data = [
  { month: "Jan", sales: 24, target: 40, x: 12, y: 24 },
  { month: "Feb", sales: 42, target: 40, x: 25, y: 42 },
  { month: "Mar", sales: 34, target: 40, x: 38, y: 34 },
  { month: "Apr", sales: 63, target: 40, x: 55, y: 63 },
  { month: "May", sales: 52, target: 40, x: 68, y: 52 },
];
const emptyRows: typeof data = [];
const waterfall = Chart.computeWaterfallData([
  { id: "start", label: "Start", kind: "start", value: 30 },
  { id: "gain", label: "Gain", kind: "delta", value: 24 },
  { id: "cost", label: "Cost", kind: "delta", value: -12 },
  { id: "end", label: "End", kind: "end", value: 42 },
]);
const bins = Chart.binHistogram(
  [2, 4, 7, 8, 9, 11, 12, 12, 13, 14, 17, 19],
  [0, 5, 10, 15, 20],
).bins;
const boxes = [
  { month: "Jan", summary: { lowerWhisker: 10, q1: 20, median: 30, q3: 42, upperWhisker: 58 } },
  { month: "Feb", summary: { lowerWhisker: 20, q1: 32, median: 44, q3: 55, upperWhisker: 70 } },
  { month: "Mar", summary: { lowerWhisker: 8, q1: 16, median: 24, q3: 36, upperWhisker: 50 } },
];
const heatRows = ["North", "South", "West"];
const heatColumns = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const heatData = heatRows.flatMap((row, r) =>
  heatColumns.map((column, c) => ({ row, column, value: (r * 13 + c * 7) % 60 })),
);
const shortHeatRows = heatRows.slice(0, 1);
const shortHeatData = heatData.filter((cell) => cell.row === shortHeatRows[0]);
const heatScale = Chart.createHeatmapScale({ domain: [0, 60], colors: ["#eef3ef", "#568577"] });
const flow: Chart.SankeyFlowData = {
  nodes: [
    { id: "in", name: "Supply" },
    { id: "work", name: "Work" },
    { id: "out", name: "Delivery" },
    { id: "loss", name: "Loss" },
  ],
  links: [
    { id: "feed", source: "in", target: "work", value: 60 },
    { id: "deliver", source: "work", target: "out", value: 45 },
    { id: "loss", source: "work", target: "loss", value: 15 },
  ],
};
const noFlow: Chart.SankeyFlowData = { nodes: [], links: [] };
const motion = { revealDurationMs: 1100 };
function Card({
  family,
  title,
  children,
  empty,
  loading,
}: {
  family: string;
  title: string;
  children: ReactNode;
  empty: boolean;
  loading: boolean;
}) {
  return (
    <article data-family-card={family}>
      <h2>{title}</h2>
      <p className="family-note">
        {family === "heatmap"
          ? "Native table · fixed matrix skeleton"
          : family === "sankey"
            ? "Native flow layout · fixed flow skeleton"
            : "Native chart · fixed family skeleton"}
      </p>
      <div className="chart-stage">{children}</div>
      {empty && !loading && <p className="empty-note">No results.</p>}
    </article>
  );
}
function Preview() {
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(true);
  const [wide, setWide] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [events, setEvents] = useState(0);
  const [shortHeatmap, setShortHeatmap] = useState(false);
  const [visibleBars, setVisibleBars] = useState(Object.keys(config));
  const rows = empty ? emptyRows : data;
  const pending = { loading: enabled ? loading : undefined, loadingLabel: "Loading chart data" };
  const native = {
    ...pending,
    responsive: true,
    style: { width: "100%", height: 260 },
    animate: motion,
  };
  const axes = (
    <>
      <Chart.CartesianGrid vertical={false} stroke="#e1e6e2" />
      <Chart.XAxis dataKey="month" />
      <Chart.YAxis domain={[0, 80]} />
    </>
  );
  const card = (family: string, title: string, children: ReactNode) => (
    <Card key={family} family={family} title={title} empty={empty} loading={loading && enabled}>
      {children}
    </Card>
  );
  const rooted = (children: ReactNode, interactive = false) =>
    interactive ? (
      <Chart.Root
        config={config}
        visibleSeries={visibleBars}
        onVisibleSeriesChange={setVisibleBars}
      >
        {children}
      </Chart.Root>
    ) : (
      <Chart.Root config={config}>{children}</Chart.Root>
    );
  return (
    <main>
      <p className="eyebrow">Kind UI / all-family loading study</p>
      <h1>A chart-shaped pause.</h1>
      <p>
        All 14 public chart families use prebuilt silhouettes independent of input data. A soft
        family-specific moving window fades in at its leading edge and fades away behind it. Each
        pulse uses a visibly different prebuilt profile, then gives way immediately to the actual
        chart. Timing follows the chart’s entrance settings. Reduced motion keeps the skeleton
        static.
      </p>
      <nav aria-label="Preview controls">
        <button type="button" onClick={() => setLoading(true)}>
          Replay loading
        </button>
        <button
          type="button"
          onClick={() => {
            setEmpty(false);
            setLoading(false);
          }}
        >
          Load data
        </button>
        <button type="button" onClick={() => setLoading((value) => !value)}>
          Toggle loading
        </button>
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty input data
        </label>
        <label>
          <input
            type="checkbox"
            checked={wide}
            onChange={(event) => setWide(event.target.checked)}
          />{" "}
          Wide layout
        </label>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />{" "}
          Enable loading prop
        </label>
        <label>
          <input
            type="checkbox"
            checked={visibleBars.includes("sales")}
            onChange={(event) =>
              setVisibleBars((current) =>
                event.target.checked
                  ? [...current.filter((key) => key !== "sales"), "sales"]
                  : current.filter((key) => key !== "sales"),
              )
            }
          />{" "}
          Visible sales bars
        </label>
        <label>
          <input
            type="checkbox"
            checked={shortHeatmap}
            onChange={(event) => setShortHeatmap(event.target.checked)}
          />{" "}
          Short heatmap
        </label>
      </nav>
      <p role="status" data-preview-status>
        {loading && enabled
          ? "Request pending · 14 family skeletons"
          : empty
            ? "Loaded: no results"
            : "Loaded: actual data"}
      </p>
      <section className="charts" style={{ maxWidth: wide ? 1200 : 680 }}>
        {card(
          "line",
          "Line",
          <Chart.LineChart
            {...pending}
            config={config}
            series={[{ dataKey: "sales", seriesKey: "sales" }]}
            data={rows}
            xDataKey="month"
            aria-label="Monthly sales"
            height={260}
            animate={motion}
          />,
        )}
        {card(
          "area",
          "Area",
          rooted(
            <Chart.AreaChart {...native} data={rows} aria-label="Sales area">
              {axes}
              <Chart.AreaSeries dataKey="sales" seriesKey="sales" />
              <Chart.Tooltip />
            </Chart.AreaChart>,
          ),
        )}
        {card(
          "bar",
          "Bar",
          rooted(
            <>
              <Chart.BarChart
                {...native}
                data={rows}
                aria-label="Sales bars"
                onClick={() => setEvents((value) => value + 1)}
              >
                {axes}
                <Chart.BarSeries dataKey="sales" seriesKey="sales" />
                <Chart.Tooltip />
              </Chart.BarChart>
              <Chart.Legend />
              <p>
                Consumer clicks: <output>{events}</output>
              </p>
            </>,
            true,
          ),
        )}
        {card(
          "combo",
          "Combo",
          rooted(
            <Chart.ComboChart {...native} data={rows} aria-label="Sales and target">
              {axes}
              <Chart.BarSeries dataKey="sales" seriesKey="sales" />
              <Chart.LineSeries dataKey="target" seriesKey="target" />
              <Chart.Tooltip />
            </Chart.ComboChart>,
          ),
        )}
        {card(
          "scatter",
          "Scatter",
          rooted(
            <Chart.ScatterChart {...native} aria-label="Sales distribution">
              <Chart.XAxis type="number" dataKey="x" domain={[0, 80]} />
              <Chart.YAxis type="number" dataKey="y" domain={[0, 80]} />
              <Chart.ScatterSeries data={rows} seriesKey="sales" />
              <Chart.ScatterTooltip />
            </Chart.ScatterChart>,
          ),
        )}
        {card(
          "waterfall",
          "Waterfall",
          rooted(
            <Chart.WaterfallChart
              {...native}
              data={empty ? [] : waterfall}
              aria-label="Sales balance"
            >
              <Chart.XAxis dataKey="label" />
              <Chart.YAxis domain={[0, 80]} />
              <Chart.WaterfallSeries seriesKey="sales" />
              <Chart.WaterfallConnectors data={empty ? [] : waterfall} />
              <Chart.Tooltip />
            </Chart.WaterfallChart>,
          ),
        )}
        {card(
          "histogram",
          "Histogram",
          rooted(
            <Chart.HistogramChart
              {...native}
              bins={empty ? [] : bins}
              measure="count"
              aria-label="Sales frequency"
            >
              <Chart.HistogramSeries seriesKey="sales" />
              <Chart.Tooltip />
            </Chart.HistogramChart>,
          ),
        )}
        {card(
          "box-plot",
          "Box plot",
          rooted(
            <Chart.BoxPlotChart {...native} data={empty ? [] : boxes} aria-label="Sales summaries">
              {axes}
              <Chart.BoxPlotSeries dataKey="summary" seriesKey="spread" />
              <Chart.Tooltip />
            </Chart.BoxPlotChart>,
          ),
        )}
        {card(
          "pie",
          "Pie",
          rooted(
            <Chart.PieChart {...native} aria-label="Sales allocation">
              <Chart.PieSeries data={rows} dataKey="sales" nameKey="month" outerRadius="80%" />
              <Chart.Tooltip />
            </Chart.PieChart>,
          ),
        )}
        {card(
          "radar",
          "Radar",
          rooted(
            <Chart.RadarChart {...native} data={rows} aria-label="Sales radar">
              <Chart.PolarGrid />
              <Chart.PolarAngleAxis dataKey="month" />
              <Chart.PolarRadiusAxis domain={[0, 80]} />
              <Chart.RadarSeries dataKey="sales" seriesKey="sales" />
              <Chart.Tooltip />
            </Chart.RadarChart>,
          ),
        )}
        {card(
          "radial-bar",
          "Radial bar",
          rooted(
            <Chart.RadialBarChart
              {...native}
              data={rows}
              aria-label="Sales rings"
              innerRadius="20%"
              outerRadius="85%"
            >
              <Chart.PolarAngleAxis type="number" domain={[0, 80]} tick={false} />
              <Chart.RadialBarSeries dataKey="sales" seriesKey="sales" />
              <Chart.Tooltip />
            </Chart.RadialBarChart>,
          ),
        )}
        {card(
          "activity-rings",
          "Activity rings",
          <Chart.ActivityRings
            {...native}
            config={config}
            rings={
              empty
                ? []
                : [
                    { key: "move", value: 72 },
                    { key: "rest", value: 54 },
                  ]
            }
            aria-label="Daily activity"
            legend={false}
          />,
        )}
        {card(
          "heatmap",
          "Heatmap",
          <Chart.HeatmapChart
            {...pending}
            rows={shortHeatmap ? shortHeatRows : heatRows}
            columns={heatColumns}
            data={empty ? [] : shortHeatmap ? shortHeatData : heatData}
            scale={heatScale}
            animate
            style={{ height: 260 }}
            aria-label="Weekly sales matrix"
          >
            <Chart.HeatmapGrid caption="Weekly sales by region" />
            <Chart.HeatmapTooltip />
          </Chart.HeatmapChart>,
        )}
        {card(
          "sankey",
          "Sankey",
          <Chart.ResponsiveContainer width="100%" height={260}>
            <Chart.SankeyChart
              {...pending}
              data={empty ? noFlow : flow}
              animate={motion}
              title="Sales flow"
              nodePadding={24}
              nodeWidth={12}
              margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            />
          </Chart.ResponsiveContainer>,
        )}
      </section>
      <details>
        <summary>Actual data alternative</summary>
        {empty ? (
          <p>No results.</p>
        ) : (
          <table>
            <caption>Monthly sales</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Sales</th>
                <th scope="col">Target</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.month}</th>
                  <td>{row.sales}</td>
                  <td>{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </details>
      <p>
        Replay can interrupt an entrance, resize keeps consumer dimensions, and empty input never
        determines a loading silhouette. Legends stay available while chart inspection is suspended.
      </p>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Preview />);
