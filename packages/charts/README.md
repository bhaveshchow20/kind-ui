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

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.

### Projected trailing line data

`LineSeries` accepts `projected={{ isProjected: (row) => row.estimated,
strokeDasharray: "6 3" }}`. The accessor flags caller-supplied values; Kind UI
does not compute forecasts. Only a contiguous flagged suffix in the supplied
data order is projected. Flags before the final historical row are ignored.
Filtering or reordering data recomputes that suffix; keep stable row objects
within an update and replace the data array when values or flags change.

Omitting `projected` retains the existing native rendering. With projection,
one native Line retains series/category identity, dots, custom marker renderers,
axes, labels and tooltip entries. Its default stroke is painted by two native
Curves, using the original interpolation type and `connectNulls` option. Native
spline tangents are recalculated for each partition at the opt-in boundary;
this is not an exact paint mask of the unsplit spline. The projected partition
includes the last historical point as an anchor. With `connectNulls=false`, a
missing boundary point remains a gap; with `true`, the native curve can connect
to the last available historical point. No missing values are synthesized.

Empty data paints nothing. A single point retains its native dot and projected
tooltip status without inventing a segment. An entirely flagged series is
projected. Historical stroke/dash options are retained; projected dash defaults
to `"4 4"`. Both partitions retain stroke, width, opacity, filter, style and
handlers. Explicit SVG styles remain authoritative. Existing line materials
apply independently to each partition. Explicit native `shape` owns all stroke
rendering, so it bypasses automatic projection paint while keeping status.

The default tooltip says “Projected” for projected rows. Custom tooltip content
and data alternatives remain caller-owned. `getProjectedStart(data,
isProjected)` returns the first projected index, or `data.length` when there is
no trailing projection; use the same data and accessor for an accessible table.
Missing flagged rows should retain both “No data” and “Projected” in that table.
The option also works in configured `LineChart.series` objects and composed
`ComboChart` children without adding a second series or legend entry.

```tsx
const isProjected = (row: Row) => row.estimated;
const start = getProjectedStart(data, isProjected);
<LineSeries<Row> dataKey="total" projected={{ isProjected }} />;
// In the caller-owned table: index >= start ? "Projected" : "Historical".
```

The focused public fixture in `tests/fixtures/configured-line/host.tsx`
shows configured lines, gaps, filtering/reordering, a Combo and a status table.
`examples/chart/projected-line.tsx` is a small copyable Combo/table example.
Projection is intended for Kind's default static strokes and chart-owned Motion
clips. Its custom native shape does not implement Recharts' opt-in
`isAnimationActive` stroke-length entrance reveal; use Kind chart animation for
entrance effects. The existing loading state and reduced-motion policy stay
chart-owned.


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

Run `npm run dev:chart` and visit `/point-markers.html` for the marker gallery and
its accessible data table.
