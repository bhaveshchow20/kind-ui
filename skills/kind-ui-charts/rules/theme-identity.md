# Theme, material, and stable identity

Default means omit `material`. Clay and Glow are the opt-in materials:
use `material="clay"` or `material="glow"` when requested.
SankeyNode/SankeyLink select Clay/Glow with `finish`; omit it for Default.
There is no chart-level Sankey appearance `material`. SankeyLink has a separate `material="solid" | "gradient"` paint
choice. Preserve `material="gradient"` when changing its finish; see the
[flow example](../examples/sankey-flows.tsx). Paper was removed in 0.3. Do not silently replace custom SVG paint,
filters, shapes, or geometry with material defaults.

```tsx
// Good: Default, preserving normal paint.
<BarSeries dataKey="revenue" seriesKey="revenue" />
// Bad: material="default" is not a released token.
```

`SeriesConfig` keys are stable metadata identities. They must start with a letter
and contain only letters, digits, underscores, or hyphens. Keep keys independent
of display labels, locale, sort order, and row indices. Match seriesKey and controlled
visibility to those keys. For Pie/Radial category binding, provide explicit
`categoryKey`, unique stable strings matching config, and `interactionBinding="root"`.
Do not assume series visibility automatically provides category interactions.

```tsx
const config = {
  revenue: { label: "Revenue", color: { light: "#3157a5", dark: "#91b5ff" } },
} satisfies SeriesConfig;
```

The host must set `color-scheme: light dark` for theme-aware paint; use an explicit
light/dark value if the app has a theme toggle. Color arrays are gradient stops,
not category palettes. Both theme branches are required. CSS color strings and CSS
variables work when the app owns theme resolution. Explicit native paint retains
ownership and can override configured paint; check chart and legend agreement.

Use readable text labels and, where useful, patterns or shapes so color is not
the only encoding. Config icons decorate legend/tooltip; they are not accessible
names. Verify contrast in each supported theme rather than assuming Glow fixes it.
