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
| Cartesian | Line, Area, Bar, Combo, Candlestick |
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

## Candlestick

### Records and financial meaning

`CandlestickChart` accepts ordered immutable records, an explicit `timeMode`, and
optional typed `accessors`. Standard records contain `time`, `open`, `high`, `low`,
`close`, and optional `volume`, `gap`, and `state`. Accessors accept a row key or
`(row, index) => value` for each field, so provider records stay caller-owned.
`normalizeCandlestickData(data, { timeMode, accessors, priceScale, priceBounds })`
is also available separately. Every normalized point retains `original`, `time`,
`timeValue`, and a stable mode-prefixed `identity`.

Choose `timeMode="epoch-ms"` for safe integer millisecond instants within the Date
range, or `timeMode="business-date"` for strictly valid `YYYY-MM-DD` session dates.
Business dates use UTC midnight only as their scale coordinate; format session
labels as business dates rather than converting them to a local instant. Data
must have unique ascending time identities. Invalid/sparse records, failed
accessors, nonfinite values, incomplete OHLC, and malformed dates fail with field
paths. The library never sorts, deduplicates, guesses timestamp units, or fills
missing intervals.

Observed candles require `low <= min(open, close) <= max(open, close) <= high`.
Linear scales accept negative prices. Log scales require strictly positive
prices. Supplied volume must be finite and nonnegative; omitted volume remains
missing, and zero remains zero. `{ time, gap: true }` retains a time slot but must
omit OHLC and volume. `state` is arbitrary caller metadata such as `partial` or
`final`, and never changes the prices.

Use explicit source and unit labels in the readout and table. Trade, bid, ask,
sample-derived, and settlement observations have different meanings. Sampled
prices cannot establish true trade extrema or volume. The library does not
convert units, clamp probability prices, complement separately traded outcomes,
reconstruct trades, adjust corporate actions, compute indicators, or manage
feeds, authentication, exchange calendars, pagination, cancellation, and retries.
Those remain application/adapter responsibilities.

### Domains and history windows

`CandlestickViewport` is `{ from, to }` in fractional inclusive logical indexes.
Index zero identifies the first record, including explicit gaps. Fitting `n`
records produces `{ from: -0.5, to: n - 0.5 }`, leaving half a slot on each edge;
empty history has the neutral `[-0.5, 0.5]` window. A valid window has finite
`from < to`. Windows clamp to history while retaining their span where possible.

- `fitCandlestickViewport(count)` fits history; `normalizeCandlestickViewport`
  accepts `(viewport, count)` to clamp it.
- `panCandlestickViewport(viewport, delta, count)` uses logical-slot deltas.
  `zoomCandlestickViewport(viewport, factor, anchor, count)` keeps the supplied
  logical anchor in place; factors above one zoom in, with a minimum one-slot
  span. Reset uses the fit helper.
- `reconcileCandlestickViewport(previousPoints, nextPoints, viewport,
  { followLatest })` preserves the first surviving visible identity during
  prepend, replace, correction, and append updates. If no visible identity
  survives, it clamps the old logical window. Empty-to-populated history fits
  the new history. Follow-latest is opt-in and applies only when the previous
  window was already at the latest edge.
- `getCandlestickVisiblePoints(points, viewport, overscan = 0)` returns actual
  records without aggregation or mutation. Overscan is a nonnegative integer
  count of extra records at both edges; gaps retain their positions.

`spacing="ordinal"` uses logical indexes and compresses omitted intervals;
`spacing="elapsed"` uses actual time distances. Neither infers trading sessions.
`getCandlestickTimeCoordinate(point, index, spacing)` and
`getCandlestickTimeDomain(points, viewport, spacing)` supply native numeric X
coordinates. Elapsed domains interpolate fractional positions and extrapolate
edge slots using the first/last observed interval. A single point uses a
one-millisecond neutral slot.
`getCandlestickLogicalCoordinate(points, coordinate, spacing)` inverts those
coordinates, including interpolation and edge extrapolation, for custom pointer
and elapsed-time viewport controls.

`getCandlestickPriceDomain(points, options)` supports `viewport`,
`autoscale: "visible" | "all"`, `domain: [minimum, maximum]`, `padding`,
`scale: "linear" | "log"`, `bounds`, and explicit `overlayValues`.
By default it uses visible records when a viewport is supplied, otherwise all
records, and adds 5% padding on each side. Extents use full low/high wicks and
never force zero. Padding is a fraction of the linear span or logarithmic span.
A constant-price candle receives a small nonzero domain even with zero padding;
an empty unconstrained domain is `[0, 1]` for linear or `[1, 10]` for log.
An explicit fixed domain controls clipping and bypasses padding. Caller bounds
validate every observation, including offscreen data and included overlay
values; only computed padding is clipped to bounds. Fixed domains must fit the
bounds, and log domains/bounds must be positive. Only explicitly supplied
overlay values contribute to autoscaling.

The default `CandlestickDatum` type requires complete OHLC fields or an explicit
`gap: true` record without price/volume fields. Custom row types remain supported
through the existing accessors.

