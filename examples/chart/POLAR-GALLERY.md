# Polar gallery composition coverage

`/polar.html` has two grouped selectors covering eighteen compositions, alongside six task-oriented recipes. The examples own their data and styling.

All native geometry/composition paths were supported by the maintained wrappers before this revision. The prior six recipes did not showcase every grid, custom tick, summary and arc path. This revision closes those demonstration gaps and adds `RadialBarLabel` for the requested bounded band text; it does not add another renderer.

| Gallery variation | Public composition demonstrated and packed-browser checked | Status |
| --- | --- | --- |
| `radar/default` | Filled polygon | Supported + showcased |
| `radar/dots` | Native dot props | Supported + showcased |
| `radar/lines-only` | Two unfilled polygons, no radial grid lines | Supported + showcased |
| `radar/label-custom` | Native custom angle ticks with both scores | Supported + showcased |
| `radar/grid-custom` | Native polarRadius, no radial grid lines | Supported + showcased |
| `radar/grid-none` | Grid omitted | Supported + showcased |
| `radar/grid-circle` | Circular grid | Supported + showcased |
| `radar/grid-circle-no-lines` | Circular grid, no radial lines | Supported + showcased |
| `radar/grid-circle-fill` | Filled circular grid with radial spokes | Supported + showcased |
| `radar/grid-fill` | Filled polygon grid | Supported + showcased |
| `radar/multiple` | Two filled series | Supported + showcased |
| `radar/legend` | Shared accessible series legend | Supported + showcased |
| `radial/simple` | Category-colored Cells and background sectors | Supported + showcased |
| `radial/label` | Category labels inside actual arcs | Supported + showcased |
| `radial/grid` | Native circular grid and category-colored sectors | Supported + showcased |
| `radial/text` | Partial arc with native center Label and annulus grid | Supported + showcased |
| `radial/shape` | Short arc, custom native circle radii and center Label | Supported + showcased |
| `radial/stacked` | Two series with native stackId and half-circle summary | Supported + showcased |

The radial label composition uses native `LabelList position="insideStart"`. Our public band-text example supplies `content={<Chart.RadialBarLabel />}` to the same native LabelList: it follows the actual sector midpoint and endpoints, keeps text upright and hides text whose measured glyph bounds do not fit. Native Label/LabelList content remains available for other label designs. The “shape” variation changes arc extent and PolarGrid radii; it does not require a new custom sector implementation.

Ring text, center summary and tooltip visibility have independent controls. Hiding text does not change data, native sector paths, Root metadata or tooltip payload. Too-short, zero and thin sectors omit text; data tables and tooltip metadata remain available. Phone checks exercise 390px layout. Packed tests traverse all eighteen modes, native grids/dots/custom ticks/stacks, keyboard tooltips, series visibility, full glyph bounds, text/tooltip independence, empty/zero restoration and finite paths. Existing packed polar checks cover native geometry equivalence, refs/handlers, updates, reduced motion, animation interruption and React StrictMode.
