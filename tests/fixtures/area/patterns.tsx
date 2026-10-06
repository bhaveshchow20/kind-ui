import * as Chart from "@kind-ui/charts";
import { type CSSProperties, useState } from "react";

const rows = [
  { category: "A", first: 8, second: 4 },
  { category: "B", first: -5, second: -2 },
];

export function AreaPatternHost({ horizontal = false }: { horizontal?: boolean }) {
  const [kind, setKind] = useState<Chart.FillPattern["kind"]>("dots");
  const [stacked, setStacked] = useState(false);
  const [override, setOverride] = useState("none");
  const [material, setMaterial] = useState<Chart.AreaMaterial>("plain");
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  return (
    <section
      style={
        {
          colorScheme: dark ? "dark" : "light",
          background: "Canvas",
          color: "CanvasText",
          "--area-secondary": dark ? "#ff9acd" : "#ed79ae",
        } as CSSProperties
      }
    >
      {(["dots", "lines", "hatch"] as const).map((value) => (
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
          {["none", "fill", "style", "shape", "off"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {[0, 1].map((chart) => (
        <Chart.Root
          key={chart}
          config={{
            first: { color: "#789abc", pattern: { kind } },
            second: { color: "var(--area-secondary)", pattern: { kind: "lines" } },
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
                        pattern={{ kind: "hatch", color: "CanvasText" }}
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
          <Chart.AreaChart
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
            <Chart.AreaSeries
              dataKey="first"
              stackId={stacked ? "total" : undefined}
              material={material}
              fillOpacity={0.4}
              fill={override === "fill" ? `url(#host-gradient-${chart})` : undefined}
              style={override === "style" ? { fill: "#123456" } : undefined}
              shape={
                override === "shape" ? <Chart.AreaRevealShape data-host-shape="" /> : undefined
              }
              pattern={override === "off" ? "none" : undefined}
            />
            <Chart.AreaSeries
              dataKey="second"
              pattern={{ kind: "hatch", color: "CanvasText" }}
              stackId={stacked ? "total" : undefined}
            />
          </Chart.AreaChart>
        </Chart.Root>
      ))}
    </section>
  );
}