### Composition and chart props

The owning chart renders only the parts you include. Every part also has a named
export, such as `CandlestickSeries` or `CandlestickDataTable`. Use explicit axes
alongside a Series; there is no separate Root or Plot wrapper.

```tsx
import { CandlestickChart, type CandlestickDatum } from "@kind-ui/charts";

const observations: CandlestickDatum[] = [
  { time: "2026-10-01", open: 40, high: 44, low: 38, close: 43, volume: 120 },
  { time: "2026-10-02", open: 43, high: 45, low: 39, close: 41, volume: 95 },
  { time: "2026-10-05", gap: true },
];

<CandlestickChart
  data={observations}
  timeMode="business-date"
  config={{
    price: { label: "Illustrative trade prices", color: "#3b82f6" },
    volume: { label: "Volume in units", color: "#94a3b8" },
  }}
  aria-label="Illustrative daily trade OHLC, USD per unit"
  height={320}
  formatPrice={(value) => `$${value.toFixed(2)}`}
  formatVolume={(value) => `${value.toLocaleString()} units`}
>
  <CandlestickChart.Grid vertical={false} />
  <CandlestickChart.XAxis />
  <CandlestickChart.YAxis />
  <CandlestickChart.Series
    seriesKey="price"
    rising="#10b981"
    falling="#f43f5e"
    unchanged="#94a3b8"
  />
  <CandlestickChart.Volume seriesKey="volume" axisProps={{ hide: true }} />
  <CandlestickChart.Crosshair />
  <CandlestickChart.Content />
  <CandlestickChart.DataTable caption="Illustrative trade OHLC in USD and volume in units" />
</CandlestickChart>;
```

| Root prop | Behavior/default |
| --- | --- |
| `data`, `timeMode`, `config`, accessible name, `children` | Required. `accessors` defaults to standard field names. |
| `spacing` | `"ordinal"`; `"elapsed"` preserves real time distances. |
| `viewport`, `defaultViewport` | Controlled or initially uncontrolled logical window; otherwise fits initial history. An initial default survives empty loading data until the first observations arrive. Do not supply both or change controlled mode during a mount. |
| `onViewportChange(range, details)` | Details include `reason` (`pan`, `zoom`, `reset`, `data`, `keyboard`) and actual visible `first`/`last` time identities, or null for no visible records. The application owns pagination. |
| `followLatest` | `false`; appends follow only when enabled and already viewing the latest edge. |
| `overscan` | `1` extra record on each side for rendering; no aggregation. |
| `priceScale`, `autoscale` | `"linear"`, `"visible"`; log validates positive prices, all-data autoscale uses every candle. |
| `priceDomain`, `priceBounds`, `pricePadding` | Fixed domain, validated inclusive bounds, and per-side padding fraction (default `0.05`); see domain semantics above. |
| `volumeRatio` | `0.22`, greater than zero and less than `0.5`; reserves plot space only when Volume is composed. |
| `selection`, `defaultSelection` | Time identity or null; persistent selection is separate from transient inspection. Default is null; choose one control mode. |
| `onSelectionChange`, `onInspect` | Receives the normalized point with `original`, or null when cleared. |
| `formatTime`, `formatPrice`, `formatVolume` | `(value, point?) => string`; default `String(value)`. Axis ticks may omit the point; readouts retain it. Supply currency, decimals, timezone, source, and volume units explicitly. |
| `loading`, `loadingLabel`, `empty` | Loading follows the existing family contract; empty defaults to `"No candle observations"`. Errors, retry and cancellation belong to the application. |
| `animate` | `false` by default; accepts the Bar-family animation option type, including `revealDurationMs` and `revealEasing`, for the shared SVG entrance reveal. Latest-candle corrections and the current-price marker move for 120 ms; discrete zoom/reset windows move for 200 ms. Dragging, data reconciliation and reduced motion use the exact target geometry immediately. |
| Sizing, native chart props, `frameProps` | Existing family sizing and native Recharts chart options; root `layout`, `stackOffset` and `reverseStackOrder` are excluded and rejected at runtime. `frameProps` controls outer HTML attributes/ref/handlers. Native handlers run first and may veto by preventing default. |

`Series` requires `seriesKey` for config, paint and visibility. It draws full
low/high wicks and an open/close body; equal open/close draws a visible doji line
without inventing a price range. `rising`, `falling`, and `unchanged` override the
series color independently; these directions do not imply a favorable outcome.
`barSize`, `maxBarSize` (default 24 pixels), and `markProps` customize presentation.
`shape` receives pixel-valued `CandlestickMarkProps`, the original-row point,
and native Recharts shape props. `Mark` is separately exported for custom SVG
composition. Price and volume have separate pane clips, and fixed domains clip
marks within their own pane. Entrance animation updates one shared SVG clip
through imperative Motion, preserving a consumer's strict `LazyMotion` boundary.
Immutable replacements, corrections, prepends, viewport changes and resizing
interrupt and finish the entrance without replaying historical marks.

