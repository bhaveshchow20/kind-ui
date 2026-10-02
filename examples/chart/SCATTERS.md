# Scatter recipes

`scatters.html` composes maintained `@kind-ui/charts` exports with public Recharts axes, marks, Cells and labels. No geometry or interaction implementation is copied into recipes.

- **Two series:** latency in milliseconds versus acceptance in percent, explicit numeric domains, independent series colors and controlled legend, immutable week updates.
- **Bubble area:** a native `ZAxis` maps 0–300 thousand requests to 35–1,200 square pixels. A minimum visible marker means area is not directly proportional to volume; the tooltip/table supplies the precise values.
- **Signed and overlapping:** positive/negative x and y, zero at the origin, native reference lines, custom diamond marks and labels. Dune and Ember share coordinates; neither is deduplicated or jittered. Missing y does not create an origin mark. The host excludes missing y from this plot (and its labels) while the table retains the record. The shared Dune/Ember label avoids overlapping text without moving either mark.
- **Size completeness:** native Recharts 3.10.1 uses the minimum Z range for both zero and missing z and omits their Z tooltip entries. The maintained default `ScatterTooltip` uses explicit `zDimension` to show the raw zero or “No data”. Native geometry stays unchanged. Negative request counts are excluded by this host and disclosed in the complete table.

Hover/touch selection is native per point. Native arrow navigation visits the first registered Scatter series in its data order; it is not spatial navigation and does not traverse every series. The data tables provide keyboard access to all observations, including duplicate and missing records. This is a tested Chromium composition, not an assistive technology conformance claim.

The same components accept `animate={false}`, `animate`, or a `ScatterAnimation` configuration. Entrance fades native marks at their final positions; it does not interpolate x/y/z or infer ordering from a category line. Focus, pointer/key interaction, data replacement, x/y geometry, resize and visibility changes settle entrance; off/reduced motion snaps the fade and measured tooltip positioning. Later toggles do not replay an entrance after interaction. Active custom shapes, labels and native line/fit options remain engine-owned.

These recipes have 4–11 points per chart. No large-data, canvas, clustering, collision avoidance, auto-size legend, or all-series chart-keyboard navigation guarantee is made. Provide domain validation and a data alternative appropriate to your own units.

Primary references inspected: [Scatter API](https://recharts.github.io/en-US/api/Scatter/), [ScatterChart API](https://recharts.github.io/en-US/api/ScatterChart/), [Bubble example](https://recharts.github.io/en-US/examples/BubbleChart/), [three-dimensional example](https://recharts.github.io/en-US/examples/ThreeDimScatterChart/), and the pinned MIT Recharts 3.10.1 installed `Scatter`, `scatterSelectors`, `keyboardEventsMiddleware`, and `combineTooltipPayloadConfigurations` implementation. Referenced behavior only; no upstream implementation is copied.
