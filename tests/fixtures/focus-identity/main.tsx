import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PieHideFixture } from "./pie-hide";
import { PolarHideCases } from "./polar-hide";
import { StandaloneFocus } from "./standalone-focus";

const query = new URLSearchParams(location.search);
const only = query.get("only");
const testFamily = query.get("family");
const docsFamily = query.get("doc");
const config = {
  first: { label: "First", color: "#f00" },
  second: { label: "Second", color: "#00f" },
};
const rows = [
  { category: "A", first: 15, second: 80 },
  { category: "B", first: 35, second: 60 },
  { category: "C", first: 10, second: 90 },
];
const examples = import.meta.glob("../../../apps/docs/examples/*/example.tsx", { eager: true });
const families = [
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
function DocsCases() {
  return (
    <>
      {families
        .filter((family) => !docsFamily || family === docsFamily)
        .map((family) => {
          const module = examples[`../../../apps/docs/examples/${family}/example.tsx`] as Record<
            string,
            React.ComponentType
          >;
          const Demo = Object.values(module)[0];
          return (
            <section id={`docs-${family}`} key={family} style={{ width: 600, minHeight: 320 }}>
              <h2>{family} docs</h2>
              <Demo />
            </section>
          );
        })}
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
      <Chart.Root
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
      >
        <Engine
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
          {order.map((key) => (
            <Series key={key} dataKey={key} dot={true} />
          ))}
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
        </Engine>
        <Chart.Legend />
      </Chart.Root>
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
      <Chart.Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        interaction={{
          kind: "series",
          mode,
          eligibleKeys: eligible,
          markActivation: "matching-legend",
        }}
      >
        <Chart.LineChart
          data={rows}
          width={500}
          height={240}
          animate={{ revealDurationMs: 200, hoverTransition: { duration: 0.5, ease: "linear" } }}
        >
          <Chart.LineSeries dataKey="first" />
          <Chart.LineSeries dataKey="second" />
        </Chart.LineChart>
        <Chart.Legend />
      </Chart.Root>
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
    {(!only || only === "docs") && <DocsCases />}
    {(!only || only === "polar") && <PolarHideCases />}
    {(!only || only === "pie") && <PieHideFixture />}
    {(!only || only === "standalone") && <StandaloneFocus />}
    {(!only || only === "configured") && (
      <Chart.LineChart
        data={rows}
        config={config}
        xDataKey="category"
        aria-label="Configured focus"
        width={500}
        height={240}
        animate={true}
      />
    )}
  </>,
);
