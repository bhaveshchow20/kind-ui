import {
  BarChart,
  BarSeries,
  createHeatmapScale,
  HeatmapChart,
  HeatmapGrid,
  Legend,
  LineChart,
  LineSeries,
  Root,
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
      xDataKey="month"
      aria-label="Monthly icon totals"
      className="h-80 text-blue-700"
      rootProps={{
        className: "max-w-xl",
        interaction: { kind: "series", mode: "visibility", eligibleKeys: ["total"] },
      }}
      legend={{ className: "gap-6 p-4 text-blue-700" }}
      grid={{ className: "stroke-fuchsia-600" }}
      tooltip={{ formatter: (value) => [`${value} units`, "Total"] }}
    />
  );
}

// The existing Next App Router fixture owns server rendering and actual hydration.
export function PatternHydrationHost() {
  const [visible, setVisible] = useState(["first", "second", "third"]);
  return (
    <section data-pattern-hydration="">
      {[0, 1].map((chart) => (
        <Root
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
        >
          <Legend />
          <BarChart
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
          </BarChart>
        </Root>
      ))}
    </section>
  );
}

// Root gradient resources are emitted by the real Next server before hydration.
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
        <Root
          key={chart}
          config={{
            value: {
              color: { light: ["var(--brand)", "blue"], dark: ["white", "gray", "black"] },
            },
          }}
        >
          <Legend />
          <LineChart width={320} height={180} data={[{ value: 8 }, { value: 8 }]}>
            <XAxis />
            <YAxis />
            <LineSeries dataKey="value" dot={false} />
          </LineChart>
        </Root>
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
      <Root config={config} data-theme-case="semantic">
        <Legend />
        <TooltipContent tooltip={content} />
      </Root>
      <Root
        config={config}
        data-theme-case="tokens"
        style={
          {
            "--kind-ui-chart-foreground": "rgb(100, 40, 150)",
            "--kind-ui-chart-border": "rgb(120, 60, 180)",
            "--kind-ui-chart-popover": "rgb(240, 220, 250)",
            "--kind-ui-chart-popover-foreground": "rgb(90, 30, 140)",
            "--kind-ui-chart-radius": "14px",
            "--kind-ui-chart-font": "monospace",
          } as CSSProperties
        }
      >
        <Legend />
        <TooltipContent tooltip={content} />
      </Root>
      <Root config={config} data-theme-case="utilities" className="w-72 text-red-700 font-serif">
        <Legend className="gap-6 p-4" />
        <TooltipContent
          className="bg-blue-100 text-blue-900 rounded-none p-5"
          style={{ paddingBottom: 7 }}
          tooltip={content}
        />
      </Root>
      <Root
        config={config}
        data-theme-case="properties"
        className="[width:240px] [color:rgb(70,80,90)]"
      >
        <TooltipContent tooltip={content} className="[padding:24px] [color:rgb(20,30,40)]" />
      </Root>
      <HeatmapChart
        rows={["A"]}
        columns={["B"]}
        data={[{ row: "A", column: "B", value: 1 }]}
        scale={createHeatmapScale({ domain: [0, 1], colors: ["#fff", "#000"] })}
        data-theme-case="heatmap-overrides"
      >
        <HeatmapGrid
          caption="Utility overrides"
          material="clay"
          className="border-spacing-6"
          cellProps={() => ({ className: "[background-image:none]" })}
        />
      </HeatmapChart>
      <LineChart
        config={config}
        data={[
          { month: "Jan", total: 1 },
          { month: "Feb", total: 2 },
        ]}
        xDataKey="month"
        aria-label="Semantic plot"
        height={180}
        rootProps={{ title: "Semantic plot" }}
      />
    </section>
  );
}
