---
name: kind-ui-charts
description: Build and adapt React charts using @kind-ui/charts public APIs, or compose editable Kind UI registry designs in an application.
---

# Kind UI charts

## Install and retrieve the contract

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at the application entry. React and
React DOM, Recharts and Motion are required peers installed automatically by npm.
Inspect the installed package manifest for supported ranges. Motion remains required with `animate={false}`.
For Next applications put interactive chart components behind `"use client"`.

Read the selected family in the [public package reference](https://github.com/bhaveshchow20/kind-ui/blob/main/packages/charts/README.md).
The docs application's `llms.txt` indexes canonical Markdown; `llms-full.txt`
contains the same pages with complete consumer code and API tables. Retrieve only
the family and examples relevant to the task. Use public package imports, never
repository source paths or an invented `Chart` object export.

## Choose a chart

- Line: trends over ordered observations. Preserve missing values with `connectNulls={false}` when gaps matter.
- Area: magnitude over time; matching `stackId` values stack series.
- Bar: category comparison, signed values or horizontal ranking.
- Combo: mixed bar/line/area series with explicit axes and units.
- Pie or radial: part-to-whole or bounded progress; `ActivityRings` supplies a complete ring composition.
- Scatter: relationships between numeric measures. Histogram: distribution from explicit bins or `binHistogram`.
- Heatmap: matrix intensity with native table semantics. Box plot: caller-computed statistics. Waterfall: explicit numeric balances. Sankey: directed flows.

Choose the family from the question and data, then check its actual prop types.
Do not infer aggregation, domains, units or missing-value policy silently.

## Compose through public exports

Configured `LineChart` accepts `data`, `config`, `xDataKey` and an accessible name;
it owns Root, responsive sizing and default parts. Do not wrap it in another Root.
For explicit composition, use `Root` with `SeriesConfig`, a sized
`ResponsiveContainer`, the family chart/series, and public axes/grid/Tooltip.
Area and Bar use explicit composition; do not give them Line's configured props.
`ActivityRings` also owns Root. Keep stable series/category keys as data changes.

```tsx
import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const config = { tasks: { label: "Tasks", color: "#3659b8" } } satisfies SeriesConfig;

<LineChart
  data={[{ day: "Mon", tasks: 0 }, { day: "Tue", tasks: 12 }]}
  config={config}
  xDataKey="day"
  aria-label="Tasks by day"
/>;
```

The application owns data, chart names, complete accessible data alternatives,
domains, labels and business state. Use `visibleSeries` with
`onVisibleSeriesChange` when controlling visibility. Preserve keyboard access,
missing/zero values, sizing, tooltip behavior and reduced motion when adapting a
recipe; verify the chosen family rather than assuming all families share props.

## npm and registry ownership

The npm package owns complete usable, design-neutral charts, interaction,
visibility, motion and accessibility behavior. Registry files provide editable
art direction and cards using those exports. Do not copy
package internals into a registry item or recreate reusable chart behavior.
App-specific filters may remain in the copied application composition.

For registry designs merge this namespace into the application's existing
`components.json`:

```json
{
  "registries": {
    "@kindui": "https://raw.githubusercontent.com/bhaveshchow20/kind-ui/main/apps/docs/public/r/{name}.json"
  }
}
```

Use the official shadcn MCP server to inspect items and dependencies before
installation, or `npx shadcn@latest add @kindui/line-chart`. The registry includes
`line-chart`, `bar-chart` and `area-chart`. Preserve the host's
aliases and styling setup; use `--diff` to review changes and `--overwrite` only
when replacing the selected local files is intended.

## Verify the consumer

Typecheck and build the application. Inspect narrow layout, keyboard focus,
legend toggles, zero/missing values and reduced-motion behavior. Keep a complete
data alternative for the displayed observations. Report the commands and observed
failures without claiming untested framework or assistive-technology support.
