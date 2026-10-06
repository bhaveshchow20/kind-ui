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
import it in the root layout and place interactive chart code in a client component.
Development builds warn once per document if mounted chart roots lack the stylesheet,
after the document and pending stylesheets load. The warning does not run during SSR
or in production. Keep the import in copied examples.

CSS remains explicit: importing it from the ESM entry would break plain Node imports;
runtime injection would change CSS layer ordering and require inline-style CSP permission.
No styles are injected or fetched. Core styles and tokens remain in the stylesheet;
consumer overrides still win. If you intentionally replace all chart styles, set
`--kind-ui-styles-loaded: 1` on your chart roots to acknowledge that setup.
The diagnostic conservatively waits on unresolved stylesheet links. A link which
failed before mounting after document load can therefore defer the warning; it
does not guess a timeout and warn while a slow stylesheet is still loading.

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

Config patterns supply implicit bar paint and legend swatches. `BarSeries.pattern` overrides config; `false` opts out. For an explicit override, compose `FillPatternSwatch` through `Legend.children` with the same pattern and color. Icons and native legend symbols take precedence; `hideIcon` requests solid swatches. Explicit series `fill` (including gradients), `style.fill`, and `Cell` fills retain native ownership. Custom shapes or custom active bars disable automatic series patterns; compose your own SVG paint for those shapes. Existing material/filter rules apply independently.

Grouped/stacked and horizontal/vertical charts share the same user-space tile; changing orientation does not rotate the encoding automatically. The base ink keeps the configured CSS color. Second ink defaults to `CanvasText`, following the host's `color-scheme`; choose contrasting theme-aware colors deliberately. With the stylesheet, forced colors use `Canvas`/`CanvasText` while retaining the pattern geometry. Patterns are decorative, static and unchanged by reduced motion or print; printer color settings can still affect contrast. Keep text labels and a data alternative, and verify the chosen ink combination in print and each theme.

Resources use React IDs, independently of consumer series IDs, and are stable through matching SSR/hydration trees. Hosts using multiple independent React roots must supply distinct `identifierPrefix` values to server rendering and hydration, as required by React. Recharts retains its native SSR shell; a server-visible legend and data alternative do not imply server-rendered bar geometry.

### Theme-aware series colors

`SeriesColor` accepts a CSS color string, a readonly nonempty array of CSS color
strings, or `{ light, dark }` containing either shape. Arrays are gradient stops,
not categorical palettes: supply separate config keys for category identities.
Stops are evenly distributed from 0 to 100%; a single stop is solid. Each theme's
spacing is preserved when stop counts differ (intermediate colors use CSS
`color-mix(in srgb, ...)`). Empty arrays, sparse arrays, empty strings and incomplete
or unknown theme fields throw. Errors identify the series and color property (including
the theme and stop index when applicable), without printing color values or unrelated
config metadata. For example, an empty second dark stop reports
`config["revenue"].color.dark[1] requires a nonempty color string`.
CSS color syntax remains the browser's responsibility: CSS variables, `currentColor`
and modern color functions pass through unchanged, including during server rendering.

```tsx
const config = {
  revenue: {
    color: { light: ["var(--brand)", "#2563eb"], dark: ["#fef3c7", "#f59e0b", "#92400e"] },
  },
} satisfies SeriesConfig;

// Change colorScheme on this host without changing Root's key or remounting it.
<div style={{ colorScheme: dark ? "dark" : "light", "--brand": "#f59e0b" }}>
  <Root config={config}>
    <Legend />
    <LineChart data={data} width={480} height={240}>
      <XAxis dataKey="month" />
      <YAxis />
      <LineSeries dataKey="revenue" />
      <Tooltip content={(tooltip) => <TooltipContent tooltip={tooltip} />} />
    </LineChart>
  </Root>
</div>
```

Themes follow the inherited CSS `color-scheme`, using native `light-dark()`;
without a host scheme the browser defaults to light. Set `color-scheme: light dark`
on a host for system preference, or `light`/`dark` for an explicit application
choice.

