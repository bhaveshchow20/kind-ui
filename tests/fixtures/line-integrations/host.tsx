import * as Chart from "@kind-ui/charts";
import {
  BarChart,
  BarSeries,
  createHeatmapScale,
  HeatmapChart,
  HeatmapGrid,
  Legend,
  LineChart,
  LineSeries,
  type SeriesConfig,
  TooltipContent,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { TrendingUp } from "lucide-react";
import { type CSSProperties, useState } from "react";
export function IntegrationHost() {
  const config = {
    total: { label: "Total", color: "#4055ee", icon: TrendingUp },
  } satisfies SeriesConfig;
  return (
    <LineChart
      data={[
        { month: "Jan", total: 0 },
        { month: "Feb", total: 12 },
      ]}
      config={config}
      aria-label="Monthly icon totals"
      className="h-80 text-blue-700"
      interaction={{ kind: "series", mode: "visibility", eligibleKeys: ["total"] }}
      defaultVisibleSeries={["total"]}
      frameProps={{ className: "max-w-xl", id: "compound-integration" }}
    >
      <LineChart.Grid className="stroke-fuchsia-600" />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis />
      <LineChart.Series dataKey="total" type="monotone" strokeWidth={2} dot={{ r: 2.5 }} />
      <LineChart.Tooltip formatter={(value) => [`${value} units`, "Total"]} />
      <LineChart.Legend className="gap-6 p-4 text-blue-700" />
    </LineChart>
  );
}

// The existing Next App Router fixture owns server rendering and actual hydration.
export function PatternHydrationHost() {
  const [visible, setVisible] = useState(["first", "second", "third"]);
  return (
    <section data-pattern-hydration="">
      {[0, 1].map((chart) => (
        <>
          <BarChart
            interaction={{
              kind: "series",
              mode: "visibility",
              eligibleKeys: Object.keys({
                first: { color: "red", pattern: { kind: "hatch" } },
                second: { color: "blue", pattern: { kind: "stripe" } },
                third: { color: "green", pattern: { kind: "duotone" } },
              }),
            }}
            key={chart}
            config={{
              first: { color: "red", pattern: { kind: "hatch" } },
              second: { color: "blue", pattern: { kind: "stripe" } },
              third: { color: "green", pattern: { kind: "duotone" } },
            }}
            visibleSeries={visible}
            onVisibleSeriesChange={setVisible}
            aria-label="Chart fixture"
            width={320}
            height={180}
            data={[
              { category: "A", first: 8, second: 4, third: 2 },
              { category: "B", first: 5, second: 3, third: 1 },
            ]}
          >
            <XAxis dataKey="category" />
            <YAxis />
            <BarSeries dataKey="first" />
            <BarSeries dataKey="second" />
            <BarSeries dataKey="third" />
            <BarChart.Legend />
          </BarChart>
        </>
      ))}
    </section>
  );
}

// Chart gradient resources are emitted by the real Next server before hydration.
export function ColorHydrationHost() {
  const [dark, setDark] = useState(false);
  return (
    <section
      data-color-hydration=""
      style={{ colorScheme: dark ? "dark" : "light", "--brand": "red" } as CSSProperties}
    >
      <button type="button" onClick={() => setDark(!dark)}>
        Color theme
      </button>
      {[0, 1].map((chart) => (
        <>
          <LineChart
            key={chart}
            config={{
              value: {
                color: { light: ["var(--brand)", "blue"], dark: ["white", "gray", "black"] },
              },
            }}
            aria-label="Chart fixture"
            width={320}
            height={180}
            data={[{ value: 8 }, { value: 8 }]}
          >
            <XAxis />
            <YAxis />
            <LineSeries dataKey="value" dot={false} />
            <LineChart.Legend />
          </LineChart>
        </>
      ))}
    </section>
  );
}

/** Same semantic and local token contract in Vite and through the Next client boundary. */
export function ThemingHost() {
  const [dark, setDark] = useState(false);
  const variables = {
    colorScheme: dark ? "dark" : "light",
    "--foreground": dark ? "rgb(230, 235, 240)" : "rgb(30, 40, 50)",
    "--border": dark ? "rgb(80, 90, 100)" : "rgb(160, 170, 180)",
    "--muted-foreground": dark ? "rgb(190, 195, 200)" : "rgb(90, 100, 110)",
    "--popover": dark ? "rgb(20, 25, 30)" : "rgb(250, 245, 240)",
    "--popover-foreground": dark ? "rgb(220, 225, 230)" : "rgb(40, 45, 50)",
    "--radius": "10px",
    "--chart-1": "rgb(30, 120, 90)",
    "--chart-dark": "rgb(90, 200, 150)",
  } as CSSProperties;
  const config = {
    total: { label: "Themed total", color: { light: "var(--chart-1)", dark: "var(--chart-dark)" } },
  } satisfies SeriesConfig;
  const content = {
    active: true,
    accessibilityLayer: true,
    label: "Theme heading",
    activeIndex: "0",
    coordinate: undefined,
    payload: [{ dataKey: "total", value: 12, name: "total", graphicalItemId: "theme-total" }],
  };
  return (
    <section data-theme-proof="" style={variables}>
      <button type="button" onClick={() => setDark(!dark)}>
        Toggle semantic theme
      </button>
      <Chart.HeatmapChart
        rows={[]}
        columns={[]}
        data={[]}
        scale={Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
        aria-label="Metadata chart"
        config={config}
        data-theme-case="semantic"
      >
        <Legend />
        <TooltipContent tooltip={content} />
      </Chart.HeatmapChart>
      <Chart.HeatmapChart
        rows={[]}
        columns={[]}
        data={[]}
        scale={Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
        aria-label="Metadata chart"
        config={config}
        data-theme-case="tokens"
        style={
          {
            "--foreground": "rgb(100, 40, 150)",
            "--border": "rgb(120, 60, 180)",
            "--popover": "rgb(240, 220, 250)",
            "--popover-foreground": "rgb(90, 30, 140)",
            "--radius": "14px",
            fontFamily: "monospace",
          } as CSSProperties
        }
      >
        <Legend />
        <TooltipContent tooltip={content} />
      </Chart.HeatmapChart>
      <Chart.HeatmapChart
        rows={[]}
        columns={[]}
        data={[]}
        scale={Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
        aria-label="Metadata chart"
        config={config}
        data-theme-case="utilities"
        className="w-72 text-red-700 font-serif"
      >
        <Legend className="gap-6 p-4" />
        <TooltipContent
          className="bg-blue-100 text-blue-900 rounded-none p-5"
          style={{ paddingBottom: 7 }}
          tooltip={content}
        />
      </Chart.HeatmapChart>
      <Chart.HeatmapChart
        rows={[]}
        columns={[]}
        data={[]}
        scale={Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
        aria-label="Metadata chart"
        config={config}
        data-theme-case="properties"
        className="w-[240px] text-[color:rgb(70,80,90)]"
      >
        <TooltipContent tooltip={content} className="p-6 text-[color:rgb(20,30,40)]" />
      </Chart.HeatmapChart>
      <HeatmapChart
        rows={["A"]}
        columns={["B"]}
        data={[{ row: "A", column: "B", value: 1 }]}
        scale={createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
        data-theme-case="heatmap-overrides"
        config={config}
        aria-label="Chart fixture"
      >
        <HeatmapGrid
          caption="Utility overrides"
          material="clay"
          className="border-spacing-6"
          cellProps={() => ({ className: "bg-none" })}
        />
      </HeatmapChart>
      <LineChart
        config={config}
        data={[
          { month: "Jan", total: 1 },
          { month: "Feb", total: 2 },
        ]}
        aria-label="Semantic plot"
        height={180}
        frameProps={{ title: "Semantic plot" }}
      >
        <LineChart.Grid />
        <LineChart.XAxis dataKey={"month"} />
        <LineChart.YAxis />
        {Object.keys(config).map((key) => (
          <LineChart.Series key={key} dataKey={key} />
        ))}
        <LineChart.Tooltip />
        <LineChart.Legend />
      </LineChart>
    </section>
  );
}