`XAxis` and `YAxis` retain native presentation props while the family owns their
numeric domains and scales. Native reversed/padded X scales also govern pointer zoom and pan; gestures start inside the plot, excluding axes and margins. `Grid` and `ReferenceLine` expose native Recharts
props. Compose `ReferenceLine y={value}` for labelled reference/settlement levels;
reference annotations do not automatically expand the price domain.

`CurrentPrice` draws the latest supplied close as a horizontal price line and an axis pill, separately from hover inspection. `orientation` defaults to `"right"`; compose a matching price axis. `lineVisible`, `axisLabelVisible`, `lineProps`, `labelProps`, `labelTextColor`, native group props/ref, and a `(point, formattedPrice) => ReactNode` label renderer remain consumer-owned. The line uses the price pane clip; prices outside a fixed displayed domain produce no false edge label. `rising`, `falling`, `unchanged` and explicit `color` control movement colors.

`Controls` supplies labelled Zoom in, Zoom out and Reset view buttons. `zoomFactor` defaults to `1.5`; `zoomInProps`, `zoomOutProps` and `resetProps` retain native button handlers, refs and children. Preventing default vetoes the built-in change. Reset fits supplied history. `HistoryNavigator` supplies a separate full-history close overview below the chart, with a draggable range and keyboard start/end handles. `height` defaults to `56`; native fieldset props/ref/styles and `brushProps`/`overviewProps` retain presentation. The root owns data, axes, brush range and geometry. Both parts propose the same viewport callbacks as chart gestures.

`Volume` requires `seriesKey`, retains native Bar presentation props, and accepts
`axisProps` for its independent nonnegative Y axis. It uses the same X scale and
crosshair as price. Its default rise/fall/unchanged colors match the candle direction with muted opacity; optional `rising`, `falling`, `unchanged`, native `fill` and `fillOpacity` preserve explicit consumer control. Missing volume produces no observation; zero remains zero. Volume observations
come from the validated root records. Separate `data`, `minPointSize`, alternate
X axes, stacks, and fabricated background bars are excluded from this part's
contract, so volume cannot silently diverge from its candle or gain a false
minimum height. Excluded Bar and axis geometry controls are rejected at runtime, including explicitly undefined keys; styling, shapes, events and axis tick presentation remain supported. Custom volume shapes receive centered time-X geometry and retain native markup within the volume pane and shared entrance clips.

`Overlay` draws caller-computed values from `dataKey`, either an original-row key
or `(originalRow) => number | null | undefined`. It requires `seriesKey`, accepts
native Line presentation props, defaults `dot` and animation to false, and shares
series keyboard activation and focus emphasis, with one keyboard target per logical key. Overlays use the shared entrance clip and reject separate native data or axis IDs. It never computes indicators. Missing values remain gaps. `includeInDomain` defaults to
false; enable it to include overlay prices in the chosen autoscale scope. Every
provided overlay value is validated before viewport filtering; included values
also obey caller bounds. Default X-axis ticks use visible observation coordinates
and skip explicit gaps. Caller-provided ticks and formatters retain control.

`Crosshair` accepts SVG group props and spans both panes. Its default `mode="free"` follows pointer X/Y while `onInspect` independently reports the nearest original candle. `mode="snap"` follows the inspected candle center and close. Keyboard inspection anchors to the candle close in either mode. `showLabels` defaults to true; `labelProps` customizes time/price text. Free elapsed-time labels use the rendered native inverse scale; ordinal labels identify the nearest supplied observation. `Content` renders an
accessible readout, with optional `children(point, selection)`, `className`, and
HTML `frameProps`. `Tooltip` uses the same fields/custom renderer while a point
is inspected or selected, with the shared themed tooltip frame, `role="tooltip"`,
and `maxWidth` (default 260 pixels). A Tooltip alone announces politely; when
Content is composed, Tooltip announcements turn off and Content owns the polite
status announcement. `DataTable` requires a `caption` and retains native table
props/ref. It shows the full series, explicit gaps, missing values, state and
selection. Add `renderMetadata(point)` and optional `metadataLabel` (default
`"Metadata"`) to expose source, interval, currency, adjustment policy, or quality
from `point.original`.

Focus the chart frame to inspect with Left/Right, Home/End; gap glyphs are skipped.
Shift with Left/Right pans, plus/minus zoom, and zero resets/fit. Enter/Space
selects, Escape clears inspection and selection. Pointer hover inspects, tap
selects, and dragging pans; scrolling a focused plot zooms. Identity-based
inspection survives replacements, prepends and resizing. Removing an inspected
identity produces a null readout; the chart frame retains keyboard focus.
For streaming, replace the forming row with its existing time identity in a new array; append a row when a new interval starts. The same typed `data` contract handles corrections and prepends. Applications own feed loading, errors, retries and cancellation; clean up timers and subscriptions on unmount.

Controlled consumers own the displayed window. If data changes while the supplied
viewport stays unchanged, the chart proposes an identity-preserving window through
`onViewportChange` with reason `data`; accepting the callback updates the display.
If the application changes data and the viewport atomically, the explicitly
supplied new viewport is honored without a second anchor adjustment.

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.
