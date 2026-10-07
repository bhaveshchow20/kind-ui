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

### Loading chart data

All chart families accept `loading?: boolean` alongside `animate`, plus
`loadingLabel?: string` (default “Loading chart”). Import the default stylesheet.

```tsx
<LineChart
  config={config}
  data={rows}
  xDataKey="month"
  height={280}
  aria-label="Monthly sales"
  animate={{ revealDurationMs: 650 }}
  loading={pending}
  loadingLabel="Loading monthly sales"
/>
```

Pass the same props directly to composed chart roots inside the existing `Root`
and native sizing/composition. Supported families: Line, Area, Bar, Combo, Pie,
Radar, RadialBar, Scatter, Heatmap, Waterfall, Histogram, BoxPlot, ActivityRings
and Sankey. Each uses its own decorative chart silhouette independent of your data.
Pulse-based skeletons choose a clearly different bounded profile while fully hidden;
their geometry stays stable through renders and resize between pulses. A soft leading reveal and
trailing fade overlap, following the chart’s native entrance duration, easing and
direction: horizontal paths and left-to-right bar-family windows, angular sectors,
ordered point/cell opacity or directional flow. Radar keeps two six-vertex polygons
visible and smoothly morphs between bounded decorative shapes; reduced motion
holds both still. RadialBar keeps continuous angular velocity through its closing seam. Combo preserves separate family
reveal options. Pulse timing includes room for the trail to leave and a hidden
geometry swap; loading never delays actual completion.
Reduced motion displays a static silhouette.

Actual chart content remains mounted, sized, hidden and inert while pending.
The chart exposes `aria-busy` and a separate live status. Native axes, series,
refs, style and event ownership stay with the consumer. External legends remain
available. Heatmap uses its table viewport; Sankey uses its native flow container;
polar illustrations retain circular proportions. Skeletons have no values,
labels or tooltip targets.

Completion immediately restores actual data and rearms the family’s existing
entrance when `animate` enables it. There is no forced wait or queued completion.
Empty data does not imply loading: render an explicit empty-result message after
completion. Loading does not change validation of supplied chart data. Requests,
cancellation, retries, partial results, errors and portals outside the native
chart remain host-owned. Supply an accessible data alternative alongside charts.

Run `npm run dev:chart` and open `/loading.html` for all-family replay, load,
empty-input, resize and interrupted-update controls.


## Selective Pie glow

`PieSeries` accepts `glowCategories?: readonly string[]` with `categoryKey` and
explicit data. For a rounded donut, add `glowCategories={["design"]}` to
`<PieSeries data={data} dataKey="hours" categoryKey="key" nameKey="key"
innerRadius={58} outerRadius={108} cornerRadius={8} paddingAngle={2} />`.
The IDs resolve through the existing category config contract. Unknown or removed
IDs do nothing; reorder/filter preserve colors and membership. Selected default
sectors use glow; others retain `material` (default plain). Native custom paint,
shapes and handlers retain ownership. Keep labels and a data alternative.

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.


### Point marker styles

`LineSeries` and `AreaSeries` accept independent `pointStyle` and
`activePointStyle` values: `"default"`, `"border"`, or `"colored-border"`.
Omitted/default values keep the existing appearance (including Area's normally
hidden regular dots). Opting into a regular style enables regular dots. Border
uses a series-colored center with a surface-colored ring; colored-border uses a
surface-colored center with a series-colored ring. The surface is
`--kind-ui-chart-marker-surface`, falling back to `--card` then white; set it on
Root for your theme. Series paint follows the existing config/theme identity or
explicit series stroke. Styles introduce no SVG resources or additional motion.

```tsx
<LineSeries dataKey="total" pointStyle="border" activePointStyle="colored-border" />
<AreaSeries dataKey="total" pointStyle="colored-border" activePointStyle="border" />
```

Any explicit native `dot` or `activeDot` value (including false, true, props,
renderer functions and elements) wins for its respective marker. Configured
LineChart accepts these options in its existing `series` objects; explicit
children retain ownership. `PointMarker` is a reusable native Dot renderer with
`variant` and native Dot props. Its variant paint wins the engine-supplied paint;
native radius/handlers remain intact, and SVG `style` can override its paint.
For example, `dot={<PointMarker variant="colored-border" style={{ fill: "white" }} />}`.
Native active-dot callbacks carry series paint in `fill`, while regular dots carry
it in `stroke`. When composing PointMarker as an active renderer, forward that
identity explicitly: `activeDot={(props) => <PointMarker {...props}
stroke={props.fill} variant="colored-border" />}`. The Series style API handles
this distinction automatically. Keyboard/pointer inspection remains chart-owned; the active mark retains its
existing non-intercepting behavior and reduced-motion policy. Radar's selection
dots and Scatter's symbols have separate contracts and do not accept these
series options. Bar, Pie and other shape families are outside this API.

