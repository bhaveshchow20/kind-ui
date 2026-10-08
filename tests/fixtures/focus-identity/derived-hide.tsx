import * as Chart from "@kind-ui/charts";
import { useState } from "react";

const config = {
  first: { label: "First", color: "red" },
  second: { label: "Second", color: "blue" },
};
const bins = [
  { lower: 0, upper: 10, count: 8 },
  { lower: 10, upper: 30, count: 3 },
];
const waterfall = Chart.computeWaterfallData([
  { id: "start", label: "Start", kind: "start", value: 100 },
  { id: "gain", label: "Gain", kind: "delta", value: 25 },
  { id: "loss", label: "Loss", kind: "delta", value: -10 },
  { id: "end", label: "End", kind: "end", value: 115 },
]);
const boxes = [
  {
    category: "A",
    first: { lowerWhisker: 5, q1: 15, median: 20, q3: 35, upperWhisker: 40, outliers: [50] },
    second: { lowerWhisker: 50, q1: 60, median: 70, q3: 80, upperWhisker: 90, outliers: [95] },
  },
];
export function DerivedHide({ family }: { family: string }) {
  const keys = family === "box-plot" ? ["first", "second"] : ["first"];
  const [visible, setVisible] = useState(keys);
  const [mode, setMode] = useState<"focus" | "visibility">("visibility");
  const [payload, setPayload] = useState("");
  const animation = { revealDurationMs: 200, hoverTransition: { duration: 0.5, ease: "linear" } };
  const pointer = (entry: { payload: unknown }) => setPayload(JSON.stringify(entry.payload));
  return (
    <section id={`derived-${family}`}>
      <button
        type="button"
        onClick={() =>
          setVisible(visible.includes("first") ? visible.filter((key) => key !== "first") : keys)
        }
      >
        External hide
      </button>
      <button type="button" onClick={() => setMode(mode === "focus" ? "visibility" : "focus")}>
        Change mode
      </button>
      <output data-visible={JSON.stringify(visible)}>{payload}</output>
      <Chart.Root
        config={Object.fromEntries(keys.map((key) => [key, config[key as keyof typeof config]]))}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        interaction={{ kind: "series", mode, eligibleKeys: keys }}
      >
        {family === "histogram" ? (
          <Chart.HistogramChart
            width={500}
            height={260}
            bins={bins}
            measure="count"
            animate={animation}
          >
            <Chart.HistogramSeries seriesKey="first" onClick={pointer} />
            <Chart.Tooltip />
          </Chart.HistogramChart>
        ) : family === "waterfall" ? (
          <Chart.WaterfallChart width={500} height={260} data={waterfall} animate={animation}>
            <Chart.XAxis dataKey="id" />
            <Chart.YAxis />
            <Chart.WaterfallConnectors data={waterfall} seriesKey="first" />
            <Chart.WaterfallSeries seriesKey="first" onClick={pointer} />
            <Chart.Tooltip />
          </Chart.WaterfallChart>
        ) : (
          <Chart.BoxPlotChart width={500} height={260} data={boxes} animate={animation}>
            <Chart.XAxis dataKey="category" />
            <Chart.YAxis domain={[0, 100]} />
            <Chart.BoxPlotSeries seriesKey="first" dataKey="first" onClick={pointer} />
            <Chart.BoxPlotSeries seriesKey="second" dataKey="second" onClick={pointer} />
            <Chart.Tooltip />
          </Chart.BoxPlotChart>
        )}
        <Chart.Legend />
      </Chart.Root>
    </section>
  );
}
