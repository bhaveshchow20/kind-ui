# Kind UI charts

Three React components share series labels, colors, formatting, and optional controlled visibility. Keep your own chart, marks, axes, data shape, and tooltip orchestration.

Pre-release and unpublished. The examples below use this workspace's built `@kind-ui/charts` package, not an npm installation claim. Tested with React/React DOM 19.3.0, Recharts 3.10.1, and TypeScript 5.9.3. The package declares compatible peers; the workspace pins the tested versions.

```tsx
import { useState } from "react";
import * as Chart from "@kind-ui/charts";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import "@kind-ui/charts/styles.css";

const config = {
  tasks: { label: "Tasks", color: "#3659b8", formatValue: (value) => `${value} tasks` },
} satisfies Chart.SeriesConfig;

export function TasksChart() {
  const [visible, setVisible] = useState<string[]>(["tasks"]);
  return (
    <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
      <Chart.Legend aria-label="Visible series" />
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={[{ day: "Mon", tasks: 0 }, { day: "Tue", tasks: null }]} accessibilityLayer aria-label="Tasks by day">
          <XAxis dataKey="day" />
          <Line dataKey="tasks" stroke="var(--color-tasks)" hide={!visible.includes("tasks")} connectNulls={false} />
          <Tooltip filterNull={false} content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} />} />
        </LineChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
```

`Chart` above is a normal ES module namespace import. Direct named imports also work: `import { Root, Legend, TooltipContent } from "@kind-ui/charts"`. The module exports `SeriesConfig`, `RootProps`, `LegendProps`, and `TooltipContentProps` types; there is no additional `Chart` object export.

## Contracts

- `SeriesConfig`: a record keyed by a string `dataKey`. Each entry has a string `label`, CSS `color`, and optional `formatValue(value)` returning React content. Keys start with a letter and contain letters, numbers, underscores, or hyphens. No data normalization or scales are introduced.
- `Root`: scopes config and `--color-{key}` CSS variables. It forwards native div props/ref. The default stylesheet provides full width with `min-width: 0`. Set chart height explicitly through the underlying chart or `ResponsiveContainer`. Nested or adjacent containers keep separate metadata and colors.
- `visibleSeries` is optional and consumer-owned. A callback requires this value; the legend requests the next array but never changes it itself. Keep each mark's `hide` prop in sync. Omit the callback for a static legend. An empty array means all series are hidden; the example owns that empty-state message.
- `Legend`: renders a native list; with a callback, it renders native toggle buttons with `aria-pressed`. It forwards ul props/ref. Space/Enter work through normal button behavior; focus stays on the button. Style its root with `className`/`style`, or set `--chart-legend-background` on buttons. You can also build your own legend from the same config.
- `TooltipContent`: pass the upstream callback's props as `tooltip`. Native div props/ref, classes, and style remain separate and are forwarded. Upstream `formatter`, per-entry formatter, and `labelFormatter` work; per-entry formatters take precedence over the upstream formatter, which takes precedence over the config formatter. An upstream formatter returning null/undefined suppresses that entry. Formatters run for zero but not null/undefined; those display `missingValue` (default “No data”) alongside other available values. Inactive, empty, or entirely missing visible payloads render no tooltip; zero remains valid data.
- Tooltip entries marked hidden or `type: "none"` are excluded, as are consumer-hidden series. Use `filterNull={false}` on the upstream Tooltip when missing values should appear. Unknown keys fall back to upstream names/colors/values. No tooltip payload is mutated.
- Keyboard positioning, Escape/blur dismissal, focus and live-region orchestration remain with the upstream chart/Tooltip. Content supplies its default `role="status"` and live-region attributes when the upstream accessibility layer is enabled. Preserve equivalent feedback when overriding these attributes.

