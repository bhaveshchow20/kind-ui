# Choose the chart and its owner

| Question/data | Family | Host decision |
| --- | --- | --- |
| Trend over ordered observations | Line | Sort order, missing-value policy |
| Magnitude over time | Area | Stack only commensurate measures with matching stackId |
| Compare categories or rank | Bar | Orientation, baseline, signed units |
| Mixed marks or different units | Combo | Series and explicit axis IDs/domains |
| Part of a meaningful whole | Pie/Donut | Nonnegative categories, denominator |
| Bounded progress | RadialBar/ActivityRings | Goal, range, over-goal treatment |
| Numeric relationships | Scatter/Bubble | Numeric axes, optional size encoding |
| Distribution | Histogram/BoxPlot | Bins or computed summary statistics |
| Matrix, balances, directed flow | Heatmap, Waterfall, Sankey | Missing cells, explicit balances, valid links |
| Compare multivariate profiles | Radar | Comparable scales; avoid unrelated units |

## Configured Line

`LineChart` with `config`, `data`, `xDataKey`, and `aria-label` (or
`aria-labelledby`) owns Root and default parts. Use it for ordinary line trends;
set `height`, axis options, `series`, tooltip, or legend options as needed.
Do not wrap configured Line in Root or another ResponsiveContainer.
See the complete [Line example](../examples/configured-line.tsx).

**Bad:** `<Root config={config}><LineChart config={config} ... /></Root>`.
**Good:** one configured `<LineChart config={config} ... />`.

## Explicit composition

Use one `Root config={config}`, a sized `ResponsiveContainer`, the family chart,
axes/grid/Tooltip and series; keep `Legend` inside Root outside the native chart.
Area/Bar/Combo do not take configured Line's `config`/`xDataKey` shortcut.
Composed Line (without `config`) follows the same explicit ownership pattern.
Configured Line also accepts explicit children, but then omit generated-part
props such as `xDataKey` and `series`; the modes are mutually exclusive.

See [Combo](../examples/controlled-combo.tsx) for revenue bars and conversion
lines on distinct axes. Root config supplies metadata, not geometry or a universal
schema. Match `seriesKey` to config; use explicit identity for function/numeric
`dataKey`. Axis IDs must match their series. Preserve zero; represent a missing
observation as null rather than fabricating zero. On lines, explicitly use
`connectNulls={false}` when gaps carry meaning. Do not infer business aggregation
or percent denominators from labels.

## Family-specific ownership

HeatmapChart supplies its own context for HeatmapGrid/Tooltip/Legend/DataTable;
use its explicit rows, columns, data, and scale instead of Root's series config.
See the [team matrix example](../examples/team-heatmap.tsx).
SankeyChart owns flow layout and nodeConfig; custom SankeyNode/SankeyLink renderers
receive native geometry. ActivityRings owns its Root. These families are not
Cartesian series dropped into Combo. Retrieve each family's example before use.

## Preserve custom projected bars

BarSeries `projection.isProjected` receives the raw row. TooltipContent
`isProjected` receives a native tooltip entry whose raw row is `entry.payload`.
Do not rewrite data to attach fake projected values or infer a forecast. Explicit
fill/Cell/custom shapes retain paint ownership and may disable automatic patterns;
if the consumer wants both custom paint and a projection cue, compose an explicit
label/tooltip cue or consumer-owned paint rather than deleting the custom fill.

```tsx
// Given type Row = { forecast: boolean; revenue: number }:
const projection = {
  isProjected: (row: Row) => row.forecast,
  pattern: { kind: "hatch" as const },
};
// TooltipContent: isProjected={(entry) => entry.payload?.forecast === true}
```
