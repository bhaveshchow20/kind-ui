---
name: kind-ui-charts
description: Build and adapt React charts using @kind-ui/charts public APIs and complete documented consumer examples.
---

# Kind UI charts

## Install and retrieve the contract

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at the application entry. npm resolves
the package's required peers; inspect the installed package manifest for supported ranges. Motion remains required with `animate={false}`.
For Next applications put interactive chart components behind `"use client"`.

Read the relevant family and shared parts in the [documentation](https://kindui.dev/charts/docs/).
Use [llms.txt](https://kindui.dev/charts/docs/llms.txt) to find canonical Markdown;
[llms-full.txt](https://kindui.dev/charts/docs/llms-full.txt) contains the same
pages with complete consumer code and API tables. Start with
[installation](https://kindui.dev/charts/docs/markdown/installation.md),
then retrieve the relevant family and the shared
[SeriesConfig](https://kindui.dev/charts/docs/markdown/chart-components/series-config.md)
contract when defining metadata. For loading, theme colors, patterns, projected
bars, percentage stacks, point/dash/directional presentation, Pie defaults/glow,
Sankey labels/icons and Root interactions, retrieve the
[customization guide](https://kindui.dev/charts/docs/markdown/guides/customization.md)
and its [complete checked options source](https://kindui.dev/charts/docs/examples/combo-motion/src/examples/combo-motion/options.tsx).
Read the generated API tables, defaults and ownership limits before choosing an
option; a Bar projection predicate receives a raw row, while the tooltip predicate
receives a native entry with the row in `entry.payload`.

Use your agent's existing browser or documentation-fetch tools. An existing MCP
web/docs tool can retrieve the same HTTP resources; these URLs are documentation,
not MCP server configuration. Use public package imports rather than repository
implementation paths or an invented `Chart` object export.

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

## Material finishes

Use Default, Clay or Glow. Default keeps native paint and the public `plain`
token; omit `material` or use `material="plain"`. Decorative finishes use
`material="clay"` or `material="glow"`. Sankey uses these tokens through `finish`.
Paper was removed in 0.3.0; migrate it to a supported finish and preserve native
geometry, custom paint, filters and shapes.

## Verify the consumer

Typecheck and build the application. Inspect narrow layout, keyboard focus,
legend toggles, zero/missing values and reduced-motion behavior. Keep a complete
data alternative for the displayed observations. Report the commands and observed
failures without claiming untested framework or assistive-technology support.
