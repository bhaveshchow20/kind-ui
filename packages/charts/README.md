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
  animate={{ reveal: { duration: 650 } }}
  loading={pending}
  loadingLabel="Loading monthly sales"
/>
```

Pass the same props directly to composed chart roots inside the existing `Root`
and native sizing/composition. Supported families: Line, Area, Bar, Combo, Pie,
Radar, RadialBar, Scatter, Heatmap, Waterfall, Histogram, BoxPlot, ActivityRings
and Sankey. Each uses its own decorative chart silhouette. A new loading cycle
chooses a bounded design variation independent of your data; each pulse fades away before selecting its next variation, staying stable through
renders and resize between pulses. The 1.7-second motion follows each family: horizontal
reveal, mark growth, angular fill, radial expansion, cell wave or path flow.
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
