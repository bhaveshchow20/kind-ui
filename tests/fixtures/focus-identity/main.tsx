/// <reference types="vite/client" />
import "./tailwind.css";
import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DerivedHide } from "./derived-hide";
import { PieHideFixture } from "./pie-hide";
import { PolarHideCases } from "./polar-hide";
import { StandaloneFocus } from "./standalone-focus";

const query = new URLSearchParams(location.search);
const only = query.get("only");
const testFamily = query.get("family");
const contractFamily = query.get("contract");
const config = {
  first: { label: "First", color: "#f00" },
  second: { label: "Second", color: "#00f" },
};
const rows = [
  { category: "A", first: 15, second: 80 },
  { category: "B", first: 35, second: 60 },
  { category: "C", first: 10, second: 90 },
];
const contractFamilies = [
  "area",
  "bar",
  "box-plot",
  "combo",
  "heatmap",
  "histogram",
  "line",
  "pie",
  "radar",
  "radial-activity",
  "scatter",
  "sankey",
  "waterfall",
];
const familyFrame = {
  width: 500,
  height: 240,
  animate: false as const,
  "aria-label": "Family focus contract",
};
const distributions = rows.map((row) => ({
  category: row.category,
  summary: { lowerWhisker: 10, q1: 20, median: row.second / 2, q3: 55, upperWhisker: 80 },
}));
const categoryValues = [
  { id: "first", value: 40 },
  { id: "second", value: 60 },
];
const matrixRows = ["A", "B"];
const matrixColumns = ["X", "Y"];
const matrixData = matrixRows.flatMap((row, r) =>
  matrixColumns.map((column, c) => ({ row, column, value: r * 10 + c * 5 })),
);
const matrixScale = Chart.createHeatmapScale({ domain: [0, 20], colors: ["#ffffff", "#0000ff"] });
const bins = Chart.binHistogram([1, 2, 4, 7, 10, 13, 18], [0, 5, 10, 15, 20]).bins;
const waterfall = Chart.computeWaterfallData([
  { id: "start", label: "Start", kind: "start", value: 40 },
  { id: "gain", label: "Gain", kind: "delta", value: 10 },
  { id: "end", label: "End", kind: "end", value: 50 },
]);
const flow: Chart.SankeyFlowData = {
  nodes: [
    { id: "first", name: "First" },
    { id: "second", name: "Second" },
    { id: "third", name: "Third" },
  ],
  links: [
    { id: "first-second", source: "first", target: "second", value: 20 },
    { id: "second-third", source: "second", target: "third", value: 20 },
  ],
};
function FamilyContractChart({ family }: { family: string }) {
  if (["area", "bar", "combo", "line", "radar"].includes(family)) return <Case family={family} />;
  if (family === "box-plot")
    return (
      <Chart.BoxPlotChart {...familyFrame} config={config} data={distributions}>
        <Chart.BoxPlotChart.XAxis dataKey="category" />
        <Chart.BoxPlotChart.YAxis domain={[0, 100]} />
        <Chart.BoxPlotChart.Series dataKey="summary" seriesKey="first" />
        <Chart.BoxPlotChart.Legend />
      </Chart.BoxPlotChart>
    );
  if (family === "pie")
    return (
      <Chart.PieChart {...familyFrame} config={config}>
        <Chart.PieChart.Series
          data={categoryValues}
          dataKey="value"
          nameKey="id"
          categoryKey="id"
        />
        <Chart.PieChart.Legend />
      </Chart.PieChart>
    );
  if (family === "radial-activity")
    return (
      <Chart.ActivityRings
        {...familyFrame}
        config={config}
        rings={categoryValues.map(({ id, value }) => ({ key: id, value }))}
      >
        <Chart.ActivityRings.Series />
        <Chart.ActivityRings.Legend />
      </Chart.ActivityRings>
    );
  if (family === "scatter")
    return (
      <Chart.ScatterChart {...familyFrame} config={config}>
        <Chart.ScatterChart.XAxis dataKey="first" />
        <Chart.ScatterChart.YAxis dataKey="second" />
        <Chart.ScatterChart.Series data={rows} seriesKey="first" />
        <Chart.ScatterChart.Legend />
      </Chart.ScatterChart>
    );
  if (family === "sankey")
    return (
      <Chart.SankeyChart
        {...familyFrame}
        config={{ ...config, third: { label: "Third", color: "#080" } }}
        data={flow}
      >
        <Chart.SankeyChart.Nodes />
        <Chart.SankeyChart.Links />
        <Chart.SankeyChart.Legend />
      </Chart.SankeyChart>
    );
  if (family === "histogram")
    return (
      <Chart.HistogramChart
        {...familyFrame}
        config={{ count: { label: "Count", color: "#f00" } }}
        bins={bins}
        measure="count"
      >
        <Chart.HistogramChart.XAxis />
        <Chart.HistogramChart.YAxis />
        <Chart.HistogramChart.Series seriesKey="count" />
      </Chart.HistogramChart>
    );
  if (family === "waterfall")
    return (
      <Chart.WaterfallChart
        {...familyFrame}
        config={{ value: { label: "Value", color: "#f00" } }}
        data={waterfall}
      >
        <Chart.WaterfallChart.XAxis dataKey="label" />
        <Chart.WaterfallChart.YAxis />
        <Chart.WaterfallChart.Series seriesKey="value" />
      </Chart.WaterfallChart>
    );
  return (
    <Chart.HeatmapChart
      config={{}}
      aria-label="Matrix values"
      rows={matrixRows}
      columns={matrixColumns}
      data={matrixData}
      scale={matrixScale}
    >
      <Chart.HeatmapChart.Grid caption="Matrix values" />
      <Chart.HeatmapChart.Legend label="Values" />
    </Chart.HeatmapChart>
  );
}
function FamilyContractCases() {
  return (
    <>
      {contractFamilies
        .filter((family) => !contractFamily || family === contractFamily)
        .map((family) => (
          <section
            id={`family-contract-${family}`}
            key={family}
            style={{ width: 600, minHeight: 320 }}
          >
            <h2>{family} public contract</h2>
            <FamilyContractChart family={family} />
          </section>
        ))}
    </>
  );
}
function Case({ family, explicit = false }: { family: string; explicit?: boolean }) {
  const [visible, setVisible] = useState(["first", "second"]);
  const [order, setOrder] = useState(["first", "second"]);
  const Engine =
    family === "area"
      ? Chart.AreaChart
      : family === "bar"
        ? Chart.BarChart
        : family === "combo"
          ? Chart.ComboChart
          : family === "radar"
            ? Chart.RadarChart
            : Chart.LineChart;
  const Series =
    family === "area"
      ? Chart.AreaSeries
      : family === "bar"
        ? Chart.BarSeries
        : family === "radar"
          ? Chart.RadarSeries
          : Chart.LineSeries;
  return (
    <section id={family + (explicit ? "-explicit" : "")}>
      <h2>{family}</h2>
      <button
        type="button"
        onClick={() => setVisible((v) => (v.length === 2 ? ["second"] : ["first", "second"]))}
      >
        External hide
      </button>
      <button type="button" onClick={() => setOrder((v) => [...v].reverse())}>
        Reorder
      </button>
      <Engine
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        {...(explicit
          ? {
              interaction: {
                kind: "series" as const,
                mode: "focus" as const,
                eligibleKeys: order,
                markActivation: "matching-legend" as const,
              },
            }
          : {})}
        aria-label="Chart fixture"
        data={rows}
        width={500}
        height={240}
        animate={
          new URLSearchParams(location.search).has("static")
            ? false
            : { revealDurationMs: 200, hoverTransition: { duration: 0.5, ease: "linear" } }
        }
      >
        {family === "radar" ? (
          <>
            <Chart.PolarGrid />
            <Chart.PolarAngleAxis dataKey="category" />
            <Chart.PolarRadiusAxis domain={[0, 100]} />
          </>
        ) : (
          <>
            <Chart.XAxis dataKey="category" />
            <Chart.YAxis domain={[0, 100]} />
          </>
        )}
        {order.map((key) =>
          family === "combo" && key === "first" ? (
            <Chart.BarSeries key={key} dataKey={key} />
          ) : (
            <Series key={key} dataKey={key} dot={true} />
          ),
        )}
        <Chart.Tooltip
          content={(props) => (
            <>
              <Chart.TooltipContent tooltip={props} valueAnimation="shuffle" />
              <output
                data-native-payload={JSON.stringify(
                  props.payload.map((entry) => ({
                    series: String(entry.dataKey),
                    row: entry.payload.category,
                    value: entry.value,
                    id: entry.graphicalItemId,
                  })),
                )}
              />
            </>
          )}
        />
        <Engine.Legend />
      </Engine>
    </section>
  );
}
function GuardCase({ mode }: { mode: "focus" | "visibility" }) {
  const [visible, setVisible] = useState(["first", "second"]);
  const [eligible, setEligible] = useState(["first", "second"]);
  return (
    <section id={`guard-${mode}`}>
      <button type="button" onClick={() => setEligible(["second"])}>
        Limit eligible
      </button>
      <button type="button" onClick={() => setVisible([])}>
        Consumer empty
      </button>
      <output data-visible={JSON.stringify(visible)} />
      <Chart.LineChart
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        interaction={
          mode === "focus"
            ? { kind: "series", mode, eligibleKeys: eligible, markActivation: "matching-legend" }
            : { kind: "series", mode, eligibleKeys: eligible, markActivation: "matching-legend" }
        }
        aria-label="Chart fixture"
        data={rows}
        width={500}
        height={240}
        animate={{ revealDurationMs: 200, hoverTransition: { duration: 0.5, ease: "linear" } }}
      >
        <Chart.LineSeries dataKey="first" />
        <Chart.LineSeries dataKey="second" />
        <Chart.LineChart.Legend />
      </Chart.LineChart>
    </section>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <>
    {(!only || only === "series") &&
      ["line", "area", "bar", "combo", "radar"]
        .filter((family) => !testFamily || family === testFamily)
        .map((family) => <Case key={family} family={family} />)}
    {!only && <Case family="line" explicit />}
    {(!only || only === "guard") && <GuardCase mode="focus" />}
    {(!only || only === "guard") && <GuardCase mode="visibility" />}
    {(!only || only === "family-contracts") && <FamilyContractCases />}
    {(!only || only === "polar") && <PolarHideCases />}
    {(!only || only === "pie") && <PieHideFixture />}
    {only === "derived" && testFamily && <DerivedHide family={testFamily} />}
    {(!only || only === "standalone") && <StandaloneFocus />}
    {(!only || only === "explicit-focus") && (
      <Chart.LineChart
        data={rows}
        config={config}
        aria-label="Explicit focus"
        interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
        width={500}
        height={240}
        animate={true}
      >
        <Chart.LineChart.Grid />
        <Chart.LineChart.XAxis dataKey={"category"} />
        <Chart.LineChart.YAxis />
        {Object.keys(config).map((key) => (
          <Chart.LineChart.Series key={key} dataKey={key} />
        ))}
        <Chart.LineChart.Tooltip />
        <Chart.LineChart.Legend />
      </Chart.LineChart>
    )}
  </>,
);
