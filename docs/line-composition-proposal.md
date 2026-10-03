# Line composition API proposal

Status: proposed for coordination, not implemented. The current branch validates the supporting import surface; it does not yet solve the basic-chart composition burden.

## Goal

A common line chart should need one Component import, caller data and series metadata. The package must own its default composition, sizing and legend visibility. Website/demo controls and settings are consumers, never package implementation or proof of package capability. Keep the existing native composition path and use the same underlying LineChart/LineSeries/Tooltip/Legend implementation in both paths.

## Recommended contract

Add a configured mode to the existing `LineChart`, selected explicitly by `config`. Existing `LineChart` calls inside `Root` remain unchanged. This avoids a disconnected convenience implementation and keeps one discoverable chart name.

```tsx
import { LineChart } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [{ month: "Jan", total: 12 }, { month: "Feb", total: 18 }];
const config = { total: { label: "Total", color: "#4055ee" } };

export function MonthlyTotals() {
  return <LineChart data={data} xDataKey="month" config={config} aria-label="Monthly totals" />;
}
```

The configured mode creates Root, responsive layout, category/value axes, horizontal grid, one LineSeries per config key, Tooltip and a togglable Legend. Default plot height: 280 CSS pixels; native style/width/height overrides remain available. Require an accessible chart name (`aria-label` or `aria-labelledby`), retain native keyboard traversal and include package-owned keyboard instructions when appropriate. This does not fabricate a complete accessible data alternative: the caller still owns a table/download/descriptive equivalent suitable for their domain. Empty, zero, missing, negative and out-of-range values retain native behavior and existing tooltip semantics.

Default animation remains off. Existing animation, materials, emphasis and optional number-tooltip behavior must pass through to the existing implementations. No loading API is added until coordination with the isolated loading chart-root work.

Named options configure or disable default parts: `xAxis`, `yAxis`, `grid`, `tooltip`, `legend` as props objects or `false`. A `series` override supplies existing typed LineSeries props for custom accessors, keys, per-series materials, custom marks and handlers. Default generated series use config keys; do not reinterpret EvilCharts color-array/config conventions.

`visibleSeries` selects controlled mode; `defaultVisibleSeries` selects uncontrolled initialization; accepting both is a type/runtime error. Without either, all configured series start visible. Uncontrolled legend toggles remain inside the library; `onVisibleSeriesChange` may observe them. In controlled mode, changes request caller updates, and missing handlers make the legend read-only. Define reconciliation for updated config keys and honor all-hidden and empty config states deliberately.

```tsx
import * as Chart from "@kind-ui/charts";

<Chart.LineChart
  config={config}
  data={data}
  aria-label="Monthly totals with a target"
  visibleSeries={visible}
  onVisibleSeriesChange={setVisible}
  legend={{ hideIcon: true }}
>
  <Chart.XAxis dataKey="month" tickFormatter={formatMonth} />
  <Chart.YAxis domain={[0, 100]} />
  <Chart.ReferenceLine y={target} />
  <Chart.LineSeries dataKey="total" material="paper" shape={CustomCurve} />
  <Chart.Tooltip valueAnimation="shuffle" />
</Chart.LineChart>
```

Explicit `children` replace the entire generated in-chart composition, including axes/grid/series/Tooltip; they are not merged or inspected by displayName. In configured mode Root and the separately configured Legend remain managed. Part-option props for generated children should be rejected when explicit children are supplied, preventing silently ignored settings. `legend={false}` disables the outer Legend. Explicit children need no `xDataKey`. Existing Root + LineChart compositions retain their original semantics and do not acquire new defaults. Configured `LineChart` nested inside an existing Root should throw an actionable error or require an explicit ownership rule; avoid accidental double visibility/context scopes.

This is an additive opt-in mode, but its type overloads must be checked against existing `ComponentProps`, generic accessors, refs and consumer contracts. Keep native special children intact: default axes/grids are actual native components. Flat axis styling and a horizontal dashed grid are deliberate configured-mode defaults, with explicit native overrides; they must not alter the legacy composition path.

## Implementation boundary

Refactor the public entry into a small composition layer over the existing animation/chart implementation. Keep shared geometry, interaction, visibility, tooltip positioning, materials and animation in existing modules. Do not introduce another renderer, universal chart schema, docs imports, Tailwind dependency, UI kit or icon dependency. Public named native reexports provide the advanced part surface.

An additive `LinePlot` convenience name was considered. It can reuse existing internals, but a configured mode on `LineChart` better keeps simple and explicit compositions discoverable as one layered API. Automatic defaults triggered only by omitted children without an explicit `config` discriminator were rejected: that would change existing empty/controlled chart behavior.

Recharts' installed theme facility is experimental and only exposes grid styling, so it is insufficient for axis/sizing/visibility defaults. Implement the selected contract with explicit native props and scoped package CSS; do not promise a broader engine theme adapter.

## Required Line proof before family rollout

- One-import standalone configured chart with installed tarball; no controls/settings/website CSS/helpers.
- Same chart with explicit native children; retained refs, handlers, native geometry and generic prop accessors.
- Native overrides for axes/grid/sizing; per-series materials, shapes, animation, emphasis and tooltip formatting.
- Controlled and uncontrolled legend keyboard/pointer behavior; all-hidden, empty config, config updates and data updates.
- Zero/missing/negative values; accessible name/instructions and truthful data-alternative responsibility.
- Strict NodeNext/Bundler and actual Next client/server boundary builds; callbacks only inside a client host.
- Production bundle/tree-shaking; no engine copies or new dependencies; shared implementation regression checks.
- Coordinate loading root adapter before introducing lifecycle defaults; leave docs deployment paused until the package proof is complete.

Apply the validated ownership/default-parts pattern to other families only after the Line vertical slice passes. Pie category config, Scatter series identity, polar axis conventions and Sankey tooltip/context need their own bounded decisions. Tailwind CSS v4 and Lucide are first-class requirements for the published library, implemented as the next bounded step after the core API decision. Keep standard className/style/CSS variable/token and React icon component contracts; do not add a utility DSL or icon registry. The basic chart must function without Tailwind compilation. Validate a consumer compiling Tailwind v4 utilities against package classes/tokens, overrides and production content scanning; inspect cascade/layer precedence and document the actual compiler/peer requirements. Validate named Lucide React imports passed through existing icon component props, accessible decorative semantics, sizing/color overrides and production tree-shaking so unused icons never enter the bundle. Do not claim support from dependency names alone. Determine whether those integrations need peers, optional peers or consumer-only dependencies from those proofs; preserve the current plain-CSS functional path and keep the website a separate consumer.
