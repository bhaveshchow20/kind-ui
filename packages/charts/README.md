# Kind UI charts

Composable React charts built on Recharts and Motion, with shared interaction,
controlled visibility and optional animation. Start with a complete chart, then
customize its parts through public components and typed props.

[Website](https://kindui.dev/charts) ·
[Documentation](https://kindui.dev/charts/docs/) ·
[Examples](https://github.com/bhaveshchow20/kind-ui/tree/main/examples/chart) ·
[GitHub](https://github.com/bhaveshchow20/kind-ui)

## Chart types

| Family | Charts |
| --- | --- |
| Cartesian | Line, Area, Bar, Combo |
| Polar | Pie/Donut, Radar, Radial/ActivityRings |
| Relationships | Scatter/Bubble, Heatmap |
| Distributions | Histogram, BoxPlot |
| Flow & change | Sankey, Waterfall |

Donut and Bubble use `PieChart` and `ScatterChart` composition.

## Install

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at your application entry. In Next.js,
place interactive chart code in a client component.

## Series labels

Configuration keys must match the series `dataKey` (or its explicit `seriesKey`).
When `label` is omitted, built-in labels use the matching key: `visitors` becomes
`Visitors` and `monthlyVisitors` becomes `Monthly visitors`. Camel-case and acronym
boundaries, underscores and hyphens become spaces; words are lowercased, then the
first letter is capitalized. Supply an explicit label to preserve custom casing
or wording, including an intentionally empty label. Keys and colors are unchanged.
Category charts use their configured category identity for this inference.

## Quick start

Configured `LineChart` supplies responsive sizing, axes, series, tooltip and
legend. Give the chart an accessible name and include a data alternative:

```tsx
"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { day: "Mon", tasks: 0 },
  { day: "Tue", tasks: 12 },
  { day: "Wed", tasks: 8 },
];
const config = {
  tasks: { label: "Tasks", color: "#3659b8" },
} satisfies SeriesConfig;

export function TasksChart() {
  return (
    <section>
      <LineChart
        data={data}
        config={config}
        xDataKey="day"
        aria-label="Tasks by day"
      />
      <table>
        <caption>Tasks by day</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">Tasks</th></tr>
        </thead>
        <tbody>
          {data.map(({ day, tasks }) => (
            <tr key={day}><th scope="row">{day}</th><td>{tasks}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

Use the [Line guide](https://kindui.dev/charts/docs/components/line/)
for composition and customization. The documentation covers chart selection,
peer requirements, styling, motion and accessibility; applications own their
data, domains and business state.

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.

### Patterned bar fills

`FillPattern` is static SVG paint independent of `material`: `{ kind: "hatch" | "stripe" | "duotone", color?, size?, width?, angle? }`. `size` is a positive SVG-unit tile size (8 by default); `width` is positive and at most `size` (1 for hatch, 2 for stripe). `angle` defaults to 45 degrees for hatch and 0 otherwise. Duotone divides the tile equally between the series color and second ink; width does not affect its split.

```tsx
const config = {
  actual: { color: "#789abc", pattern: { kind: "hatch" as const } },
  planned: { color: "#ed79ae", pattern: { kind: "stripe" as const } },
};
<Root config={config}>
  <Legend />
  <BarChart data={rows} width={480} height={260}>
    <XAxis dataKey="category" />
    <YAxis />
    <BarSeries dataKey="actual" material="clay" />
    <BarSeries dataKey="planned" pattern={{ kind: "duotone", color: "CanvasText" }} />
  </BarChart>
</Root>
```

Config patterns supply implicit bar paint and legend swatches. `BarSeries.pattern` overrides config; `"none"` opts out. For an explicit override, compose `FillPatternSwatch` through `Legend.children` with the same pattern and color. Icons and native legend symbols take precedence; `hideIcon` requests solid swatches. Explicit series `fill` (including gradients), `style.fill`, and `Cell` fills retain native ownership. Custom shapes or custom active bars disable automatic series patterns; compose your own SVG paint for those shapes. Existing material/filter rules apply independently.

Grouped/stacked and horizontal/vertical charts share the same user-space tile; changing orientation does not rotate the encoding automatically. The base ink keeps the configured CSS color. Second ink defaults to `CanvasText`, following the host's `color-scheme`; choose contrasting theme-aware colors deliberately. With the stylesheet, forced colors use `Canvas`/`CanvasText` while retaining the pattern geometry. Patterns are decorative, static and unchanged by reduced motion or print; printer color settings can still affect contrast. Keep text labels and a data alternative, and verify the chosen ink combination in print and each theme.

Resources use React IDs, independently of consumer series IDs, and are stable through matching SSR/hydration trees. Hosts using multiple independent React roots must supply distinct `identifierPrefix` values to server rendering and hydration, as required by React. Recharts retains its native SSR shell; a server-visible legend and data alternative do not imply server-rendered bar geometry.


### Area patterns

`AreaSeries` accepts the shared `FillPattern` through `pattern` or `Root.config[key].pattern`, independently of `material`. The additive `dots` kind uses `width` as dot diameter (default 1); `lines` uses stroke width (default 1) and defaults to angle 0. Both use size 8 by default. Existing hatch, stripe and duotone encodings retain their defaults. These kinds also work with bars and `FillPatternSwatch`.

```tsx
const config = {
  actual: { color: "#789abc", pattern: { kind: "dots" as const, width: 2 } },
  planned: { color: "var(--area-planned)", pattern: { kind: "lines" as const } },
};
<Root config={config}>
  <Legend />
  <AreaChart width={480} height={260} data={rows}>
    <XAxis dataKey="month" />
    <YAxis />
    <AreaSeries dataKey="actual" stackId="total" material="clay" fillOpacity={0.4} />
    <AreaSeries dataKey="planned" stackId="total" fillOpacity={0.4} />
  </AreaChart>
</Root>;
```

Configured `StackedArea`, `PercentArea` and `InteractiveArea` host recipes also accept these patterns through their `config`. Omit `stackId` for unstacked explicit areas. Explicit composition can instead use `pattern={{ kind: "hatch", angle: 45 }}` on each `AreaSeries`. Series patterns override configuration; `pattern="none"` opts out. Explicit `fill` (including gradients), `style.fill`, and custom `shape` retain ownership and disable automatic pattern resources. Native `fillOpacity`, filters, geometry and existing material rules remain in effect. Configuration drives default legend swatches; when overriding a series pattern, compose `FillPatternSwatch` through `Legend.children` with the matching pattern/color. Icon/symbol priority and theme/forced-colors behavior follow the shared bar pattern contract above. The hydrated packed area fixture at `static.html?patterns` demonstrates overrides, materials, stacking, themes and two independent charts.
