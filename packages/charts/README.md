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

`LineChart` (configured and composed) and `BarChart` accept `loading?: boolean`
(default false) alongside `animate`, plus `loadingLabel?: string` (default
“Loading chart”). Import the default stylesheet. The chart owns its loading
presentation; no wrapper component is required.

```tsx
<LineChart
  config={config}
  data={rows}
  xDataKey="month"
  aria-label="Monthly sales"
  height={280}
  animate={false}
  loading={pending}
  loadingLabel="Loading monthly sales"
/>
```

For composed bars, pass `loading={pending}` directly to `BarChart` inside your
usual `Root` and `ResponsiveContainer`. Chart content stays mounted and sized,
but becomes hidden and inert during loading. A separate live status announces
`loadingLabel` outside the busy content region. Consumer axes, series, tooltip,
styles, handlers, refs and data stay with the native chart. External legends and
controls remain available. Empty data does not imply loading: render an explicit
empty-result message when the request completes without rows.

Loading shows a neutral three-dot pulse; completion immediately exposes the
chart with a short opacity reveal. Reduced motion disables both effects. Rapid
updates follow the current prop without queued completions or forced delays.
`animate` still controls native mark animation; native entrances may finish while
hidden and are not replayed by loading. Omitting the prop retains existing chart
markup. Supply a chart-specific label and accessible data alternative. Consumer portals outside the chart remain consumer-owned. Loading
dots use the native container positioning; custom position overrides can relocate
them.

This draft supports line and bar loading, including the bar-backed
`WaterfallChart`, `BoxPlotChart` and `HistogramChart`. Other chart families do not
yet expose this prop; their layout and interaction contracts need separate implementation
and tests. Loading does not fabricate data or morph chart geometry. Request,
cancellation, retries, partial results and errors remain host-owned.

Run `npm run dev:chart` and open `/loading.html` to inspect load/replay/toggle,
empty-result and resize controls, including transition out of loading.

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.
