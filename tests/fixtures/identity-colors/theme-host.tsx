import * as Chart from "@kind-ui/charts";
import { type CSSProperties, useState } from "react";

const stops = ["var(--brand)", "#0000ff"] as const;
const color: Chart.SeriesColor = { light: stops, dark: ["#ffffff", "#808080", "#000000"] };
const config = {
  value: { color, legendShape: "square" },
  other: { color: "#008000" },
} satisfies Chart.SeriesConfig;
// @ts-expect-error Both theme branches are required.
const invalid: Chart.SeriesColor = { light: "red" };
void invalid;
const rows = [
  { id: "value", value: 8, other: 4 },
  { id: "other", value: 8, other: 6 },
];

export function ThemeHost() {
  const [dark, setDark] = useState(false);
  const [override, setOverride] = useState(false);
  const [solid, setSolid] = useState(false);
  const [visible, setVisible] = useState(["value", "other"]);
  const [pattern, setPattern] = useState(false);
  return (
    <main style={{ colorScheme: dark ? "dark" : "light", "--brand": "#ff0000" } as CSSProperties}>
      <button type="button" onClick={() => setDark(!dark)}>
        Theme
      </button>
      <button type="button" onClick={() => setOverride(!override)}>
        Override
      </button>
      <button type="button" onClick={() => setPattern(!pattern)}>
        Pattern
      </button>
      <button type="button" onClick={() => setSolid(!solid)}>
        Solid
      </button>
      {[0, 1].map((index) => (
        <Chart.Root
          key={index}
          config={{ ...config, value: { ...config.value, color: solid ? "tomato" : color } }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Chart.Legend hideIcon />
          <Chart.Legend data-testid="symbols" />
          <Chart.TooltipContent
            indicator="dot"
            tooltip={{
              active: true,
              payload: [
                { dataKey: "value", name: "value", value: 8, graphicalItemId: "theme-value" },
              ],
              label: "A",
              accessibilityLayer: false,
              coordinate: { x: 0, y: 0 },
              activeIndex: "0",
            }}
          />
          <Chart.LineChart width={360} height={140} data={rows}>
            <Chart.XAxis dataKey="id" />
            <Chart.YAxis />
            <Chart.LineSeries
              dataKey="value"
              dot={false}
              stroke={override ? "#00ff00" : undefined}
            />
          </Chart.LineChart>
          <Chart.AreaChart width={360} height={140} data={rows}>
            <Chart.XAxis dataKey="id" />
            <Chart.YAxis />
            <Chart.AreaSeries dataKey="value" fill={override ? "#00ff00" : undefined} />
          </Chart.AreaChart>
          <Chart.BarChart width={360} height={140} data={rows}>
            <Chart.XAxis dataKey="id" />
            <Chart.YAxis />
            <Chart.BarSeries
              dataKey="value"
              fill={override ? "#00ff00" : undefined}
              pattern={pattern ? { kind: "hatch" } : "none"}
            />
          </Chart.BarChart>
          <Chart.PieChart width={360} height={140}>
            <Chart.PieSeries data={rows} dataKey="value" categoryKey="id">
              <Chart.Cell fill={override ? "#00ff00" : undefined} />
            </Chart.PieSeries>
          </Chart.PieChart>
        </Chart.Root>
      ))}
    </main>
  );
}
