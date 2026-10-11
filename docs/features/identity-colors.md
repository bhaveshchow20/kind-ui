# Identity-based chart colors

Chart `config` remains the explicit source of series metadata and colors. Existing
Line, Area, Bar, Radar and Scatter series use a string data key or `seriesKey` to
resolve that metadata; native paint overrides remain available. No palette is assigned by array position.

For Pie/Donut, opt into category defaults on a series with explicit data:

```tsx
import { PieChart } from "@kind-ui/charts";

const config = {
  search: { label: "Search", color: "#cc2244" },
  social: { label: "Social", color: "#2255cc" },
};
const rows = [{ id: "search", value: 35 }, { id: "social", value: 65 }];

<PieChart config={config} width={320} height={240} aria-label="Visitor sources">
    <PieChart.Series data={rows} dataKey="value" categoryKey="id" innerRadius={45} />
  <PieChart.Legend />
</PieChart>;
```

`categoryKey` accepts an own top-level field or a typed `(row) => string`
accessor. Every row must resolve to a string key in Chart `config`; unresolved IDs
throw. Fields do not interpret dotted paths; use an accessor for nested data.
Repeated IDs share their configured color. Native `nameKey` stays independent.
This mode requires explicit PieSeries data; omitted `categoryKey` retains native
chart-data and Cell-data composition.

For Radial categories, the native engine reads chart-level rows, so the
option lives on the chart:

```tsx
import { RadialBarChart } from "@kind-ui/charts";

<RadialBarChart config={config} aria-label="Category progress" data={rows} categoryKey="id" width={320} height={240}
    innerRadius={30} outerRadius={100} startAngle={90} endAngle={-270}>
    <RadialBarChart.AngleAxis type="number" domain={[0, 100]} tick={false} />
    <RadialBarChart.RadiusAxis type="category" dataKey="id" tick={false} />
    <RadialBarChart.Series dataKey="value" />
  <RadialBarChart.Legend />
</RadialBarChart>;
```

The optional mode adds only default native Cell paint. Original data and payloads,
values, axes, angles and ordering stay consumer-owned. Config colors follow IDs
through reorder, filtering and config updates. Legend order follows config order;
it does not infer mounted marks. Category interaction maps `visibleSeries` to category IDs. Keep full input data
for visibility changes so native geometry remains stable.

Explicit series `fill` disables category defaults. Datum `fill` and native Cell
paint take precedence, including mixed explicit and default Cells. Existing
Cells retain other native props and handlers; supply index-aligned Cells for
filtered/reordered data as in native Recharts. Custom shapes, labels and CSS keep
native ownership. Explicit paint can intentionally differ from legend metadata;
update config too when the legend should represent an override. Custom Legend
children remain authoritative.

Sankey IDs can contain punctuation and spaces, so use its distinct metadata map:

```tsx
import { SankeyChart } from "@kind-ui/charts";

const nodeConfig = {
  "input / a": { label: "Input", color: "#cc2244" },
  "output:b": { label: "Output", color: "#2255cc" },
};
<SankeyChart data={flows} config={nodeConfig} width={320} height={240} aria-label="Input flows">
  <SankeyChart.Nodes />
  <SankeyChart.Links />
  <SankeyChart.Legend />
</SankeyChart>;
```

`SankeyNodeConfig` requires a label and color for every input node, including
zero-only nodes. Config order determines `SankeyLegend` order; extra metadata
entries remain visible. Default Kind nodes resolve by `payload.id`; solid links
use the source node color. Composed `SankeyLink material="gradient"` uses source
and target colors for its gradient endpoints. The explicit Links part uses solid links by default.
Supplied Nodes/Links render callbacks retain ownership. Kind marks inside those
renderers also receive the defaults unless explicit `color`/`targetColor` replaces
them. Arbitrary custom SVG renderers receive no injected color. `SankeyChart.Legend` inherits config and node focus, and its custom children own
content. It neither filters nodes nor creates flow toggles.

The public-only `tests/fixtures/identity-colors` example is installed, typechecked
in strict NodeNext/Bundler modes and built from an actual tarball. Its focused
Chromium checks exercise mark/legend paint, reorder, updates, filtering, native
Cells and custom owners. This is a paint/identity contract, not a contrast,
accessibility, performance or screenshot quality claim.