Provide a named chart, keyboard instructions and a semantic data alternative appropriate to your application. The data alternative stays application-owned and should preserve hidden series in its table. Browser tests are evidence for this example, not a screen-reader compatibility or WCAG claim. No cross-framework or SSR/hydration support claim is made yet.

Consumer checks use `strict: true` with `skipLibCheck: false` in NodeNext and Bundler modes. Adding `exactOptionalPropertyTypes: true` with full dependency checking currently fails in upstream declarations, even without importing Kind UI; that stricter combination is not claimed yet.

The usage example has black monochrome and color palettes, a compact Tailwind CSS 4 layout, and a self-hosted Latin Geist font. Its series use solid/circle and dashed/diamond marks, so color is not the only distinction. Switching palettes preserves chart state. The font's OFL license is included with the example. Component defaults use host `border`, `radius`, `popover` and `popover-foreground` variables when present, with native CSS fallbacks. Tailwind and the font are example tooling, not runtime dependencies or required styling choices for package consumers.

## Styling

Import `@kind-ui/charts/styles.css` once for the default appearance. The JavaScript entry does not import CSS, so Node consumers can still import the components directly. The stylesheet contains only scoped component rules in the `kind-ui` cascade layer; it adds no page reset, theme or font. Omitting it leaves presentation to the host. All component defaults ship in this one CSS asset.

For plain CSS, import the stylesheet before your application stylesheet. Normal unlayered application rules override its layered defaults. With Tailwind CSS 4, declare the order before both imports in your application CSS:

```css
@layer theme, base, kind-ui, components, utilities;
@import "tailwindcss";
@import "@kind-ui/charts/styles.css";
```

This order lets normal utility classes override component defaults without `!important`. Low selector specificity alone cannot override an incorrectly ordered cascade layer. Native `style` props on `Root`, `Legend` and `TooltipContent` still take precedence over normal stylesheet rules.

Theme the components with `--kind-ui-chart-border`, `--kind-ui-chart-radius`, `--kind-ui-chart-popover`, `--kind-ui-chart-popover-foreground` and `--kind-ui-chart-legend-background`. They fall back to the existing host tokens; `--chart-legend-background` remains supported. Fixed layout/spacing values can be overridden through classes or CSS rather than a variable for every declaration.

Default legends use 8px markers and 11px labels; interactive legend buttons retain native semantics with a minimum 28px height. The default tooltip uses compact 12px text, slim series markers and tabular values. Override the scoped styles or theme tokens as needed. Pointer positioning stays with the chart integration; the examples demonstrate mouse-following placement with boundary clamping and keyboard fallback.

Stable `data-kind-ui` hooks are `chart`, `chart-legend`, `chart-legend-item`, `chart-legend-button`, `chart-indicator`, `chart-tooltip`, `chart-tooltip-label`, `chart-tooltip-list`, `chart-tooltip-item` and `chart-tooltip-value`. Legend and tooltip items also expose `data-series` with their series key. Use that identity for series-specific styles instead of positional selectors; tooltip entries may be reordered or hidden. Interactive legend buttons retain `aria-pressed` for state styling. For example:

```css
.my-chart [data-series="tasks"] [data-kind-ui="chart-indicator"] {
  border-radius: 50%;
}
```

Per-instance series colors and per-entry indicator color values remain inline CSS variables. They are data-dependent, not theme defaults. Chart dimensions, axes and other engine geometry stay application-owned.

## Develop

At the repository root: `npm ci`, then `npm exec playwright install -- --with-deps chromium` (Linux dependencies may need administrator permission). Run `npm run dev:chart` for the example, or `npm run check` for library, packed-consumer, type and browser checks.

The packed check first builds an actual tarball, installs it and the pinned peer/type dependencies into an isolated consumer, then checks public APIs with NodeNext and Bundler resolution. It also builds a plain-CSS production consumer for the browser checks, verifying CSS delivery and application overrides. Peer installation can require npm registry access; the package under test always comes from the local tarball, never a workspace link or registry copy.