Browser syntax requirements (from MDN compatibility data):

| Generated CSS | Chrome / Edge | Firefox | Safari / iOS Safari |
| --- | --- | --- | --- |
| [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark) for every `{ light, dark }` definition | 123+ | 120+ | 17.5+ |
| [`color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix) for interpolated stops when theme spacing differs | 111+ | 113+ | 16.2+ |
| [`linear-gradient(... in srgb, ...)`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/linear-gradient#browser_compatibility) for gradient legend/tooltip swatches | 111+ | 127+ | 16.2+ |

For themed gradients including matching swatches, use Chrome/Edge 123+, Firefox
127+, or Safari/iOS Safari 17.5+. These are syntax minimums, not a tested-browser
matrix; supplied color values can have additional requirements.

There is no polyfill, feature detection or automatic light/first-stop fallback.
Unsupported functions make the consuming paint or swatch declaration invalid;
SVG paints/stops can use their CSS initial or inherited values, and gradient
swatches can lose their background image. For older browsers, supply supported
plain color strings (or CSS variables with host-controlled light/dark values)
instead of themed objects. Unthemed stop arrays avoid generated `light-dark()`
and `color-mix()`, but their swatches still require the gradient syntax above.

Root retains `--color-<key>` as the first stop, emits zero-based
`--kind-ui-series-<encoded-key>-<index>` stops and a `-gradient` CSS swatch
token, where encoded keys are hexadecimal Unicode code points joined by hyphens.
This namespace cannot collide with another series' legacy `--color-<key>`.
Built-in series/category paints use uniquely scoped resources in each chart SVG; gradients run
left to right across the SVG viewport (including flat line geometry). Legend and
solid tooltip markers display the full gradient; dashed tooltip borders use the
first stop. Explicit native stroke/fill, styles, Cells and shapes retain their
existing ownership; configured bar patterns take precedence and use the first
stop as their solid base ink (the legend pattern swatch does the same). Native
explicit pattern colors remain consumer-owned. Icons keep priority. Strings and one-stop definitions require
no SVG resource. Consumer Root styles override generated tokens as before; override
indexed stops to customize a gradient. No theme subscription or remount is needed.

The runnable `tests/fixtures/identity-colors` host exercises explicit light/dark
changes, unequal stops, CSS variable colors, multiple roots and native paint
precedence (`npm exec vite tests/fixtures/identity-colors`, open `/?theme`).

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

Configured `StackedArea`, `PercentArea` and `InteractiveArea` host recipes also accept these patterns through their `config`. Omit `stackId` for unstacked explicit areas. Explicit composition can instead use `pattern={{ kind: "hatch", angle: 45 }}` on each `AreaSeries`. Series patterns override configuration; `pattern={false}` opts out. Explicit `fill` (including gradients), `style.fill`, and custom `shape` retain ownership and disable automatic pattern resources. With a configured gradient, pattern tiles use the solid first-stop `--color-key` ink; unpatterned areas use the complete chart-local gradient. Explicit stroke still supplies the pattern base when provided. Native `fillOpacity`, filters, geometry and existing material rules remain in effect. Configuration drives default legend swatches; when overriding a series pattern, compose `FillPatternSwatch` through `Legend.children` with the matching pattern/color. Icon/symbol priority and theme/forced-colors behavior follow the shared bar pattern contract above. The mounted packed area fixture at `static.html?patterns` demonstrates overrides, materials, stacking, themes and two independent charts.

The existing Next integration fixture additionally checks real server-rendered
color resource IDs through hydration and a theme change.

### Projected bar rows

`BarSeries<DataPoint, Value>.projection` is opt-in:
`{ isProjected: (datum: DataPoint) => boolean, pattern: FillPattern }`.
The caller supplies values and selects identity; Kind UI generates no forecasts.
For a trailing projection, capture the final row's stable ID before filtering or
reordering, then compare that ID in `isProjected`. It never implicitly marks the
new last visible row. Multiple selected identities are allowed.

```tsx
const projectedId = originalRows.at(-1)?.id;
const projection: BarProjection<Row> = {
  isProjected: (row) => projectedId !== undefined && row.id === projectedId,
  pattern: { kind: "hatch" },
};
// Use in grouped bars or share it across series with the same stackId.
<BarSeries<Row, number> dataKey="value" projection={projection} />;
<Tooltip content={(tooltip) => (
  <TooltipContent tooltip={tooltip}
    isProjected={(entry) => projection.isProjected(entry.payload)} />
)} />;
// In the consumer-owned table, alongside the unchanged numeric value:
<td>{projection.isProjected(row) ? "Projected" : "Observed"}</td>;
```

Selection applies to chart rows or explicitly supplied `BarSeries.data` in both
orientations. Empty chart data produces no marks. Native empty `BarSeries.data` overrides
inherit chart rows; projection follows the actual displayed payload. Null/undefined
rows are never passed
to the selector. Missing values retain native missing-bar behavior, and filtering
out a selected identity does not select a replacement. Zero remains zero. Keep
predicates pure and IDs unique; row indices do not offer reorder-stable identity.

Projection fills use the existing `FillPattern` seam and native Rectangle shape
props, so Brush slices cannot shift identity as positional Cells would. Unselected rows retain
configured/explicit series patterns and full gradient paints. Projection tiles
use the configured theme's solid first stop (`--color-key`), the same documented
fallback as ordinary Bar/Area pattern tiles. `pattern={false}` disables automatic
projection paint. Explicit series `fill`/`style.fill`, native shape options,
custom shapes/active shapes and any explicit Cell composition retain paint
ownership. Datum `fill`/`style.fill` also prevents automatic projection paint for
that row. Compose Cells yourself for custom per-row painting.

`TooltipContent.isProjected(entry)` shares caller selection but receives the
native tooltip entry, including its original payload. Projected items append
accessible text (`projectedLabel`, default `"Projected"`) without modifying
values, labels, formatter behavior or config. Custom tooltip content and data
alternatives must expose status themselves, even when custom paint overrides it.
The runnable public consumer example is the packed Bar fixture at
`/?projection` (add `&horizontal` for horizontal bars); it includes table status,
stacking, filtering, reorder and ownership controls. Configured series metadata
continues to own ordinary patterns; projection is a per-Series composition prop,
not global config or a generated-data recipe.

### Percentage stack formatting

`createPercentStack({ values })` opts into formatting for scalar native
`stackOffset="expand"` Bar, Area and Combo stacks. Geometry, domains, axes and
stack membership remain caller-owned. It returns `tickFormatter` and
`normalizedValue`; no rows, series, native values or native tooltip payloads are
rewritten. Native Recharts still normalizes geometry exactly once.

```tsx
const percent = createPercentStack({
  values: (entry) => {
    // Select this stack, excluding the Combo's latency line and other axes.
    if (entry.dataKey !== "desktop" && entry.dataKey !== "mobile") return undefined;
    const row = entry.payload as { desktop: number; mobile: number } | undefined;
    return row ? [row.desktop, row.mobile] : undefined;
  },
});
// Vertical columns / ordinary Areas: the numeric Y axis only.
<YAxis yAxisId="share" tickFormatter={percent.tickFormatter} />;
// Horizontal bars (layout="vertical"): the numeric X axis only.
<XAxis type="number" tickFormatter={percent.tickFormatter} />;
<Tooltip normalizedValue={percent.normalizedValue} />;
```

Only attach the formatter to an axis whose units are fractions. Other axes keep
native ticks. A shared axis containing raw and fraction units needs a caller
chosen scale/domain; this helper cannot reconcile those units. Custom ticks and
`tickFormatter` stay native and caller-owned. `formatPercent(fraction)` is also
exported (one decimal at most, no locale-dependent output).

`values(entry)` must return the **raw members of that entry's own stack**, including
its value, or `undefined` for unrelated entries. Use native datum identity, stack
and axis selection where keys overlap. Match current native hidden-series
membership; do not sum the tooltip payload, which can contain unrelated stacks,
axes or lines. Update membership alongside controlled legends. Range values,
numeric strings and nonfinite values are outside the helper's scalar contract.

The helper uses the signed sum, matching native expand: missing members contribute
zero to the denominator but remain missing in content; all-zero rows display 0%;
negative fractions remain signed, with no absolute-value conversion or clamping.
A cancelling zero sum with nonzero members has no defined share and retains raw
formatting. Invalid/nonfinite totals or entries also retain raw formatting.
Native negative geometry/domain behavior remains native; this API does not promise
a 0–100% domain for negative data or fabricate absent values.

`Tooltip` and `TooltipContent` accept `normalizedValue(entry): number | undefined`.
Default content shows `25% (1)` with the original value in parentheses, using
configured `formatValue` for that raw text when present. Explicit entry/native
`formatter` takes precedence, including suppression and tuple results. Custom
content receives the unchanged native payload and owns its presentation; pass the
resolver explicitly when composing `TooltipContent`. Missing text, labels,
projection status, patterns and colors keep their existing contracts. For already
normalized source data, provide a resolver that returns the existing fraction;
do not compute another share or apply expand to data already transformed elsewhere.
Hosts still own raw data tables and accessible alternatives.

The source-only example at `/contracts.html` includes vertical/horizontal Bar,
Area and Combo with a separate raw latency axis and original data tables.
Recharts 3.10.1 applies native expand to every numeric axis. For mixed-unit Combo
charts, the example therefore uses caller-selected fraction `dataKey` accessors
for the stacked bars with `stackOffset="none"`, a `[0, 1]` share axis, and an
unchanged raw latency line on `[0, 10]`. The raw rows stay intact; an explicit
native tooltip formatter pairs each fraction with its original row value. Do not
apply expand or divide again to those fraction accessors. Other families use
native expand and the formatting helper. The Percent Area recipe retains integer
tooltip percentages and “No share” for a zero total.

## Decorative chart backgrounds

`ChartBackgroundPattern` is optional Cartesian plot chrome, independent of
`FillPattern` series encoding, legends, visibility and materials. Its transparent
tiles contain only decorative ink; series are painted above it. It uses Recharts'
plot area (excluding margins and axes), a scoped clip path and SVG IDs, and the
[Recharts layer contract](https://recharts.github.io/en-US/guide/zIndex/) just below
the default grid. Custom negative series/grid z-index overrides remain caller-owned.
It adds no layout, axes, tooltip payload, animation or accessibility semantics.
The stylesheet prevents descendant pointer interception.

Generated configured LineChart opts in with:

```tsx
<Chart.LineChart
  config={config}
  data={data}
  xDataKey="month"
  aria-label="Monthly totals"
  backgroundPattern={{ pattern: "pinpoints", opacity: 0.15 }}
/>
```

Explicit composition uses the part inside the chart. Configured explicit children
replace generated parts, so do not also pass `backgroundPattern`:

```tsx
<Chart.Root config={config}>
  <Chart.BarChart data={data} responsive style={{ width: "100%", height: 280 }}>
    <Chart.ChartBackgroundPattern pattern="crossings" size={20} opacity={0.12} />
    <Chart.XAxis dataKey="month" />
    <Chart.YAxis />
    <Chart.BarSeries dataKey="total" />
    <Chart.Tooltip />
  </Chart.BarChart>
</Chart.Root>
```

Presets are `pinpoints`, `crossings` and `waves`. `size` is a positive finite tile
size in SVG user units (default 16), and `opacity` is finite in [0, 1] (default
0.15). Zero opacity is supported. `color` accepts CSS paint, including theme
variables; the default is `var(--kind-ui-chart-grid, CanvasText)`. Resize changes
the plot rectangle and clip, preserving tile density and IDs. Missing or empty
plot geometry renders nothing; invalid options throw even before geometry exists.

Custom registration is consumer-owned and immutable: define reusable patterns in
a local module or catalog, then pass the definition directly. No global registry,
provider, series metadata or side-effect registration is required:

```tsx
const cornerMarks = Chart.defineChartBackgroundPattern(({ size, color, idPrefix }) => (
  <g id={`${idPrefix}-tile`}>
    <path d={`M0 ${size / 3}V0H${size / 3}`} fill="none" stroke={color} />
  </g>
));
const backgrounds = { cornerMarks }; // optional local catalog

<Chart.ChartBackgroundPattern pattern={backgrounds.cornerMarks} size={24} opacity={0.1} />;
```

The render escape hatch returns tile SVG children, not a full chart or pattern
element. Use the supplied `size`, `color`, and per-instance `idPrefix`; suffix
custom resource IDs and reference those scoped IDs. Keep custom output decorative:
no links, focusable elements, event handlers, portals or independent z-index
layers. The callback is trusted consumer code, not an SVG sanitizer.

Supported composition hosts are Line, Bar (including Waterfall), Area, Combo,
Scatter, Histogram and BoxPlot charts using the native Cartesian plot area.
Generated configuration is available only for LineChart. Polar, Pie, Sankey,
Heatmap and ActivityRings are outside this contract. Fixed-size chart SSR retains
the existing native empty shell; this part does not create server plot geometry.
## Legend and mark interactions

Visibility remains the default. Opt into persistent focus with one Root owner:

```tsx
<Root config={config} interaction={{
  kind: "series", mode: "focus", eligibleKeys: ["revenue", "costs"],
  markActivation: "matching-legend", defaultSelected: "revenue",
  onSelectionChange: (key) => console.log(key),
}}>
  <BarChart data={rows} width={400} height={240}>
    <BarSeries dataKey="revenue" /><BarSeries dataKey="costs" />
  </BarChart>
  <Legend emphasis="series" />
</Root>
```

`interaction` binds a `kind` (`series`, `category`, or focus-only `node`) to a
settled `eligibleKeys` snapshot. Include hidden Root items and zero values; exclude
removed, filtered, unavailable, or native-hidden items. Config-only entries do not
satisfy the last-visible guard. New bindings require that snapshot; native series
registration provides compatibility eligibility for existing controlled legends.
`mode` defaults to `visibility`; `markActivation` defaults to `none`.

Focus accepts either `selected` with required `onSelectionChange`, or
`defaultSelected` with an optional callback. Persistent focus works with
`emphasis="none"`. Repeated activation or Escape clears it; transient inspection
never writes selection. Invalid uncontrolled selection clears without a callback.
An invalid controlled ID paints no selection and resumes if that ID becomes valid.
Visibility uses existing `visibleSeries`/`onVisibleSeriesChange`, or opt-in
`defaultVisibleSeries`. An externally empty visibility value remains valid.

For categories, use `kind: "category"` and explicitly set
`interactionBinding="root"` on `PieSeries` or `RadialBarChart`, with `categoryKey`
and explicit data. Stable unique string keys must match Root config. Hiding filters
original rows and their positional Cells before layout; Pie re-normalizes angles.
ActivityRings forwards this binding through category `rootProps.interaction`.
For Sankey node focus, bind both `SankeyChart` and `SankeyLegend` to a Root with
`kind: "node", mode: "focus"`; incident links/endpoints remain emphasized.
Sankey visibility, link selection, and persistent Heatmap cell selection are excluded.

`useChartInteraction()` exposes `selected`, `visible`, `mode`, `kind`, `eligible`,
`activate({kind, key}, "legend" | "mark", event?)`, and `reset(event?)` for custom
controls. Actions return whether accepted. Consumer native handlers run first;
`preventDefault()` or `onBeforeInteraction(request)` returning `false` vetoes.
Reset also runs the before hook. Accepted actions emit one mode-specific callback
and one scoped polite announcement. Rejected last-hide actions announce the reason
without changing state or calling the change callback. Custom renderers retain
ownership and can use the helper to bind their own controls/paint.

Radar's existing local `selection="series"` remains a compatibility path, also
independent of transient emphasis. Combining it or its selection callbacks with
Root focus throws: choose one owner. Selection ownership stays fixed while mounted;
remount when changing controlled/uncontrolled ownership.
