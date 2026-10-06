import * as Chart from "@kind-ui/charts";
import { useState } from "react";

const rows = [
  { category: "A", first: 8, second: 4 },
  { category: "B", first: -5, second: -2 },
];

export function PatternHost({ horizontal = false }: { horizontal?: boolean }) {
  const [kind, setKind] = useState<Chart.FillPattern["kind"]>("hatch");
  const [stacked, setStacked] = useState(false);
  const [override, setOverride] = useState("none");
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  return (
    <section
      style={{ colorScheme: dark ? "dark" : "light", background: "Canvas", color: "CanvasText" }}
    >
      {(["hatch", "stripe", "duotone"] as const).map((value) => (
        <button type="button" key={value} onClick={() => setKind(value)}>
          {value}
        </button>
      ))}
      <button type="button" onClick={() => setStacked(!stacked)}>
        Stack
      </button>
      <button type="button" onClick={() => setDark(!dark)}>
        Theme
      </button>
      <button type="button" onClick={() => setMaterial(material === "plain" ? "clay" : "plain")}>
        Material
      </button>
      <label>
        Override
        <select value={override} onChange={(event) => setOverride(event.target.value)}>
          {["none", "fill", "style", "cell", "shape", "active", "off"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {[0, 1].map((chart) => (
        <Chart.Root
          key={chart}
          config={{
            first: { color: "#789abc", pattern: { kind } },
            second: { color: "#ed79ae", pattern: { kind: "stripe" } },
          }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Chart.Legend>
            {chart === 1
              ? (item) => (
                  <>
                    {item.key === "second" ? (
                      <Chart.FillPatternSwatch
                        pattern={{ kind: "duotone", color: "CanvasText" }}
                        color="var(--color-second)"
                      />
                    ) : (
                      item.marker
                    )}
                    {item.label}
                  </>
                )
              : undefined}
          </Chart.Legend>
          <Chart.BarChart
            width={360}
            height={220}
            data={rows}
            layout={horizontal ? "vertical" : "horizontal"}
          >
            <defs>
              <linearGradient id={`host-gradient-${chart}`}>
                <stop stopColor="red" />
                <stop offset="1" stopColor="blue" />
              </linearGradient>
            </defs>
            <Chart.XAxis
              dataKey={horizontal ? undefined : "category"}
              type={horizontal ? "number" : "category"}
            />
            <Chart.YAxis
              dataKey={horizontal ? "category" : undefined}
              type={horizontal ? "category" : "number"}
            />
            <Chart.BarSeries
              dataKey="first"
              stackId={stacked ? "total" : undefined}
              material={material}
              fill={override === "fill" ? `url(#host-gradient-${chart})` : undefined}
              style={override === "style" ? { fill: "#123456" } : undefined}
              shape={override === "shape" ? <Chart.Rectangle data-host-shape="" /> : undefined}
              activeBar={
                override === "active" ? <Chart.Rectangle data-host-active="" /> : undefined
              }
              pattern={override === "off" ? "none" : undefined}
            >
              {override === "cell" && <Chart.Cell fill="#123456" />}
            </Chart.BarSeries>
            <Chart.BarSeries
              dataKey="second"
              pattern={{ kind: "duotone", color: "CanvasText" }}
              stackId={stacked ? "total" : undefined}
            />
          </Chart.BarChart>
        </Chart.Root>
      ))}
    </section>
  );
}