Run `npm run dev:chart` and visit `/recipes.html#point-markers` for the marker gallery and
its accessible data table.

### Directional Line and Area entrances

`LineAnimation` and `AreaAnimation` accept `revealDirection`:

- `"left-to-right"` (default): expand from the left edge.
- `"right-to-left"`: expand from the right edge.
- `"center-out"`: expand equally from the horizontal center.
- `"edges-in"`: expand two edge regions toward the horizontal center.

Directions are physical horizontal screen-space reveals for both native layouts;
they do not reverse data order or follow a vertical category axis. Timing remains
`revealDurationMs` / `revealEasing`. The temporary family clip leaves native paths,
axes, margins and transforms intact. Explicit directional entrances remove the clip
on completion or interruption (including resize/data changes). Line with an omitted
direction preserves its existing completed full-width clip until interruption;
Area/Combo retain their existing completion removal. Disabled/reduced motion shows
complete content.
Existing loading illustrations keep their independent design. Replay uses the
existing remount or loading-to-ready lifecycle, not hover or color updates.

```tsx
import {
  AreaChart, AreaSeries, ComboChart, LineChart, LineSeries, Root,
  type SeriesConfig,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { day: "Mon", total: 12, forecast: 16 },
  { day: "Tue", total: 20, forecast: 24 },
];
const config = {
  total: { label: "Total", color: "#3659b8" },
  forecast: { label: "Forecast", color: "#0d9488" },
} satisfies SeriesConfig;

export function DirectionalCharts() {
  return (
    <Root config={config}>
      <LineChart data={data} width={480} height={240} aria-label="Daily total"
        animate={{ revealDirection: "right-to-left", revealDurationMs: 800 }}>
        <LineSeries dataKey="total" pointStyle="border" />
      </LineChart>
      <AreaChart data={data} width={480} height={240} aria-label="Daily forecast"
        animate={{ revealDirection: "center-out" }}>
        <AreaSeries dataKey="forecast" />
      </AreaChart>
      <ComboChart data={data} width={480} height={240} aria-label="Total and forecast"
        animate={{
          revealDirection: "center-out",
          lineReveal: { revealDirection: "right-to-left" },
          areaReveal: { revealDirection: "edges-in", revealDurationMs: 1200 },
          barReveal: false,
        }}>
        <LineSeries dataKey="total" />
        <AreaSeries dataKey="forecast" />
      </ComboChart>
    </Root>
  );
}
```

Combo inherits the chart direction for Line/Area unless the corresponding family
object overrides it; `false` disables that family entrance. Bar keeps its existing
entrance configuration. All managed series in a family share its entrance clip;
individual series rendering/visibility props remain available, but there is no
per-series direction prop. Explicit native children and consumer clip/shape
ownership retain their existing contracts. `RevealDirection` is exported for
consumer controls. The packed Line/Area motion fixtures accept `?direction=...`
and the Combo fixture accepts `?directional` to exercise the family overrides.

### Animated dashed lines

`LineSeries` accepts `dashAnimation={ { durationMs: 1000, direction: "forward" } }`
(or `false`, the default). Supply a native numeric `strokeDasharray`, such as
`"6 4"`; duration is milliseconds per full pattern cycle. `reverse` reverses
travel. Zero, negative or non-finite duration and nonnumeric/CSS/percentage dash
patterns stay static. Odd lists repeat twice per cycle, matching SVG.

```tsx
<LineChart data={rows} animate>
  <LineSeries dataKey="total" strokeDasharray="6 4" strokeDashoffset={3}
    dashAnimation={{ durationMs: 800 }} material="glow" />
</LineChart>
<ComboChart data={rows} animate>
  <AreaSeries dataKey="total" stroke="none" fillOpacity={0.2} />
  <LineSeries dataKey="total" dot={false} strokeDasharray="3 2 1"
    dashAnimation={{ durationMs: 1200, direction: "reverse" }} />
</ComboChart>
```

Load the package stylesheet. Motion stops with chart `animate={false}`, reduced
motion, loading, or hidden series. Disabling restores the native dash offset;
reenabling starts a fresh cycle. Use `dashAnimation={false}` to disable an individual series. Native width, dash array, offset and
styles remain intact; style dash values take precedence. Custom shapes own their
animation and are never decorated. Entrance clip reveal timing is independent.
No geometry or data is changed, and CSS requires no mount timers or cleanup.
Stylesheets overriding dash paint remain consumer-owned and can change appearance.

