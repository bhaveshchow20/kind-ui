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

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury.

### Loading a chart

`ChartLoading` is a whole-content presentation boundary. Import the default
stylesheet. The host controls `loading`; empty data, requests, cancellation,
retries, partial results and errors remain host-owned. No loading delay is added.

```tsx
<ChartLoading loading={pending} label="Loading monthly sales" style={{ height: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={rows}>
      <XAxis dataKey="month" />
      <YAxis />
      <BarSeries dataKey="sales" seriesKey="sales" />
      <Tooltip />
    </BarChart>
  </ResponsiveContainer>
</ChartLoading>
```

Compose the bar example inside `Root` as usual. A configured `LineChart` can be
wrapped directly. Native div props, styles, handlers and ref belong to the outer
boundary. Give the boundary an explicit height for percentage-height charts;
otherwise its mounted children determine its dimensions. Content is hidden and
inert while loading, with `aria-busy` on its content region. A separate live
`role="status"` announces `label` (default: “Loading chart”); it clears on
completion. Supply chart-specific text and an accessible data alternative.

Loading shows a neutral three-dot pulse; completion immediately makes content
available with a short opacity reveal. Reduced motion disables both animations.
Rapid updates follow the current prop without queued completions. Children,
consumer data, axes, tooltip/legend configuration and engine state are retained;
native entrance animations may finish while hidden and are not replayed. Place
controls or legends outside the boundary to keep them available during loading.
Consumer portals outside the boundary must be hidden by the consumer. The
boundary does not supply chart-family skeletons or animate data/geometry changes.
It can contain DOM chart families, but line and bar are the browser-tested examples.

Run `npm run dev:chart` and open `/loading.html` for load/replay, empty-result and
resize controls. Prefer keeping replay controls outside the boundary so focus
remains available while loading. A loaded empty result should have its own
message; do not set `loading` merely because `rows` is empty.
