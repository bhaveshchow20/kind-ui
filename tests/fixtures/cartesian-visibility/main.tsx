import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { LabelList } from "recharts";

const query = new URLSearchParams(location.search);
const testFamily = query.get("family");
const visibility = query.get("visibility");
const config = {
  first: { label: "First", color: "red" },
  second: { label: "Second", color: "blue" },
};
const rows = [
  { category: "A", first: 100, second: 12 },
  { category: "B", first: 80, second: 20 },
  { category: "C", first: 120, second: 8 },
];
const scatterRows = {
  first: rows.map((row, index) => ({ ...row, x: index, y: row.first })),
  second: rows.map((row, index) => ({ ...row, x: index, y: row.second })),
};
function Case({ family, native }: { family: string; native: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [pointer, setPointer] = useState<string>("");
  const Engine =
    family === "area"
      ? Chart.AreaChart
      : family.startsWith("bar")
        ? Chart.BarChart
        : family === "scatter"
          ? Chart.ScatterChart
          : Chart.LineChart;
  const Series =
    family === "area"
      ? Chart.AreaSeries
      : family.startsWith("bar")
        ? Chart.BarSeries
        : family === "scatter"
          ? Chart.ScatterSeries
          : Chart.LineSeries;
  return (
    <section id={`${family}-${native ? "native" : "root"}`} style={{ width: 600 }}>
      <button type="button" onClick={() => setHidden((value) => !value)}>
        Toggle first
      </button>
      <button
        type="button"
        onClick={() => setSelected((value) => (value === null ? "second" : null))}
      >
        Focus second
      </button>
      <output data-pointer>{pointer}</output>
      <Chart.Root
        config={config}
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: ["first", "second"],
          selected,
          onSelectionChange: setSelected,
        }}
        {...(native ? {} : { visibleSeries: hidden ? ["second"] : ["first", "second"] })}
      >
        <Engine
          data={rows}
          width={600}
          height={280}
          animate={new URLSearchParams(location.search).get("animate") !== "false"}
        >
          <Chart.XAxis
            dataKey={family === "scatter" ? "x" : "category"}
            type={family === "scatter" ? "number" : "category"}
          />
          <Chart.YAxis dataKey={family === "scatter" ? "y" : undefined} />
          {(["first", "second"] as const).map((key) => (
            <Series
              key={key}
              seriesKey={key}
              id={`${family}-${native ? "native" : "root"}-${key}`}
              dataKey={key}
              label={{ pointerEvents: "none" }}
              {...(family === "scatter"
                ? { activeShape: query.get("active") === "true" }
                : family.startsWith("bar")
                  ? {
                      activeBar: query.get("active") === "true",
                      background: { zIndex: 54, fill: "#ddd" },
                    }
                  : { activeDot: false })}
              onClick={(entry, index) =>
                setPointer(
                  JSON.stringify({
                    series: key,
                    row: entry.payload.category,
                    value: entry.payload[key],
                    originalDataIndex: entry.originalDataIndex ?? index,
                  }),
                )
              }
              hide={native && key === "first" && hidden}
              {...(family === "area" || family === "bar-stacked" ? { stackId: "total" } : {})}
              {...(family === "scatter" ? { data: scatterRows[key] } : {})}
            >
              <LabelList dataKey={key} pointerEvents="none" />
            </Series>
          ))}
          <Chart.Tooltip />
        </Engine>
      </Chart.Root>
    </section>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  ["line", "area", "bar-grouped", "bar-stacked", "scatter"]
    .filter((family) => !testFamily || family === testFamily)
    .flatMap((family) =>
      [false, true]
        .filter((native) => !visibility || visibility === (native ? "native" : "root"))
        .map((native) => <Case key={`${family}/${native}`} family={family} native={native} />),
    ),
);
