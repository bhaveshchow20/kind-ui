# Kind UI charts

Kind UI Charts (`@kind-ui/charts`) is an MIT-licensed React chart library built on
Recharts and Motion, with TypeScript APIs and examples for React and Next.js.
It provides composable chart components, shared interaction, controlled visibility
and optional animation. Compose a chart from styled family parts, then customize them through typed props.

[Website](https://kindui.dev/charts) ·
[Documentation](https://kindui.dev/charts/docs/) ·
[Examples](https://kindui.dev/charts/docs/components/line/) ·
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

Kind UI uses Tailwind CSS v4. Add the installed package to your Tailwind entry CSS;
`@source` paths are relative to that CSS file:

```css
/* src/app.css or app/globals.css */
@import "tailwindcss";
@source "../node_modules/@kind-ui/charts/dist";
```

For Vite, install `tailwindcss` and `@tailwindcss/vite` as development dependencies
and add `tailwindcss()` to the `plugins` array in `vite.config`. For Next.js, use
`tailwindcss` and `@tailwindcss/postcss` with your PostCSS configuration. Import
your CSS at the application entry or Next.js root layout, and place interactive
Next.js chart code in a client component. The
[installation guide](https://kindui.dev/charts/docs/installation/) includes complete
configuration examples.

The package has no stylesheet export. Components carry their default Tailwind
classes, and consumer `className` utilities override conflicting defaults.
Explicit `style` props remain available. Use unprefixed Tailwind utilities for charts;
prefixed builds must provide a separate unprefixed Tailwind entry for the package.
For a nonce-based Content Security Policy, pass the request nonce directly to the
chart with `nonce` to authorize runtime animation styles.

The repository checks pinned minimum and selected stable Vite/Next combinations;
the repository’s `docs/compatibility.md` and `docs/bundle-measurements.md`
record exact versions and measurement limits. Peer ranges do not imply every combination has been
tested. Package-wide Tailwind `@source` scanning includes utilities for all chart
families, even when the JavaScript build removes unused families.

### Theme and overrides

Charts inherit the host’s `--foreground`, `--border`, `--muted`,
`--muted-foreground`, `--popover`, `--popover-foreground` and `--radius` variables.
Set them on a surrounding element to scope a theme. Series colors come from your
config; use CSS palette variables, CSS colors, gradients or `{ light, dark }`
colors. Themed colors follow the host’s `color-scheme`.

Use `className` and `style` on the chart to customize the plot, and on each part
to customize that part. `frameProps` accepts outer HTML frame attributes and styles.
Explicit plot dimensions and styles take precedence over default size utilities.
Custom shapes, paint, handlers and refs remain consumer-owned.

## Quick start

A family root owns data, metadata, sizing and shared behavior. Compose the parts
you want to show, give the chart an accessible name and include a data alternative:

```tsx
"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";

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
        aria-label="Tasks by day"
      >
        <LineChart.Grid />
        <LineChart.XAxis dataKey="day" />
        <LineChart.YAxis />
        <LineChart.Series dataKey="tasks" type="monotone" strokeWidth={2} dot={{ r: 2.5 }} />
        <LineChart.Tooltip />
        <LineChart.Legend />
      </LineChart>
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

## Family parts

Every chart takes `config`, an accessible name, and explicit children. Config
provides labels and colors; it never creates series, axes, legends or tooltips.
Omitting a part omits it. Fragments and wrapped components are supported.

| Chart | Parts |
| --- | --- |
| `LineChart`, `AreaChart`, `BarChart` | `Grid`, `XAxis`, `YAxis`, `Series`, `Tooltip`, `Legend`, `Background` |
| `ComboChart` | `Grid`, `XAxis`, `YAxis`, `Line`, `Area`, `Bar`, `Scatter`, `Tooltip`, `Legend`, `Background` |
| `PieChart` | `Series`, `Cell`, `Labels`, `Tooltip`, `Legend` |
| `RadarChart` | `Grid`, `AngleAxis`, `RadiusAxis`, `Series`, `Tooltip`, `Legend` |
| `RadialBarChart` | `Grid`, `AngleAxis`, `RadiusAxis`, `Series`, `Cell`, `Labels`, `Label`, `Tooltip`, `Legend` |
| `ScatterChart` | `Grid`, `XAxis`, `YAxis`, `ZAxis`, `Series`, `Tooltip`, `Legend` |
| `WaterfallChart` | `Grid`, `XAxis`, `YAxis`, `Series`, `Connectors`, `Labels`, `Tooltip`, `Legend` |
| `HistogramChart` | `Grid`, `XAxis`, `YAxis`, `Series`, `Tooltip`, `Legend` |
| `BoxPlotChart` | `Grid`, `XAxis`, `YAxis`, `Series`, `Mark`, `Tooltip`, `Legend` |
| `HeatmapChart` | `Grid`, `Tooltip`, `Legend`, `DataTable`, `Cell` |
| `ActivityRings` | `Series`, `Labels`, `Tooltip`, `Legend` |
| `SankeyChart` | `Nodes`, `Links`, `Node`, `Link`, `NodeLabel`, `Tooltip`, `Legend`, `Table` |

Cartesian charts also expose `ReferenceLine`, `ReferenceArea`, `ReferenceDot`
and `Brush`. `Content` places custom HTML controls or data alternatives outside
the plot while retaining the chart’s context. `legendPosition="top"` places HTML
parts before the plot; the default is below.

Chart `height`, `width`, `responsive`, `style` and `className` control plot sizing.
SVG charts default to a 280px plot. ActivityRings uses its 300px default, and Heatmap
uses its row/column grid sizing. Data and geometry remain family-specific.
Cartesian grids default to horizontal dashed lines; X/Y axes use muted 12px ticks
without axis or tick lines. Native presentation props override those defaults.

## Data and labels

Configuration keys match a series’ `dataKey` or explicit `seriesKey`. Labels are
inferred from keys when omitted; explicit labels, including empty labels, win.
Use `seriesKey` for numeric or function data keys. Category charts use stable
category keys and per-category metadata. Keep original rows mounted when hiding
items so stack baselines, domains, angles and tooltip identities stay stable.

Histogram takes validated bins from `binHistogram`; compose its numeric axes and
series explicitly. BoxPlot takes lower/upper whiskers, quartiles, a median and
optional outliers. Waterfall uses `computeWaterfallData` and explicit Series and
Connectors. Heatmap takes rows, columns, values and a `createHeatmapScale` scale.
Sankey takes nodes and links; `Nodes` and `Links` choose their renderers, with a
`render` callback for custom marks. `Table` uses the chart’s data.
ActivityRings takes `rings` with stable keys, values and optional finite domains;
`Series` includes its progress axes, and `Labels` belongs inside Series.

Applications own aggregation, filtering, dates, units, domains and request state.

### Treemap hierarchy and independent color

`TreemapChart` explores hierarchical nonnegative area measures. Storage, traffic,
revenue, holding values and market activity use the same contract; applications
provide their units, reporting period and accounting meaning. This API belongs to
the current release candidate. The published `0.5.0` package does not export
Treemap; installation from npm requires a subsequent release containing it.

Standard records use `TreemapDatum`: `{ kind: "leaf", id, label, value }` or
`{ kind: "group", id, label, children }`. Groups derive their area from descendant
leaves and cannot supply an independent `value`. Custom records use typed
`accessors` for `id`, `label`, `children` and leaf `value`; the value accessor runs
only for leaves. Undefined children mean leaf; an explicit empty array means
empty group. Every ID must be globally unique and nonempty, labels must be
nonempty but may repeat, and leaf areas and derived totals must be finite and
nonnegative. Cycles, shared records and invalid children throw errors identifying
their hierarchy location. Missing area requires a caller policy; Core never
silently converts it to zero or takes the absolute value of negative input.

```tsx
import {
  TreemapChart,
  type TreemapAccessors,
  type TreemapColorEncoding,
} from "@kind-ui/charts";

type Resource = {
  id: string;
  name: string;
  storageGb?: number;
  changePercent?: number | null;
  children?: readonly Resource[];
};
const data: readonly Resource[] = [{
  id: "services", name: "Services", children: [
    { id: "archive", name: "Archive", storageGb: 80, changePercent: -3 },
    { id: "search", name: "Search", storageGb: 20, changePercent: 5 },
  ],
}];
const accessors: TreemapAccessors<Resource> = {
  id: (datum) => datum.id,
  label: (datum) => datum.name,
  children: (datum) => datum.children,
  value: (datum) => datum.storageGb ?? 0, // Explicit missing-area policy.
};
const encoding: TreemapColorEncoding<Resource> = {
  type: "diverging",
  value: (datum) => datum.changePercent,
  domain: [-10, 10],
  label: "Storage change over the last month",
  formatValue: (value) => `${value}%`,
  unknownLabel: "Change unavailable",
};

<TreemapChart
  data={data}
  accessors={accessors}
  encoding={encoding}
  config={{}}
  aria-label="Storage allocation in GB"
  formatValue={(value) => `${value} GB`}
>
  <TreemapChart.Groups />
  <TreemapChart.Tiles />
  <TreemapChart.Labels />
  <TreemapChart.Tooltip />
  <TreemapChart.ColorLegend />
  <TreemapChart.Breadcrumbs />
  <TreemapChart.DataTable caption="Storage allocation and monthly change" />
</TreemapChart>
```

Compose parts explicitly; omitted parts stay omitted. `Content` accepts custom
controls or readouts. The data alternative retains zero leaves and empty groups,
while zero-area nodes have no visible glyph. Normalized nodes retain `datum`,
`kind`, `parentId`, root-to-node ID `path`, `depth` and derived `value`.
`normalizeTreemap` exposes the same model without rendering: roots, preorder
nodes, `byId` and total. `rootShare` divides by the supplied forest total,
`parentShare` by the parent total (the forest for roots), and rectangle
`viewShare` by the current subtree total. Zero denominators produce `null`.
Filtering replaces the input and changes these denominators; root share is not
automatically percentage of NAV or an external universe.

Color is independent of area. `encoding` supports `categorical`, `sequential`,
zero-centered `diverging`, `threshold` and `custom` modes; the same resolved
encoding drives tiles and the color legend. Fixed domains preserve comparisons;
omitted continuous domains are inferred from available node metrics in `domainScope="root"`
(default) or `"view"`. Equal domain endpoints use the middle paint. Continuous
paint clamps outliers without changing readouts; threshold boundaries belong to
the upper band. Missing/nonfinite color metrics use `unknownColor` and
`unknownLabel`, separately from numerical zero. Group colors require `groupValue`
or an explicit numeric `aggregate` callback; Core does not invent group returns
by averaging leaves. Format percentages and percentage points in caller
formatters with their actual units.

`viewId` / `onViewChange`, `activeId` / `onActiveChange`, and `selectedId` /
`onSelectionChange` provide controlled subtree, transient inspection and
persistent selection. Their `default*Id` counterparts initialize uncontrolled
state. Activation selects the node, calls `onActivate`, and enters groups;
inspection alone preserves geometry. If a node disappears, state falls back to
its nearest surviving ancestor, then the forest root (`null`). Breadcrumbs are
buttons. Tile navigation uses one tab stop with arrows and Home/End; Enter/Space
activates, and Escape dismisses the tooltip. Include `DataTable` for a navigable
alternative containing small and zero-valued items.

`depth`, `padding` and `groupHeaderHeight` control nested density. Labels use
`minWidth`, `minHeight` and label `padding` thresholds and clip overflowing text.
`layout="stable"` (default) retains layout
rows while hierarchy membership and subtree view remain unchanged; regrouping,
membership changes or a new view invalidate that cache. `layout="squarify"`
recomputes rows. Stable IDs preserve identity, not fixed coordinates. Core uses
the narrow ISC-licensed `d3-hierarchy` layout dependency with React-owned marks
to retain ID-based focus and control grouped headers. Color-only updates do not
recalculate geometry; area updates and resize can move tiles. `animate` is opt-in
and respects reduced motion. Applications own loading, filtering and request
state through the existing frame contracts.

## Visibility and interaction

Use `visibleSeries` with `onVisibleSeriesChange` for controlled visibility, or
`defaultVisibleSeries` for an uncontrolled selection. Controlled ownership stays
fixed while mounted. An externally empty selection is valid. Interactive legends
refuse to hide the last active eligible item.

```tsx
<BarChart
  config={config}
  data={data}
  height={280}
  aria-label="Revenue and costs"
  visibleSeries={visible}
  onVisibleSeriesChange={setVisible}
>
  <BarChart.XAxis dataKey="month" />
  <BarChart.YAxis />
  <BarChart.Series dataKey="revenue" />
  <BarChart.Series dataKey="costs" />
  <BarChart.Tooltip />
  <BarChart.Legend />
</BarChart>
```

`interaction` accepts `kind: "series" | "category" | "node"`, an eligible-key
snapshot and focus/visibility state. Node interaction supports focus only. Focus
accepts `selected` with `onSelectionChange`, or `defaultSelected` with an optional
callback. Repeated activation or Escape clears selection. Focus dims peers without
changing their geometry or data. Set `markActivation="none"` within interaction
to keep marks passive, and `emphasis="none"` to disable transient emphasis.

`useChartInteraction()` supplies state and actions for custom controls rendered
within a chart’s Content part. Native handlers run first; `preventDefault()` or
`onBeforeInteraction` returning false vetoes an action. Accepted actions produce
one callback and a scoped polite announcement. Keep hidden legend entries
operable so consumers can restore them.

## Animation and loading

Each family accepts `animate` and its family-specific animation options. Reduced
motion disables decorative movement. Use `loading` and an optional `loadingLabel`
while awaiting data. Loading shows only the graph skeleton: legends, content, data
tables and chart inspection remain hidden until the data is ready. Chart parts stay
mounted, preserving consumer state and selected or hidden series across loading.
Loading is independent of whether the data array is empty.

```tsx
<LineChart
  config={config}
  data={data}
  height={280}
  aria-label="Monthly totals"
  animate={{ revealDurationMs: 650 }}
  loading={pending}
  loadingLabel="Loading monthly totals"
>
  <LineChart.XAxis dataKey="month" />
  <LineChart.YAxis />
  <LineChart.Series dataKey="total" />
  <LineChart.Tooltip />
</LineChart>
```

Loading keeps actual content mounted, sized, hidden and inert, and exposes
`aria-busy` with a live status. Completion restores current data immediately and
rearms an enabled entrance; it does not delay completion. Requests, partial
results, cancellation, retries, errors and empty-result messages remain
application-owned.

## Paint and presentation

- `material="clay"` and `material="glow"` add decorative finishes; omitted material
  uses the plain default. Sankey uses the same choices through `finish`.
- Series `pattern` accepts hatch, stripe, duotone, dots or lines. `size` and `width`
  are positive; width cannot exceed size. Series patterns override config patterns;
  `pattern={false}` opts out. Explicit paint, Cells and custom shapes retain ownership.
- Bar `projection={{ isProjected, pattern }}` selects rows by consumer-owned
  identity. Kind creates no forecasts. Use `TooltipContent.isProjected` and your
  data alternative to expose projected status without changing numeric values.
- `createPercentStack({ values })` returns tick and tooltip formatting for native
  `stackOffset="expand"` stacks. It never rewrites rows, values or geometry.
- `Background` adds decorative Cartesian plot chrome. Built-in patterns are
  `pinpoints`, `crossings` and `waves`; use `defineChartBackgroundPattern` for a
  custom tile. It contributes no data, axes or tooltip entries.
- Series labels, active marks, icons, per-point Cells, curves, radii, units and
  custom tooltip content retain their native family contracts.

Use `TooltipContent` through a Tooltip part’s `content` prop for custom formatting
and panel styling. `Legend` supports noninteractive custom item content and
configured icons/symbols; `hideIcon` selects a color swatch. Tooltip entries retain
original values and order when data is dimmed or hidden.

## Accessibility

Give every chart `aria-label` or `aria-labelledby`, preserve its keyboard
accessibility layer, and include a named data alternative. A tooltip alone is not
a data alternative. Keep units, missing values, zeroes and projected status
explicit in tables and custom tooltips. Chart loading and interaction announcements
are scoped to their chart. Consumer controls own their focus, labels and semantics.

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.