`AreaSeries` does not accept this option: its closed perimeter includes baseline
and closing edges. For an open animated outline, overlay `LineSeries` in a
`ComboChart` as above. Match data keys, interpolation and axes yourself; stacked
or range areas require an explicitly derived outline dataset. See
`/contracts.html#dashed-lines` for the interactive line and combo contract examples.

### Initial Pie tooltip

`PieChart.defaultPinnedCategory="delivery"` opts into an initial tooltip for
one direct `PieSeries` (Fragments allowed) with explicit `data` and `categoryKey`.
Pair it with `Tooltip.itemKey={(entry) => entry.payload.id}` when `categoryKey="id"`;
caller labels, formatters, and the data table remain the source of truth.
Only Pie/donut compositions whose direct children are one Kind PieSeries and
one Kind Tooltip (optionally in Fragments) support this default. Native Pie, wrapped series, multiple rings, and other chart families
are outside this contract; missing category data/identity or multiple direct
series, duplicate/missing Tooltips, or unsupported direct children throw when resolving a pin.

The category string is captured on mount. Reorder resolves its current index;
unknown, duplicate, removed, hidden, or filtered categories clear the default
permanently. Restoring rows or changing the default prop does not re-pin; remount
explicitly to begin again. Pointer movement/down, focus, and any chart key press
clear the default and hand inspection/dismissal back to Recharts. Escape never
re-pins. No focus is moved or trapped. The existing tooltip is the sole readout
and live announcement; Kind adds no announcement region or hover selection.
Explicit Tooltip `active` and `defaultIndex` retain native ownership and take
precedence. Custom content owns its markup and accessibility. Omitted defaults
preserve existing behavior. See the weekly Pie in `examples/chart/pie-recipes.tsx`.

### Sankey node labels

Compose `SankeyNodeLabel` beside `SankeyNode` in the native `node` callback:

```tsx
node={(node) => (
  <g>
    <SankeyNode {...node} />
    <SankeyNodeLabel node={node} data={data} position="outside" showValues
      valueFormatter={(value) => `${value} MWh`} />
  </g>
)}
```

Optional `SankeyNodeConfig` entries accept an `icon: ReactNode`. Pass that config
explicitly as `SankeyNodeLabel`'s `nodeConfig` in your native callback (see the
energy example in `examples/chart/sankeys.tsx`). Icons use a square `iconSize`
(default 16 chart units) SVG viewport with `viewBox="0 0 24 24"`; supply SVG
content, or a nested SVG with its own viewBox. `iconGap` defaults to 4 units.
Outside icons sit nearest the node and shift the text by size plus gap on either
side. Inside icons stack above centered text and share its exact rectangle clip;
small nodes can clip both. Reserve outside margins for the combined content.
Missing, null, boolean or zero-size icons preserve the existing text layout.
Sizes and gaps must be finite and nonnegative. Icons are decorative (`aria-hidden`,
nonfocusable); data names and full name/value titles remain meaningful, and the
data table remains the accessible alternative. Config labels remain Legend metadata.
Custom text children compose with the icon; text props/ref still target the text.
A custom native node renderer owns all rendering: nothing is injected unless it
chooses this helper, and omitting `nodeConfig` opts out of configured icons.

Identity is resolved by `node.payload.id` against `data`, never callback index or
name. Supply the same data to the chart, label and `SankeyTable`, and reuse the
formatter as the table's `formatValue`. A node value is the maximum of incoming
and outgoing flow sums: sources use outgoing, sinks incoming, balanced intermediate
nodes count throughput once, and disconnected or measured-zero nodes total zero.
Existing data validation rejects unbalanced intermediate nodes outside its rounding
tolerance; the larger sum handles that tolerance consistently with native sizing.
No extra totals or inferred flows are added to the table.

`position="inside"` centers text and clips it to the exact node rectangle, including
small or zero-size nodes. It does not shrink text, expand geometry or avoid collisions.
Use outside labels for narrow nodes; they default right for sources/intermediates and
left for sinks. `side`, `offset`, native text props, styles and refs remain consumer-owned.
Reserve margins for outside text; the native SVG viewport still clips overflow.
The full name/value remains in a SVG title even when inside text clips. Keep the table
as the complete accessible data alternative. Custom `children` (including `tspan`)
replace visual text while preserving the default title. No label or animation is
installed implicitly. `/sankeys.html` demonstrates both positions.
