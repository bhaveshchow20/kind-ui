# Choose the chart and its owner

| Question/data | Family | Host decision |
| --- | --- | --- |
| Trend over ordered observations | Line | Sort order, missing-value policy |
| OHLC price intervals | Candlestick (Core 0.6.0 or later; source candidate) | Time mode, spacing, price/volume units, bounds and viewport ownership |
| Magnitude over time | Area | Stack only commensurate measures with matching stackId |
| Compare categories or rank | Bar | Orientation, baseline, signed units |
| Mixed marks or different units | Combo | Series and explicit axis IDs/domains |
| Part of a meaningful whole | Pie/Donut | Nonnegative categories, denominator |
| Bounded progress | RadialBar/ActivityRings | Goal, range, over-goal treatment |
| Numeric relationships | Scatter/Bubble | Numeric axes, optional size encoding |
| Distribution | Histogram/BoxPlot | Bins or computed summary statistics |
| Matrix, balances, directed flow | Heatmap, Waterfall, Sankey | Missing cells, explicit balances, valid links |
| Compare multivariate profiles | Radar | Comparable scales; avoid unrelated units |

## Explicit family parts

Import the chart by name. Every family requires `config`, `aria-label` or
`aria-labelledby`, and explicit children. Add the marks, axes, tooltip and legend
you need; metadata does not generate parts. Set dimensions on the chart. Use
`frameProps` for outer HTML attributes/ref and `Content` for contextual HTML
controls or a data alternative.

```tsx
import { LineChart } from "@kind-ui/charts";

<LineChart config={config} data={data} height={280} aria-label="Monthly revenue">
  <LineChart.XAxis dataKey="month" />
  <LineChart.YAxis />
  <LineChart.Series dataKey="revenue" />
  <LineChart.Tooltip />
  <LineChart.Legend />
</LineChart>
```

See the [Line examples](https://kindui.dev/charts/docs/components/line/) and
[Combo examples](https://kindui.dev/charts/docs/components/combo/). Match
`seriesKey` to config for function/numeric `dataKey`. Axis IDs must match their
series. Preserve zero; use null for missing observations. Use
`connectNulls={false}` when gaps carry meaning. Keep business aggregation and
percentage denominators explicit.

## Family data contracts

HeatmapChart uses explicit rows, columns, data and a quantitative scale; pass
`config={{}}` and compose Grid, Legend, Tooltip and optional DataTable parts.
See the [Heatmap examples](https://kindui.dev/charts/docs/components/heatmap/).
SankeyChart requires flow data and node-ID `config`; add Nodes and Links explicitly.
Custom render callbacks receive native geometry. Validate flows with
`prepareSankeyData`, including zero-valued links: intermediate incoming/outgoing
totals must balance. Represent losses or gains as explicit boundary flows.
ActivityRings takes ring values/domains and category config, with explicit Series,
Labels, Tooltip and Legend parts. Retrieve the family example before adapting it.

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
