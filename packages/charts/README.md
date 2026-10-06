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
