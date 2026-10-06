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
